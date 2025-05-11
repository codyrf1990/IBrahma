import { state, getStateForSave, replaceState } from './state.js';
import { showMessage, parseAmount, formatDate } from './utils.js';
import { createNewMonthSection, updateMonthSection, sortClientsByDate, sortMonthSections, createAutoSaveIndicator, displaySummaryStatistics, rebuildClientListFromState, createRowElement } from './domUtils.js';
import { calculateMonthlySubtotal } from './calculations.js';

// --- Data Persistence Functions ---

/**
 * Saves the current state of the license data (rows and checked status) to local storage.
 */
export function saveData() {
    console.log('saveData CALLED. Timestamp:', new Date().toLocaleTimeString());
    try {
        const stateClients = state.clients;
        console.log('Attempting to save clients:', JSON.stringify(stateClients));
        console.log('Attempting to save checkedRows:', JSON.stringify(state.checkedRows));
        console.log('Attempting to save receiptsGoal:', state.receiptsGoal);
        const dataToSave = {
            ...getStateForSave(),
            clients: stateClients.map(c => ({ ...c, notes: c.notes || '' }))
        };

        localStorage.setItem('licenseData', JSON.stringify(dataToSave));
        state.lastSaved = new Date();
        // console.log('Data saved to local storage at', state.lastSaved);

        // Update auto-save indicator
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.textContent = `Last saved: ${state.lastSaved.toLocaleTimeString()}`;
            indicator.style.color = 'var(--text-muted)';
        } else {
            createAutoSaveIndicator(); // Create if it doesn't exist
        }

    } catch (error) {
        console.error('Error saving data to local storage:', error);
        showMessage('Error saving data', 'error');
        // Update indicator with error
        const indicator = document.getElementById('auto-save-indicator');
        if (indicator) {
            indicator.textContent = 'Save failed';
            indicator.style.color = 'var(--error-color)';
        }
    }
}

/**
 * Loads initial data from local storage when the application starts.
 */
export function loadInitialData() {
    console.log('loadInitialData CALLED. Timestamp:', new Date().toLocaleTimeString());
    try {
        // Load main license data
        const savedData = localStorage.getItem('licenseData');
        console.log('Raw data from localStorage:', savedData);
        if (savedData) {
            console.log("Loading data from local storage...");
            validateAndImport(savedData);
        } else {
             console.log("No saved data found in local storage.");
             // Initial setup if no data exists
             sortMonthSections();
        }

        // Set initial view and update display
        createAutoSaveIndicator(); // Create indicator on load

        // IMPORTANT: The actual UI update (stats, totals) should happen *after* load
        // This is handled by calling updateUIAndSummaries() in main.js after loadInitialData()

    } catch (error) {
        console.error('Error loading initial data:', error);
        showMessage('Error loading saved data: ' + error.message, 'error');
        // Reset or clear state if loading fails?
        localStorage.removeItem('licenseData'); // Clear corrupted data
        state.checkedRows = [];
    }
}

// --- Data Import/Export and Validation ---

/**
 * Displays a preview of the data to be imported.
 * @param {string} jsonData - The JSON string containing the data to preview.
 */
export function previewImportData(jsonData) {
    const previewArea = document.getElementById('import-preview-area');
    const importConfirmButton = document.getElementById('import-confirm-button');
    const importPreviewContainer = document.getElementById('import-preview-container');

    if (!previewArea || !importConfirmButton || !importPreviewContainer) {
        console.error('Import preview elements not found');
        showMessage('Import UI elements missing', 'error');
        return;
    }

    try {
        const data = JSON.parse(jsonData);
        // Basic validation of structure
        if (!data || !Array.isArray(data.clients)) {
            throw new Error('Invalid data structure for import');
        }

        previewArea.textContent = JSON.stringify(data, null, 2); // Pretty print JSON
        importPreviewContainer.style.display = 'block';
        // Store data temporarily for confirmation
        importConfirmButton.dataset.importData = jsonData;

    } catch (error) {
        console.error('Error previewing import data:', error);
        showMessage(`Import Error: ${error.message}`, 'error');
        previewArea.textContent = `Error loading preview: ${error.message}`;
        importPreviewContainer.style.display = 'block';
        importConfirmButton.dataset.importData = ''; // Clear invalid data
    }
}

/**
 * Validates and imports data from a JSON string (typically from localStorage or a file import).
 * Clears existing data and rebuilds the UI.
 * @param {string} jsonData The JSON string to import.
 */
export function validateAndImport(jsonData) {
    console.log('validateAndImport CALLED. Timestamp:', new Date().toLocaleTimeString());
    let data;
    try {
        data = JSON.parse(jsonData);
        console.log('Parsed data for import:', data);
        if (!data || typeof data !== 'object') {
            throw new Error("Invalid data format: not an object.");
        }

        // Basic validation (ensure this is comprehensive enough or rely on replaceState's defaults)
        if (!Array.isArray(data.clients)) {
            throw new Error("Invalid data format: 'clients' array missing or not an array.");
        }
        // It's good practice to ensure notes exist, replaceState should also handle this.
        // data.clients = data.clients.map(client => ({ ...client, notes: client.notes || '' }));

    } catch (error) {
        console.error('Error parsing or validating imported data:', error);
        showMessage(`Import failed: ${error.message}`, 'error');
        return; // Stop import
    }

    console.log("Data validated. Proceeding with import.");

    // --- MODIFICATION START ---
    // 1. Update state object with loaded data
    replaceState(data); // This will set state.clients, state.checkedRows, state.receiptsGoal

    // 2. Clear existing UI (main-container)
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        mainContainer.innerHTML = ''; // Clear all existing month sections and rows
    } else {
        console.error("validateAndImport: Main container #main-container not found. UI cannot be cleared or rebuilt.");
        showMessage('Critical error: UI container missing.', 'error');
        return; // Cannot proceed
    }
    
    // 3. Update input fields for goal (already handled by replaceState indirectly if goalInput exists and is updated by a general UI refresh)
    // Re-check if goalInput needs explicit update after replaceState or if updateUIAndSummaries handles it.
    // For now, let's assume `updateUIAndSummaries` or direct setting in `replaceState` handles UI input fields.
    const goalInput = document.getElementById('receipts-goal-input');
    if (goalInput) goalInput.value = state.receiptsGoal;


    // 4. Rebuild the entire client list display from the now-updated state.clients
    rebuildClientListFromState(); // This function should use state.clients and createRowElement

    // REMOVE THE MANUAL DOM CREATION LOOP - rebuildClientListFromState handles this.
    // The old loop that iterated data.clients and manually created TRs/TDs is GONE.
    // --- MODIFICATION END ---


    // Sort and update summaries (these should use the DOM built by rebuildClientListFromState or use state directly)
    sortClientsByDate(); // Sorts rows within newly created month sections
    sortMonthSections(); // Sorts the month sections themselves
    
    // updateUIAndSummaries() is called in main.js after loadInitialData completes.
    // If called here, ensure it uses the correct state or DOM.
    // For now, deferring to main.js call. If issues persist, may need to call it here.
    // No, main.js calls updateUIAndSummaries AFTER loadInitialData.
    // loadInitialData calls validateAndImport. So updateUIAndSummaries is called AFTER this.
    // This seems correct.

    console.log("validateAndImport: Data import processed using replaceState and rebuildClientListFromState.");
}