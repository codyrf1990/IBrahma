import { state, getStateForSave } from './state.js';
import { showMessage, parseAmount, formatDate } from './utils.js';
import { createNewMonthSection, updateMonthSection, sortClientsByDate, sortMonthSections, createAutoSaveIndicator, displaySummaryStatistics } from './domUtils.js';
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

        // Basic validation
        if (!Array.isArray(data.clients)) {
            throw new Error("Invalid data format: 'clients' array missing or not an array.");
        }
        if (data.checkedRows && !Array.isArray(data.checkedRows)) {
            throw new Error("Invalid data format: 'checkedRows' is not an array.");
        }
        if (data.receiptsGoal && typeof data.receiptsGoal !== 'number') {
            throw new Error("Invalid data format: 'receiptsGoal' is not a number.");
        }

        if (Array.isArray(data.clients)) {
            data.clients = data.clients.map(client => ({
                ...client,
                notes: client.notes || ''
            }));
        }

    } catch (error) {
        console.error('Error parsing or validating imported data:', error);
        showMessage(`Import failed: ${error.message}`, 'error');
        return; // Stop import
    }

    console.log("Data validated. Proceeding with import.");

    // Clear existing UI and state
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        mainContainer.innerHTML = ''; // Clear all existing month sections and rows
    }
    state.checkedRows = [];
    state.totals = {}; // Reset totals state

    state.receiptsGoal = data.receiptsGoal || 0;
    // Restore checkedRows carefully, filtering any potential invalid IDs later if needed
    state.checkedRows = Array.isArray(data.checkedRows) ? data.checkedRows : [];

    // Update input fields for goal and pool
    const goalInput = document.getElementById('receipts-goal-input');
    const poolInput = document.getElementById('total-pool-input');
    if (goalInput) goalInput.value = state.receiptsGoal;

    // Map to store tbodies for efficient row insertion
    const monthTbodyMap = new Map();
    // Temporary store for clients grouped by month from the import data
    const clientsByMonth = {};

    // First pass: Group clients by month from the imported data
    data.clients.forEach(client => {
        if (!client || !client.closeDate) return; // Basic check
        try {
            const month = new Date(client.closeDate + 'T00:00:00').toLocaleString('en-US', { month: 'long' }).toLowerCase();
            if (!clientsByMonth[month]) {
                clientsByMonth[month] = [];
            }
            clientsByMonth[month].push(client);
        } catch (e) {
            console.error("validateAndImport: Error grouping client by month", client, e);
        }
    });

    // Second pass: Process clients, rebuild UI, and create month sections
    data.clients.forEach(client => {
        try {
            // Validate essential fields
            if (!client.id || !client.name || !client.closeDate || !client.renewalDate || typeof client.amount === 'undefined') {
                console.warn('Skipping invalid client object:', client);
                return; // Skip this client
            }

            const month = new Date(client.closeDate + 'T00:00:00').toLocaleString('en-US', { month: 'long' }).toLowerCase();
            let monthTbody = monthTbodyMap.get(month);

            // Create month section if it doesn't exist
            if (!monthTbody) {
                monthTbody = createNewMonthSection(month);
                if (!monthTbody) {
                     console.error(`Failed to create or find tbody for month: ${month}. Skipping row.`);
                    return; // Skip if section/tbody creation failed
                }
                monthTbodyMap.set(month, monthTbody);
            }

            // Create row element with proper attributes
            const row = document.createElement('tr');
            row.classList.add('client-row');
            row.id = client.id;
            
            // Set all data attributes consistently
            row.setAttribute('data-opportunity-id', client.opportunityId || '');
            row.setAttribute('data-renewal-date', client.renewalDate || '');
            row.setAttribute('data-sent-date', client.sentDate || '');
            row.setAttribute('data-close-date', client.closeDate || '');

            row.innerHTML = `
                <td class="td-checkbox"><input type="checkbox" class="custom-checkbox" data-row-id="${client.id}" ${client.isChecked ? 'checked' : ''}></td>
                <td class="td-name">${client.name}</td>
                <td class="td-renewal-date">${formatDate(client.renewalDate)}</td>
                <td class="td-sent-date">${formatDate(client.sentDate || '')}</td>
                <td class="td-close-date">${formatDate(client.closeDate)}</td>
                <td class="td-amount">USD ${client.amount}</td>
                <td class="td-opp-id">${client.opportunityId || '-'}</td>
                <td class="td-actions">
                    <span class="action-icon edit-icon" title="Edit">&#9998;</span>
                    <span class="action-icon delete-icon" title="Delete">&#10006;</span>
                 </td>
            `;

            // Apply checked class if necessary
            if (client.isChecked) {
                row.classList.add('checked');
                // Ensure ID is in state.checkedRows if marked as checked in data
                if (!state.checkedRows.includes(client.id)) {
                     state.checkedRows.push(client.id);
                }
            } else {
                 // Ensure ID is NOT in state.checkedRows if not checked
                 const index = state.checkedRows.indexOf(client.id);
                 if (index > -1) {
                     state.checkedRows.splice(index, 1);
                 }
            }

            // Append row to the correct month tbody
            monthTbody.appendChild(row);

        } catch (rowError) {
            console.error('Error processing individual client during import:', client, rowError);
            // Continue processing other clients
        }
    });

    // Third pass: Update counts and subtotals for all created month sections AFTER rows are added
    monthTbodyMap.forEach((tbody, month) => {
        // Calculate subtotal for this month using the helper and the grouped data
        const monthlySubtotal = calculateMonthlySubtotal(month, clientsByMonth[month] || []);
        updateMonthSection(month, monthlySubtotal); // Pass the calculated subtotal
    });

    // Now that all rows and sections are potentially created, sort them
    // and update the global totals display.
    sortMonthSections(); // Sort the month sections chronologically
    sortClientsByDate(); // Sort clients within each month

    // Final UI updates after successful import
    sortClientsByDate();
    sortMonthSections();

    console.log("Data validated and imported successfully.");

    // Optionally, save the potentially cleaned/validated data back to localStorage
    // This ensures consistency if any invalid rows were skipped
    saveData();

    showMessage('Data imported successfully!', 'success');
    console.log("Import process completed.");
}