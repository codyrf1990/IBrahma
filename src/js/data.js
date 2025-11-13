import { state, getStateForSave, replaceState } from './state.js';
import { showMessage, parseAmount, formatDate } from './utils.js';
import { createNewMonthSection, updateMonthSection, sortClientsByDate, sortMonthSections, createAutoSaveIndicator, displaySummaryStatistics, rebuildClientListFromState, createRowElement, sortRowsByField, updateSortIndicators } from './domUtils.js';
import { calculateMonthlySubtotal } from './calculations.js';
import { discoverYearsFromData, rebuildYearTabs } from './yearTabs.js';

// --- Data Persistence Functions ---

/**
 * Saves the current state of the license data (rows and checked status) to local storage.
 */
export function saveData() {
    try {
        const stateClients = state.clients;
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
    try {
        // Load main license data
        const savedData = localStorage.getItem('licenseData');
        if (savedData) {
            validateAndImport(savedData, true); // Pass true for initial load (load ALL years)
        } else {
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
 * @param {string} jsonData The JSON string to import.
 * @param {boolean} isInitialLoad If true, loads ALL years. If false, replaces only active year's data.
 */
export function validateAndImport(jsonData, isInitialLoad = false) {
    let data;
    try {
        data = JSON.parse(jsonData);
        if (!data || typeof data !== 'object') {
            throw new Error("Invalid data format: not an object.");
        }

        // Basic validation
        if (!Array.isArray(data.clients)) {
            throw new Error("Invalid data format: 'clients' array missing or not an array.");
        }

    } catch (error) {
        console.error('Error parsing or validating imported data:', error);
        showMessage(`Import failed: ${error.message}`, 'error');
        return; // Stop import
    }

    if (isInitialLoad) {
        // --- INITIAL LOAD: Load ALL years ---
        // 1. Load all clients from data
        state.clients = data.clients.map(client => ({
            ...client,
            notes: client.notes || ''
        }));

        // 2. Update other state properties
        if (typeof data.receiptsGoal === 'number') {
            state.receiptsGoal = data.receiptsGoal;
        }
        if (typeof data.searchTerm === 'string') {
            state.searchTerm = data.searchTerm;
        }
        if (typeof data.activeYear === 'number') {
            state.activeYear = data.activeYear;
        }
        if (Array.isArray(data.availableYears)) {
            state.availableYears = data.availableYears;
        }
        if (Array.isArray(data.checkedRows)) {
            state.checkedRows = data.checkedRows;
        }

        // 3. Update goal input
        const goalInput = document.getElementById('receipts-goal-input');
        if (goalInput) goalInput.value = state.receiptsGoal;

        // 4. Discover years from ALL loaded data
        discoverYearsFromData();

        // 5. Rebuild year tabs and UI
        rebuildYearTabs();
        rebuildClientListFromState(); // This filters by active year for display

        // 6. Sort and update
        sortRowsByField(state.sortPreferences.field, state.sortPreferences.direction);
        updateSortIndicators(state.sortPreferences.field, state.sortPreferences.direction);
        sortMonthSections();

    } else {
        // --- FILE IMPORT: Replace ONLY active year's data ---
        // 1. Filter incoming clients to active year only
        const incomingClients = data.clients.filter(client => {
            if (!client.closeDate || client.closeDate.length < 4) return false;
            const year = parseInt(client.closeDate.substring(0, 4), 10);
            return year === state.activeYear;
        });

        // 2. Get existing client IDs from active year (for checkedRows cleanup)
        const existingActiveYearIds = new Set(
            state.clients
                .filter(client => {
                    if (!client.closeDate || client.closeDate.length < 4) return false;
                    const year = parseInt(client.closeDate.substring(0, 4), 10);
                    return year === state.activeYear;
                })
                .map(client => client.id)
        );

        // 3. Remove active year's data from state.clients (keep other years)
        state.clients = state.clients.filter(client => {
            if (!client.closeDate || client.closeDate.length < 4) return true; // Keep invalid dates
            const year = parseInt(client.closeDate.substring(0, 4), 10);
            return year !== state.activeYear; // Keep everything except active year
        });

        // 4. Add incoming active year data
        state.clients = state.clients.concat(incomingClients.map(client => ({
            ...client,
            notes: client.notes || ''
        })));

        // 5. Update checkedRows - remove deleted active year entries
        state.checkedRows = state.checkedRows.filter(id => !existingActiveYearIds.has(id));

        // 6. Update other state properties from imported data
        if (typeof data.receiptsGoal === 'number') {
            state.receiptsGoal = data.receiptsGoal;
        }
        if (typeof data.searchTerm === 'string') {
            state.searchTerm = data.searchTerm;
        }
        if (Array.isArray(data.checkedRows)) {
            // Merge incoming checked rows (but only for active year clients)
            const incomingClientIds = new Set(incomingClients.map(c => c.id));
            const incomingChecked = data.checkedRows.filter(id => incomingClientIds.has(id));
            state.checkedRows = [...new Set([...state.checkedRows, ...incomingChecked])];
        }

        // 7. Update goal input
        const goalInput = document.getElementById('receipts-goal-input');
        if (goalInput) goalInput.value = state.receiptsGoal;

        // 8. Discover years and rebuild year tabs
        discoverYearsFromData();
        rebuildYearTabs();

        // 9. Rebuild UI from state
        rebuildClientListFromState(); // This already filters by active year

        // 10. Sort and update
        sortRowsByField(state.sortPreferences.field, state.sortPreferences.direction);
        updateSortIndicators(state.sortPreferences.field, state.sortPreferences.direction);
        sortMonthSections();

        // 11. Save updated state
        saveData();

        showMessage(`Loaded ${incomingClients.length} renewals for ${state.activeYear}`, 'success');
    }
}