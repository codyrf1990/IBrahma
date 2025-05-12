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
        const name = document.getElementById('account-name').value.trim();
        const renewalDate = document.getElementById('renewal-date').value;
        const sentDate = document.getElementById('sent-date').value;
        const closeDate = document.getElementById('close-date').value;
        let amount = parseFloat(document.getElementById('amount').value);
        const opportunityId = document.getElementById('opportunity-id').value.trim();

        if (!name || !closeDate) {
            showMessage('Account Name and Close Date are required', 'error');
            return;
        }
        if (isNaN(amount)) {
            amount = 0;
            console.warn('Invalid amount entered, defaulting to 0');
        }

        const rowId = generateId();
        const newLicenseData = {
            id: rowId,
            name,
            renewalDate,
            sentDate,
            closeDate,
            amount,
            opportunityId,
            isChecked: false,
            notes: '' // Initialize with empty notes
        };

        // 1. Modify state.clients directly
        state.clients.push(newLicenseData);

        // 2. Save the updated state
        saveData();

        // 3. Rebuild UI from state
        rebuildClientListFromState();
        sortClientsByDate();
        sortMonthSections();
        updateUIAndSummaries(); // Ensure this uses the new DOM or state.clients

        // Optional: Highlight the newly added row after UI rebuild
        // This requires finding the element, which might be simpler if createRowElement adds a temporary class
        // or if rebuildClientListFromState can return a map of IDs to elements.
        // For now, deferring advanced highlight. A simple message is good.
        const newRowElement = document.getElementById(rowId);
        if (newRowElement) {
            newRowElement.classList.add('row-highlight-success');
            setTimeout(() => {
                newRowElement.classList.remove('row-highlight-success');
            }, 1500);
        }

        clearForm();
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
    console.log('[CheckboxHandler] Function entered for rowId:', rowId);
    const clientIndex = state.clients.findIndex(client => client.id === rowId);

    if (clientIndex === -1) {
        console.error('[CheckboxHandler] Client with ID:', rowId, 'not found in state.clients.');
        showMessage('Error: Client data not found to toggle status.', 'error');
        return;
    }

    // Determine the new checked status (toggle current)
    const newCheckedStatus = !state.clients[clientIndex].isChecked;
    console.log('[CheckboxHandler] Client ID:', rowId, 'New checked status:', newCheckedStatus);

    // 1. Update state.clients
    state.clients[clientIndex].isChecked = newCheckedStatus;

    // 2. Update state.checkedRows array
    if (newCheckedStatus) {
        if (!state.checkedRows.includes(rowId)) {
            state.checkedRows.push(rowId);
            console.log('[CheckboxHandler] Adding rowId to state.checkedRows', state.checkedRows);
        }
    } else {
        state.checkedRows = state.checkedRows.filter(id => id !== rowId);
        console.log('[CheckboxHandler] Removing rowId from state.checkedRows', state.checkedRows);
    }

    // 3. Save the updated state
    saveData();

    // 4. Rebuild UI from state
    // For a checkbox toggle, rebuilding the whole list might be overkill but ensures consistency.
    // A more targeted DOM update could be to find the row and toggle its class, 
    // then call updateUIAndSummaries. But let's keep it consistent for now.
    rebuildClientListFromState();
    sortClientsByDate();
    sortMonthSections();
    updateUIAndSummaries();

    console.log('[CheckboxHandler] Handler execution finished for rowId:', rowId);
}

/**
 * Deletes a license row from the table and updates totals.
 * @param {string} rowId - The ID of the row to delete.
 */
export function deleteRow(rowId) {
    try {
        const rowElement = document.getElementById(rowId); // Get element for animation
        if (!rowElement) {
            // If row not in DOM, still attempt to remove from state if that's desired
            console.warn('[DeleteRow] Row element not found in DOM for ID:', rowId, '. Attempting state removal.');
        }

        // 1. Update state: Remove client from state.clients
        const clientExistsInState = state.clients.some(client => client.id === rowId);
        if (!clientExistsInState) {
            console.warn('[DeleteRow] Client ID:', rowId, 'not found in state.clients. No state change for clients array.');
            // Potentially show error or just log if DOM element also not found
            if (!rowElement) {
                 showMessage('Error: Row to delete not found.', 'error');
                 return;
            }
        } else {
            state.clients = state.clients.filter(client => client.id !== rowId);
        }

        // 2. Update state: Remove from state.checkedRows if present
        state.checkedRows = state.checkedRows.filter(id => id !== rowId);

        // 3. Save the updated state immediately
        saveData();

        // 4. Handle DOM animation and subsequent UI rebuild
        if (rowElement) {
            rowElement.classList.add('row-fade-out');
            setTimeout(() => {
                // a. Rebuild UI from the already updated state
                rebuildClientListFromState();
                // b. Sort and update summaries
                sortClientsByDate();
                sortMonthSections();
                updateUIAndSummaries();
                showMessage('License deleted successfully', 'success');
            }, 500); // Match transition duration in CSS
        } else {
            // If rowElement wasn't found initially but state was updated, still refresh UI
            rebuildClientListFromState();
            sortClientsByDate();
            sortMonthSections();
            updateUIAndSummaries();
            showMessage('License deleted successfully from data (row not found in UI).', 'success');
        }

        // REMOVED: Old DOM manipulations and state.clients = getAllClientsFromDOM()
        // REMOVED: calculateMonthlySubtotal and updateMonthSection directly (updateUIAndSummaries handles this broadly)

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
        showMessage('Error: No row ID available for saving changes.', 'error');
        closeEditModal();
        return;
    }

    const clientIndex = state.clients.findIndex(client => client.id === rowId);
    if (clientIndex === -1) {
        showMessage('Error: Client to edit not found in current data.', 'error');
        closeEditModal();
        return;
    }

    try {
        // Get updated values from modal form
        const name = document.getElementById('edit-name').value.trim();
        const renewalDate = document.getElementById('edit-renewal-date').value;
        const sentDate = document.getElementById('edit-sent-date').value;
        const closeDate = document.getElementById('edit-date').value;
        let amount = parseFloat(document.getElementById('edit-amount').value);
        const opportunityId = document.getElementById('edit-opportunity-id').value.trim();

        if (!name || !closeDate) {
            showMessage('Account Name and Close Date are required', 'error');
            return; // Keep modal open for correction
        }
        if (isNaN(amount)) {
            amount = 0;
            console.warn('Invalid amount in edit modal, defaulting to 0');
        }

        // 1. Update the client object in state.clients
        const updatedClient = {
            ...state.clients[clientIndex], // Preserve existing fields like ID, notes, isChecked
            name,
            renewalDate,
            sentDate,
            closeDate,
            amount,
            opportunityId
        };
        state.clients[clientIndex] = updatedClient;

        // 2. Save the updated state
        saveData();

        // 3. Rebuild UI from state
        rebuildClientListFromState();
        sortClientsByDate();
        sortMonthSections();
        updateUIAndSummaries();

        // 4. Close modal and show success
        closeEditModal();
        showMessage('Changes saved successfully', 'success');

    } catch (error) {
        console.error('Error saving edit changes for row:', rowId, error);
        showMessage(error.message || 'Failed to save changes', 'error');
        // Optionally, do not close modal on error, or handle differently
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
        state.clients = getAllClientsFromDOM(); // <-- Keep state in sync with DOM
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

// Event listener for the SolidCAM Chat STD button
const solidcamChatStdButton = document.getElementById('btn-chat-std');

// // Commenting out or removing generic modal variables if no longer exclusively used by this button
// const genericModal = document.getElementById('generic-content-modal');
// const genericModalTitle = document.getElementById('generic-modal-title');
// const genericModalIframe = document.getElementById('generic-modal-iframe');
// const genericModalCloseButton = document.getElementById('generic-modal-close-btn');

if (solidcamChatStdButton) {
    solidcamChatStdButton.addEventListener('click', () => {
        window.open('https://www.solidcamchat.com/', '_blank');
    });
} else {
    console.error('SolidCAM Chat STD button (btn-chat-std) not found.');
}

// The generic modal close button listener should remain if the modal is used by other features.
// If it was exclusively for this chat button, it can be removed or conditionally managed.
// Assuming the generic modal might be used elsewhere, so its close listener is kept separate
// and not tied directly to the existence of solidcamChatStdButton anymore for its own setup.

const genericModal = document.getElementById('generic-content-modal');
const genericModalIframe = document.getElementById('generic-modal-iframe');
const genericModalCloseButton = document.getElementById('generic-modal-close-btn');

if (genericModal && genericModalIframe && genericModalCloseButton) {
    genericModalCloseButton.addEventListener('click', () => {
        genericModal.style.display = 'none';
        genericModalIframe.src = 'about:blank'; // Clear iframe src
    });
} else {
    // Log errors if any of these specific modal components are missing, useful for debugging other modal uses
    if (!genericModal) console.error('Generic modal (generic-content-modal) not found for close button setup.');
    if (!genericModalIframe) console.error('Generic modal iframe (generic-modal-iframe) not found for close button setup.');
    if (!genericModalCloseButton) console.error('Generic modal close button (generic-modal-close-btn) not found for setup.');
}

// --- Potentially other listeners or initialization code below --- 