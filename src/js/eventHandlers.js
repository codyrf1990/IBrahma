import { state } from './state.js';
import { formatCurrency, showMessage, generateId, formatDate, getMonthFromDate, parseAmount } from './utils.js';
import { saveData } from './data.js';
import { createNewMonthSection, updateMonthSection, sortClientsByDate, sortMonthSections, clearForm, closeEditModal, createRowElement, getAllClientsFromDOM, hideAddRenewalModal, rebuildClientListFromState } from './domUtils.js';
import { updateUIAndSummaries } from './main.js';
import { calculateMonthlySubtotal } from './calculations.js';
import { getStateForSave, replaceState } from './state.js';

// --- Event Handler Functions ---

/**
 * Handles adding a new license entry from the main form.
 */
export function addLicense() {
    try {
        // Get form values
        const name = document.getElementById('account-name').value.trim();
        const renewalDate = document.getElementById('renewal-date').value; // YYYY-MM-DD
        const sentDate = document.getElementById('sent-date').value; // YYYY-MM-DD
        const closeDate = document.getElementById('close-date').value; // YYYY-MM-DD
        let amount = parseFloat(document.getElementById('amount').value);
        const opportunityId = document.getElementById('opportunity-id').value.trim();

        // Validation
        if (!name || !closeDate) {
             showMessage('Account Name and Close Date are required', 'error');
             return;
        }

        if (isNaN(amount)) {
            amount = 0;
            console.warn('Invalid amount entered, defaulting to 0');
        }

        const month = getMonthFromDate(closeDate);

        // Find or create month section's table body
        let monthTableBody = document.getElementById(`${month}-clients-body`);
        if (!monthTableBody) {
            monthTableBody = createNewMonthSection(month);
            if (!monthTableBody) {
                throw new Error(`Failed to create or find table body for month: ${month}`);
            }
        }

        const rowId = generateId();

        // Prepare license data object
        const licenseData = {
            id: rowId,
            name,
            renewalDate, // Keep as YYYY-MM-DD
            sentDate,    // Keep as YYYY-MM-DD
            closeDate,   // Keep as YYYY-MM-DD
            amount,
            opportunityId,
            isChecked: false // New rows are unchecked by default
        };

        // Create the row element using the new utility function
        const newRowElement = createRowElement(licenseData);

        // Append the new row element to the table body
        monthTableBody.appendChild(newRowElement);

        // Add highlight effect
        newRowElement.classList.add('row-highlight-success');
        setTimeout(() => {
            newRowElement.classList.remove('row-highlight-success');
        }, 1500); // Match animation duration

        updateUIAndSummaries();
        clearForm();
        saveData(); // Save the updated state (saveData needs adjustment later)
        
        // Hide the modal after successful submission
        hideAddRenewalModal();
        showMessage('Renewal added successfully', 'success');

    } catch (error) {
        console.error('Error adding license:', error);
        showMessage(error.message || 'Failed to add license', 'error');
    }
}

/**
 * Toggles the checked state of a row based on checkbox interaction.
 * @param {string} rowId - The ID of the row to toggle.
 */
export function toggleChecked(rowId) {
    console.log('[CheckboxHandler] Function entered for rowId:', rowId); // Changed initial log slightly
    const row = document.getElementById(rowId);
    if (!row) {
        console.error('[CheckboxHandler] Row element not found for ID:', rowId);
        return;
    }

    const checkbox = row.querySelector('.custom-checkbox');
    if (!checkbox) {
         console.error('[CheckboxHandler] Checkbox element not found within row:', rowId);
         return;
    }

    // We don't have the direct 'event' here, so we read the checkbox's current state
    const newCheckedStatus = checkbox.checked;
    console.log('[CheckboxHandler] Associated Client ID:', rowId); // Log client ID
    console.log('[CheckboxHandler] New checked status (read from DOM):', newCheckedStatus);

    // --- State Update ---
    // This function updates both the DOM class and the state.checkedRows array
    console.log(`[CheckboxHandler] Attempting to update state/DOM for ID: ${rowId} to ${newCheckedStatus}`);
    if (newCheckedStatus) {
        row.classList.add('checked');
        if (!state.checkedRows.includes(rowId)) {
            console.log('[CheckboxHandler] Adding rowId to state.checkedRows');
            state.checkedRows.push(rowId);
        }
    } else {
        row.classList.remove('checked');
        console.log('[CheckboxHandler] Removing rowId from state.checkedRows');
        state.checkedRows = state.checkedRows.filter(id => id !== rowId);
    }

    // --- Update isChecked property in state.clients ---
    const clientIndex = state.clients.findIndex(client => client.id === rowId);
    if (clientIndex !== -1) {
        state.clients[clientIndex].isChecked = newCheckedStatus;
        console.log(`[CheckboxHandler] Updated state.clients for ID ${rowId}: isChecked = ${newCheckedStatus}`);
    } else {
        console.warn(`[CheckboxHandler] Client with ID ${rowId} not found in state.clients.`);
    }
    // console.log('[CheckboxHandler] state.checkedRows after update:', JSON.stringify(state.checkedRows));

    console.log('[CheckboxHandler] State/DOM update performed.');
    // Optional: Log state after update
    // console.log('[CheckboxHandler] state.checkedRows after update:', JSON.stringify(state.checkedRows));

    // --- UI Refresh ---
    console.log('[CheckboxHandler] Attempting to call updateUIAndSummaries()...');
    updateUIAndSummaries();
    console.log('[CheckboxHandler] updateUIAndSummaries() called.');

    // --- Persist Changes ---
    saveData(); // Save the updated state 
    console.log('[CheckboxHandler] saveData() called.');

    console.log('[CheckboxHandler] Handler execution finished for rowId:', rowId);
}

/**
 * Deletes a license row from the table and updates totals.
 * @param {string} rowId - The ID of the row to delete.
 */
export function deleteRow(rowId) {
    try {
        const row = document.getElementById(rowId);
        if (!row) {
            throw new Error('Row not found for deletion');
        }

        const monthSection = row.closest('.month-section');
        const month = monthSection ? monthSection.id.replace('-section', '') : null;

        // Add fade-out effect
        row.classList.add('row-fade-out');

        // Wait for fade animation to complete before removing
        setTimeout(() => {
            row.remove();

            // Remove from checkedRows state if present
            state.checkedRows = state.checkedRows.filter(id => id !== rowId);

            if (month) {
                const allClients = getAllClientsFromDOM(); // Get current data from DOM
                const monthSubtotal = calculateMonthlySubtotal(month, allClients);
                updateMonthSection(month, monthSubtotal); // Update count/subtotal, potentially removes section
            }

            updateUIAndSummaries();
            saveData(); // Save changes
            showMessage('License deleted successfully', 'success');

        }, 500); // Match transition duration in CSS

    } catch (error) {
        console.error(`Error deleting row: ${rowId}`, error);
        showMessage(error.message || 'Failed to delete row', 'error');
    }
}

/**
 * Saves changes made in the edit modal to the corresponding row.
 */
export function saveEditChanges() {
    const rowId = state.editingRowId;
    if (!rowId) {
        showMessage('No row selected for editing', 'error');
        return;
    }

    const row = document.getElementById(rowId);
    if (!row) {
        showMessage('Row to edit not found in the table', 'error');
        closeEditModal();
        return;
    }

    try {
        // Get updated values from modal form
        const name = document.getElementById('edit-name').value.trim();
        const renewalDate = document.getElementById('edit-renewal-date').value; // YYYY-MM-DD
        const sentDate = document.getElementById('edit-sent-date').value; // YYYY-MM-DD
        const closeDate = document.getElementById('edit-date').value; // YYYY-MM-DD
        let amount = parseFloat(document.getElementById('edit-amount').value);
        const opportunityId = document.getElementById('edit-opportunity-id').value.trim();

         // Basic validation
        if (!name) {
             showMessage('Account Name cannot be empty', 'error');
             return; // Keep modal open
        }
         if (!closeDate) {
             showMessage('Close Date cannot be empty', 'error');
             return; // Keep modal open
         }

        if (isNaN(amount)) {
            amount = 0;
            console.warn('Invalid amount in edit modal, defaulting to 0');
        }

        // Get original month before potential change
        const originalMonthSection = row.closest('.month-section');
        const originalMonth = originalMonthSection ? originalMonthSection.id.replace('-section', '') : null;

        // Update row data attributes and cell content
        row.setAttribute('data-opportunity-id', opportunityId);
        row.setAttribute('data-renewal-date', renewalDate || '');
        row.setAttribute('data-sent-date', sentDate || '');
        row.setAttribute('data-close-date', closeDate || '');

        // Get all cell elements in the row
        const nameCell = row.querySelector('.td-name');
        const renewalDateCell = row.querySelector('.td-renewal-date');
        const sentDateCell = row.querySelector('.td-sent-date');
        const closeDateCell = row.querySelector('.td-close-date');
        const amountCell = row.querySelector('.td-amount');
        const oppIdCell = row.querySelector('.td-opp-id');

        // Ensure proper formatting and order of displayed data (matching createRowElement)
        if (nameCell) nameCell.textContent = name;
        if (renewalDateCell) renewalDateCell.textContent = formatDate(renewalDate);
        if (sentDateCell) sentDateCell.textContent = formatDate(sentDate);
        if (closeDateCell) closeDateCell.textContent = formatDate(closeDate);
        if (amountCell) amountCell.textContent = `USD ${formatCurrency(amount)}`;
        if (oppIdCell) oppIdCell.textContent = opportunityId;

        // Add highlight effect
        row.classList.add('row-highlight-success');
        setTimeout(() => {
            row.classList.remove('row-highlight-success');
        }, 1500); // Match animation duration

        // Get the new month based on the potentially updated closeDate
        const newMonth = getMonthFromDate(closeDate);
        let needsResort = false;

        if (originalMonth && newMonth !== originalMonth) {
            // Month changed, move the row
            let newMonthTableBody = document.getElementById(`${newMonth}-clients-body`);
            if (!newMonthTableBody) {
                newMonthTableBody = createNewMonthSection(newMonth);
                if (!newMonthTableBody) {
                     throw new Error(`Failed to create section for new month: ${newMonth}`);
                }
                 needsResort = true; // Need to sort sections if a new one was added
            }
            newMonthTableBody.appendChild(row); // Move the row element

            // Update counts/subtotals for both old and new months
            const allClients = getAllClientsFromDOM(); // Get current data state
            const originalMonthSubtotal = calculateMonthlySubtotal(originalMonth, allClients);
            const newMonthSubtotal = calculateMonthlySubtotal(newMonth, allClients);

            updateMonthSection(originalMonth, originalMonthSubtotal);
            updateMonthSection(newMonth, newMonthSubtotal);
        } else if (originalMonth) {
            // Month did not change, just update the original month's totals
            const allClients = getAllClientsFromDOM(); // Get current data state
            const monthSubtotal = calculateMonthlySubtotal(originalMonth, allClients);
            updateMonthSection(originalMonth, monthSubtotal);
        }

        // Always recalculate totals and update display
        updateUIAndSummaries();

        // Sort rows within the affected month(s)
        sortClientsByDate(); // Could optimize to only sort affected month(s)

        // Sort month sections if a new one was added or if order might change
        if (needsResort) {
             sortMonthSections();
        }

        closeEditModal();
        const allClients = getAllClientsFromDOM(); // Get current data state after edit
        const monthSubtotal = calculateMonthlySubtotal(originalMonth, allClients);
        updateMonthSection(originalMonth, monthSubtotal);
        saveData(); // Save changes
        showMessage('License updated successfully', 'success');

    } catch (error) {
        console.error('Error saving edit changes:', error);
        showMessage(error.message || 'Failed to save changes', 'error');
        // Optionally keep the modal open on error?
    }
}

/**
 * Updates the receipts goal based on input field change.
 */
export function updateReceiptsGoal() {
    console.log('updateReceiptsGoal called'); // Log function call
    const goalInput = document.getElementById('receipts-goal-input');
    if (!goalInput) {
        console.error('Receipts goal input element (#receipts-goal-input) not found.');
        showMessage('Could not find goal input element.', 'error');
        return;
    }
    const newValue = parseInt(goalInput.value, 10);
    console.log('Goal Input Value:', goalInput.value, 'Parsed Value:', newValue); // Log input and parsed value

    if (!isNaN(newValue) && newValue >= 0) {
        state.receiptsGoal = newValue;
        console.log('Goal updated state.receiptsGoal to:', state.receiptsGoal); // Log state update
        updateUIAndSummaries(); // Update displays that use receiptsGoal
        saveData(); // Save the change
    } else {
        console.log('Goal validation failed.'); // Log validation failure
        // Optional: Revert to old value or show error
        goalInput.value = state.receiptsGoal; // Revert
        showMessage('Please enter a valid number for Receipts Goal', 'error');
    }
    showMessage('Receipts goal updated.', 'success');
}

/**
 * Updates the quick percentage calculator results based on the input amount.
 * Ensures elements are not destroyed during updates.
 */
export function updatePercentageCalculator() {
    const amountInput = document.getElementById('calculator-amount'); // Use the CORRECT ID for the amount input field identified in step 2
    if (!amountInput) {
        console.error("Calculator amount input field not found!");
        return;
    }
    const amount = parseFloat(amountInput.value) || 0;

    const fivePercentValue = (amount * 0.05).toFixed(0);
    const tenPercentValue = (amount * 0.10).toFixed(0);
    const fifteenPercentValue = (amount * 0.15).toFixed(0);

    // Helper to safely update content
    const updateResultContainer = (containerId, labelText, value) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Result container #${containerId} not found!`);
            return;
        }
        // Find existing spans IF THEY EXIST
        let labelSpan = container.querySelector('.result-label');
        let valueSpan = container.querySelector('.result-value');

        if (!labelSpan || !valueSpan) {
            // If structure doesn't exist, create it
            container.innerHTML = `<span class="result-label">${labelText}</span><span class="result-value">${value}</span>`;
        } else {
            // If structure exists, just update the value text
            valueSpan.textContent = value;
            // Optional: ensure label is correct too, though it shouldn't change
            // labelSpan.textContent = labelText;
        }
    };

    // Update each result container using their stable IDs
    updateResultContainer('result-container-5', '5%', fivePercentValue);
    updateResultContainer('result-container-10', '10%', tenPercentValue);
    updateResultContainer('result-container-15', '15%', fifteenPercentValue);
}

// --- Save/Load Event Handlers ---

/**
 * Handles the click event for the "Save to File" button.
 * Retrieves the current application state, converts it to JSON, and initiates a download.
 */
export function handleSaveToFile() {
    try {
        const stateToSave = getStateForSave();
        if (!stateToSave) {
            console.error("[Save] Could not get state for saving.");
            alert("Error: Could not retrieve data to save."); // User feedback
            return;
        }
        // Convert state to JSON string
        const jsonString = JSON.stringify(stateToSave, null, 2); // Pretty print JSON
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        // Create a temporary link to trigger the download
        const link = document.createElement('a');
        link.href = url;
        link.download = 'solidcam-tracker-data.json'; // Default filename

        // Append to body, click, and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up the object URL
        URL.revokeObjectURL(url);

        console.log("[Save] Data saved to file initiated.");
        // Optionally show a success message
        // showMessage('Data export initiated.', 'success');
    } catch (error) {
        console.error("[Save] Error saving data to file:", error);
        alert("An error occurred while saving the data."); // User feedback
    }
}

/**
 * Handles the click event for the "Load from File" button.
 * Programmatically clicks the hidden file input element.
 */
export function handleLoadClick() {
    const fileInputElement = document.getElementById('file-input');
    if (fileInputElement) {
        console.log("[Load] Triggering file input click.");
        fileInputElement.click(); // Trigger the file selection dialog
    } else {
        console.error("[Load] File input element (#file-input) not found.");
        alert("Error: Could not find the file input element.");
    }
}

/**
 * Handles the 'change' event for the hidden file input.
 * Reads the selected file, parses it as JSON, validates, replaces the state, and updates the UI.
 * @param {Event} event - The file input change event object.
 */
export function handleFileLoad(event) {
    const file = event.target.files[0];
    if (!file) {
        console.log("[Load] No file selected.");
        return; // No file selected
    }

    console.log(`[Load] File selected: ${file.name}, Type: ${file.type}, Size: ${file.size} bytes`);

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const fileContent = e.target.result;
            console.log("[Load] File read successfully. Attempting to parse JSON...");
            const loadedState = JSON.parse(fileContent);
            console.log("[Load] JSON parsed successfully:", loadedState);

            // Basic Validation (Ensure it's an object and has expected top-level keys)
            // TODO: Add more robust validation based on expected object structure
            if (typeof loadedState === 'object' && loadedState !== null && Array.isArray(loadedState.clients) && typeof loadedState.receiptsGoal === 'number' && Array.isArray(loadedState.checkedRows)) {
                console.log("[Load] Loaded state appears valid. Replacing current state...");
                replaceState(loadedState); // Update the application state

                console.log("[Load] Triggering UI refresh...");
                console.log("[FileLoad] State replaced. Rebuilding UI from loaded state...");
                rebuildClientListFromState(); // New call to rebuild the list

                console.log("[FileLoad] UI rebuilt. Updating totals and sorting...");
                updateTotals(); // Call function to recalculate totals based on new DOM
                sortAllSectionsAndRows(); // Call function to sort the newly created rows/sections

                console.log("[FileLoad] UI refresh process completed.");
                showMessage("Data loaded successfully!", "success"); // User feedback
            } else {
                console.error("[Load] Invalid file format or missing key properties.", loadedState);
                showMessage("Error: Invalid file format. Could not load data.", "error");
            }
        } catch (error) {
            console.error("[Load] Error parsing JSON file:", error);
            showMessage("Error: Could not read or parse the selected file. Ensure it's valid JSON.", "error");
        } finally {
            // Reset file input value to allow loading the same file again if needed
            event.target.value = null;
            console.log("[Load] File input value reset.");
        }
    };

    reader.onerror = (e) => {
        console.error("[Load] Error reading file:", e);
        showMessage("Error: Could not read the selected file.", "error");
        event.target.value = null; // Reset on error too
    };

    reader.readAsText(file); // Start reading the file as text
    console.log("[Load] Started reading file as text...");
}

// Utility functions
function updateTotals() {
    // This function should recalculate totals and update the UI as needed.
    // If you already have this logic elsewhere, you may want to import it instead.
    // Placeholder: implement as needed or replace with correct import.
    // For now, we call updateUIAndSummaries for summary stats only.
    if (typeof updateUIAndSummaries === 'function') {
        updateUIAndSummaries();
    }
}

function sortAllSectionsAndRows() {
    // This function should sort month sections and rows.
    // If you already have this logic elsewhere, you may want to import it instead.
    // Placeholder: implement as needed or replace with correct import.
    if (typeof sortClientsByDate === 'function') sortClientsByDate();
    if (typeof sortMonthSections === 'function') sortMonthSections();
}

// Note: `updateTotalAccounts` from original script seems redundant now,
// as totals are managed differently. If specific functionality is needed,
// it should be reimplemented based on the new structure. 

// --- Initialize Event Listeners ---

// Add event listener for the percentage calculator input
// Ensure this runs after the DOM is loaded. If main.js calls an init function,
// move this there. For now, place it here assuming script execution order.
document.addEventListener('DOMContentLoaded', () => {
     const calculatorInput = document.getElementById('calculator-amount');
     if (calculatorInput) {
         calculatorInput.addEventListener('input', updatePercentageCalculator);
         // Also trigger calculation on initial load if there's a value
         updatePercentageCalculator(); 
     } else {
        console.warn("Could not attach listener: Percentage calculator amount input not found on DOMContentLoaded.");
     }
});

// --- Potentially other listeners or initialization code below --- 