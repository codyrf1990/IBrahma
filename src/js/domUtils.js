import { state } from './state.js';
import {
    formatCurrency, formatDate, parseDate, parseAmount, showMessage, getMonthFromDate,
    calculateTotalConfirmedAmount, calculateAverageConfirmedAmount, calculateConfirmationRate
} from './utils.js';
import { formatCurrency as calculationsFormatCurrency, calculateMonthlySubtotal } from './calculations.js'; // Add import at the top

// --- DOM Manipulation and UI Update Functions ---

/**
 * Creates and returns a new HTML table row element (<tr>) for a license.
 * @param {object} licenseData - Object containing license details.
 * @param {string} licenseData.id - Unique ID for the row.
 * @param {string} licenseData.name - Account name.
 * @param {string} licenseData.renewalDate - Renewal date (YYYY-MM-DD).
 * @param {string} licenseData.sentDate - Sent date (YYYY-MM-DD).
 * @param {string} licenseData.closeDate - Close date (YYYY-MM-DD).
 * @param {number} licenseData.amount - License amount.
 * @param {string} licenseData.opportunityId - Opportunity ID.
 * @param {boolean} licenseData.isChecked - Whether the license is confirmed.
 * @param {string} [licenseData.notes] - Optional notes for the license.
 * @returns {HTMLTableRowElement} The created table row element.
 */
export function createRowElement(licenseData) {
    const row = document.createElement('tr');
    row.className = 'client-row';
    row.id = licenseData.id;
    row.dataset.notes = licenseData.notes || '';
    if (licenseData.isChecked) {
        row.classList.add('checked');
    }
    
    // Store original date values as data attributes for sorting and other operations
    row.setAttribute('data-opportunity-id', licenseData.opportunityId || '');
    row.setAttribute('data-sent-date', licenseData.sentDate || '');
    row.setAttribute('data-close-date', licenseData.closeDate || '');
    row.setAttribute('data-renewal-date', licenseData.renewalDate || '');

    // Format dates for display
    const formattedRenewalDate = licenseData.renewalDate ? formatDate(licenseData.renewalDate) : '';
    const formattedSentDate = licenseData.sentDate ? formatDate(licenseData.sentDate) : '';
    const formattedCloseDate = licenseData.closeDate ? formatDate(licenseData.closeDate) : '';
    const formattedAmount = formatCurrency(licenseData.amount);

    // Create HTML with columns in exact order matching the table headers:
    // Checkbox, Name, Renewal Date, Sent Date, Close Date, Amount, Opportunity ID, Actions
    row.innerHTML = `
        <td class="td-checkbox">
            <div class="checkbox-wrapper">
                <input type="checkbox" class="custom-checkbox" data-row-id="${licenseData.id}" ${licenseData.isChecked ? 'checked' : ''}>
            </div>
        </td>
        <td class="td-name">${licenseData.name || ''}</td>
        <td class="td-renewal-date">${formattedRenewalDate}</td>
        <td class="td-sent-date">${formattedSentDate}</td>
        <td class="td-close-date">${formattedCloseDate}</td>
        <td class="td-amount">USD ${formattedAmount}</td>
        <td class="td-opp-id">${licenseData.opportunityId || ''}</td>
        <td class="td-actions">
            <div class="action-buttons-container">
                <button class="action-icon notes-icon action-button" title="View/Edit Note" aria-label="View or Edit Note">📝</button>
                <span class="action-icon edit-icon action-button" title="Edit">&#9998;</span>
                <span class="action-icon delete-icon action-button" title="Delete">&#10006;</span>
            </div>
        </td>
    `;
    return row;
}

/**
 * Creates and inserts the HTML structure for a new month section.
 * @param {string} month - Lowercase month name (e.g., 'january').
 * @param {number} [initialAmount=0] - Initial subtotal for the month.
 * @returns {HTMLElement | null} The created tbody element for the month, or null on error.
 */
export function createNewMonthSection(month, initialAmount = 0) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = ['january', 'february', 'march', 'april', 'may', 'june',
                       'july', 'august', 'september', 'october', 'november', 'december'].indexOf(month);

    if (monthIndex === -1) {
        console.error(`Invalid month name provided: ${month}`);
        return null;
    }

    // Determine the year for the month header
    const currentDate = new Date();
    let year = currentDate.getFullYear();
    const currentMonthIndex = currentDate.getMonth(); // 0-11

    // If it's Q4 (Oct-Dec, index 9-11) and the new month is Q1 (Jan-Mar, index 0-2)
    if (currentMonthIndex >= 9 && monthIndex <= 2) {
        year += 1;
    }

    const monthYearKey = `${year}-${(monthIndex + 1).toString().padStart(2, '0')}`; // YYYY-MM format

    const sectionHtml = `
        <div class="month-section" id="${month}-section" data-month-index="${monthIndex}" data-year="${year}" data-month-year="${monthYearKey}">
            <div class="month-header">
                <span>${monthNames[monthIndex]} ${year}</span>
                <span id="${month}-count">0 Subscriptions</span>
            </div>
            <div class="table-responsive-wrapper">
                <table class="client-table">
                    <thead>
                        <tr>
                            <th class="th-checkbox"></th>
                            <th class="th-name">Account Name</th>
                            <th class="th-renewal-date">Renewal Date</th>
                            <th class="th-sent-date">Sent Date</th>
                            <th class="th-close-date">Close Date</th>
                            <th class="th-amount">Amount</th>
                            <th class="th-opp-id">Opportunity ID</th>
                            <th class="th-actions">Actions</th>
                        </tr>
                    </thead>
                    <tbody id="${month}-clients-body">
                        <!-- Rows added here -->
                    </tbody>
                </table>
            </div>
            <div class="month-footer-summary" id="${month}-footer-summary">
              <span>Total Entered: <span id="${month}-total-entry-value">0</span> <span id="${month}-total-entry-amount">$0</span></span> | <span>Total Confirmed: <span id="${month}-confirmed-value">0</span> <span id="${month}-confirmed-amount">$0</span></span>
            </div>
        </div>
    `;

    // Get the main container directly by ID
    const mainContainer = document.getElementById('main-container');

    if (mainContainer) {
        // Create the new element from the HTML string
        const newSectionElement = document.createRange().createContextualFragment(sectionHtml).firstElementChild;
        if (newSectionElement) {
             // Append the new section to the main container
             mainContainer.appendChild(newSectionElement);
        } else {
             console.error('createNewMonthSection: Failed to create month section element from HTML.');
             return null;
        }
    } else {
        // Error if the main container wasn't found
        console.error('createNewMonthSection: Main container #main-container not found.');
        return null; // Indicate failure
    }

    // Update state.totals (will be properly calculated later)
    state.totals[month] = initialAmount;

    // Return the newly created tbody element
    return document.getElementById(`${month}-clients-body`);
}

/**
 * Updates the count and subtotal display for a specific month section.
 * Removes the section if it becomes empty.
 * @param {string} month - Lowercase month name.
 * @param {number} [subtotal] - Optional pre-calculated subtotal for the month. (No longer used for monetary subtotal)
 * @param {number} [totalEntryCount=0] - Total number of entries for the month.
 * @param {number} [confirmedCountParam=0] - Total number of confirmed entries for the month.
 * @param {number} [totalEntryAmount=0] - Total monetary amount of all entries for the month.
 * @param {number} [totalConfirmedAmount=0] - Total monetary amount of confirmed entries for the month.
 */
export function updateMonthSection(month, subtotal, totalEntryCount = 0, confirmedCountParam = 0, totalEntryAmount = 0, totalConfirmedAmount = 0) {
    const sectionId = `${month}-section`;
    const section = document.getElementById(sectionId);
    if (!section) return;

    const clientsContainer = document.getElementById(`${month}-clients-body`);
    if (!clientsContainer) return;

    const rows = clientsContainer.querySelectorAll('.client-row');
    const actualRowCount = rows.length; // This is the total number of entries displayed in the table for the month.

    const countElement = document.getElementById(`${month}-count`);
    if (countElement) {
        countElement.textContent = `${confirmedCountParam} Subscription${confirmedCountParam !== 1 ? 's' : ''}`;
    }

    // Update new footer counts and amounts
    const totalEntryValueEl = document.getElementById(`${month}-total-entry-value`);
    const totalEntryAmountEl = document.getElementById(`${month}-total-entry-amount`);
    const confirmedValueEl = document.getElementById(`${month}-confirmed-value`);
    const confirmedAmountEl = document.getElementById(`${month}-confirmed-amount`);

    if (totalEntryValueEl) {
      totalEntryValueEl.textContent = totalEntryCount;
    }
    if (totalEntryAmountEl) {
      totalEntryAmountEl.textContent = calculationsFormatCurrency(totalEntryAmount);
    }
    if (confirmedValueEl) {
      confirmedValueEl.textContent = confirmedCountParam;
    }
    if (confirmedAmountEl) {
      confirmedAmountEl.textContent = calculationsFormatCurrency(totalConfirmedAmount);
    }

    // Remove the section if it has no rows
    if (actualRowCount === 0) {
        section.remove();
    }
}

/**
 * Toggles the application view between 'all' and 'confirmed'.
 * @param {string} view - The view to switch to.
 */
export function toggleView(view) {
    // Update active button state
    document.querySelectorAll('.toggle-button').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.getElementById(`${view}-btn`);
    if (activeButton) activeButton.classList.add('active');

    // Update application state
    state.currentView = view;

    // Update the display based on the new view
    sortMonthSections(); // Re-sort sections as visibility might change order relevance
}

/**
 * Clears all input fields in the add license form.
 */
export function clearForm() {
    document.getElementById('account-name').value = '';
    document.getElementById('close-date').value = '';
    document.getElementById('renewal-date').value = '';
    document.getElementById('amount').value = '';
    document.getElementById('opportunity-id').value = '';
}

/**
 * Sorts client rows within each month's tbody based on the close date.
 */
export function sortClientsByDate() {
    document.querySelectorAll('.month-section').forEach(section => {
        const tbody = section.querySelector('tbody');
        if (!tbody) return;

        const rows = Array.from(tbody.querySelectorAll('.client-row'));

        rows.sort((a, b) => {
            const dateA = a.querySelector('.td-close-date')?.textContent || '';
            const dateB = b.querySelector('.td-close-date')?.textContent || '';

            // Attempt to parse dates (assuming MM/DD/YYYY)
            const parseSortDate = (dateStr) => {
                try {
                    const parts = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    if (parts) {
                        // Month is 0-indexed in JS Date
                        return new Date(parts[3], parts[1] - 1, parts[2]);
                    }
                    // Fallback for potentially other formats or empty strings
                    const parsed = new Date(dateStr);
                    return isNaN(parsed.getTime()) ? new Date(0) : parsed; // Treat invalid dates as very old
                } catch {
                    return new Date(0);
                }
            };

            const timeA = parseSortDate(dateA).getTime();
            const timeB = parseSortDate(dateB).getTime();

            return timeA - timeB;
        });

        // Re-append rows in sorted order
        rows.forEach(row => tbody.appendChild(row));
    });
}

/**
 * Sorts the month sections in the main container chronologically based on their data attributes.
 */
export function sortMonthSections() {
    const container = document.getElementById('main-container');

    // Safeguard: Ensure the container exists
    if (!container) {
        console.error('sortMonthSections: Main container #main-container not found. Cannot sort.');
        return;
    }

    // Get all direct children month sections
    // Use Array.from to convert NodeList to Array for sorting
    const sections = Array.from(container.querySelectorAll(':scope > .month-section'));

    // Sort sections based on year and month index stored in data attributes
    sections.sort((a, b) => {
        const yearA = parseInt(a.dataset.year, 10);
        const monthA = parseInt(a.dataset.monthIndex, 10);
        const yearB = parseInt(b.dataset.year, 10);
        const monthB = parseInt(b.dataset.monthIndex, 10);

        if (yearA !== yearB) {
            return yearA - yearB;
        } else {
            return monthA - monthB;
        }
    });

    // Re-append the sections to the container in the sorted order
    // Appending an existing element moves it
    sections.forEach(section => container.appendChild(section));
    // console.log('Month sections sorted.');
}

/**
 * Creates the auto-save indicator element if it doesn't exist.
 */
export function createAutoSaveIndicator() {
    let indicator = document.getElementById('auto-save-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'auto-save-indicator';
        indicator.className = 'auto-save-indicator';
        indicator.textContent = 'Changes saved automatically.'; // Initial message
        indicator.style.marginTop = '10px';
        indicator.style.fontSize = '0.8em';
        indicator.style.color = 'var(--text-muted)';

        const formElement = document.getElementById('license-form'); // Or another suitable location
        formElement?.parentNode?.insertBefore(indicator, formElement.nextSibling);
    }
}

/**
 * Opens the edit modal and populates it with data from the selected row.
 * @param {string} rowId - The ID of the row to edit.
 */
export function openEditModal(rowId) {
    console.log('[openEditModal] Function called for rowId:', rowId); // Diagnostic log
    const modal = document.getElementById('edit-modal');
    const row = document.getElementById(rowId);

    if (!modal || !row) {
        console.error('Modal or row not found for editing', rowId);
        showMessage('Error opening edit form', 'error');
        return;
    }

    // Store the ID of the row being edited
    state.editingRowId = rowId;

    // Retrieve data from the row
    const name = row.querySelector('.td-name')?.textContent || '';
    // Read dates from data attributes for raw YYYY-MM-DD format
    const renewalDate = row.dataset.renewalDate || '';
    const sentDate = row.dataset.sentDate || '';
    const closeDate = row.dataset.closeDate || '';
    // Keep amount and oppId retrieval as is
    const amountStr = row.querySelector('.td-amount')?.textContent || '0';
    const opportunityId = row.getAttribute('data-opportunity-id') || '';

    // Populate modal fields
    document.getElementById('edit-name').value = name;
    document.getElementById('edit-renewal-date').value = renewalDate; // Already YYYY-MM-DD
    document.getElementById('edit-sent-date').value = sentDate; // Already YYYY-MM-DD
    document.getElementById('edit-date').value = closeDate; // Already YYYY-MM-DD
    document.getElementById('edit-amount').value = parseAmount(amountStr).toFixed(2);
    document.getElementById('edit-opportunity-id').value = opportunityId;

    // Display the modal using flex to enable centering
    modal.style.display = 'flex';
}

/**
 * Closes the edit modal.
 */
export function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Clear the editing state
    state.editingRowId = null;
}

/**
 * Fixes potential issues with row structure, like missing cells (Optional, based on original script).
 * This might not be necessary with the current structure but is included for completeness.
 */
export function fixRowStructure() {
    console.warn('fixRowStructure function called - review if still necessary.');
    // Implementation would go here if needed, e.g., ensuring all rows have the correct number of <td> elements.
}

/**
 * Extracts all client data currently rendered in the DOM.
 * @returns {Array<object>} An array of client data objects.
 */
export function getAllClientsFromDOM() {
    const clients = [];
    document.querySelectorAll('.client-row').forEach(row => {
        const nameEl = row.querySelector('.td-name');
        const amountEl = row.querySelector('.td-amount');
        const oppIdEl = row.querySelector('.td-opp-id');
        const checkboxEl = row.querySelector('.custom-checkbox');

        const client = {
            id: row.id,
            name: nameEl ? nameEl.textContent : '',
            // Get dates from data attributes for raw values
            renewalDate: row.getAttribute('data-renewal-date') || '',
            sentDate: row.getAttribute('data-sent-date') || '',
            closeDate: row.getAttribute('data-close-date') || '',
            amount: amountEl ? parseAmount(amountEl.textContent) : 0, // Use parseAmount
            opportunityId: oppIdEl ? oppIdEl.textContent : '',
            // Get isChecked state directly from checkbox state
            isChecked: checkboxEl ? checkboxEl.checked : false 
        };
        clients.push(client);
    });
    return clients;
}

/**
 * Updates the summary statistics displayed in the UI cards and totals bar.
 * @param {object} summaryData - An object containing calculated statistics 
 *                               (totalConfirmed, confirmedCount, averageDealSize, confirmationRate, goal, pool).
 */
export function displaySummaryStatistics(summaryData) {
    // Receipts Progress Elements
    const receiptsInfoEl = document.getElementById('receipts-info');
    const receiptsProgressEl = document.getElementById('receipts-progress');
    const receiptsPercentageEl = document.getElementById('receipts-percentage');
    const receiptsGoalInputEl = document.getElementById('receipts-goal-input');

    // KPI Stats Elements
    const totalEnteredEl = document.getElementById('kpi-total-entered-amount');
    const avgAmountEl = document.getElementById('kpi-avg-amount');

    // Total Confirmed Whole Card Elements
    const totalConfirmedWholeValueEl = document.getElementById('total-confirmed-whole-value');

    let elementsFound = true;

    // Default values from summaryData or 0 if not available
    const confirmedCount = summaryData.confirmedCount || 0;
    const goal = summaryData.goal || 0;
    const totalEnteredAmount = summaryData.totalEnteredAmount || 0;
    const averageDealSize = summaryData.averageDealSize || 0;
    const totalConfirmedAmount = summaryData.totalConfirmed || 0;

    // --- Update Progress Overview Card ---
    const progressPercentage = goal > 0 ? (confirmedCount / goal) * 100 : 0;

    if (receiptsInfoEl) receiptsInfoEl.textContent = `${confirmedCount} of ${goal} Receipts Received`;
    else elementsFound = false;

    if (receiptsProgressEl) receiptsProgressEl.style.width = `${progressPercentage.toFixed(2)}%`;
    else elementsFound = false;

    if (receiptsPercentageEl) receiptsPercentageEl.textContent = `${progressPercentage.toFixed(2)}%`;
    else elementsFound = false;

    if (receiptsGoalInputEl) receiptsGoalInputEl.value = goal.toString();
    else elementsFound = false;

    // --- Update Key Stats Card --- 
    if (totalEnteredEl && summaryData.hasOwnProperty('totalEnteredAmount')) {
        totalEnteredEl.textContent = formatCurrency(summaryData.totalEnteredAmount);
    }
    if (avgAmountEl && summaryData.hasOwnProperty('averageDealSize')) {
        avgAmountEl.textContent = formatCurrency(summaryData.averageDealSize);
    }

    // Update the new Total Confirmed (Whole Number) card
    if (totalConfirmedWholeValueEl && summaryData.hasOwnProperty('totalConfirmed')) {
        totalConfirmedWholeValueEl.textContent = formatCurrency(summaryData.totalConfirmed, { showCents: false });
    }

    // Log only if any elements weren't found (for debugging)
    if (!elementsFound) {
        console.warn("displaySummaryStatistics: One or more DOM elements were not found. Check IDs.");
    }
}

/**
 * Displays the total confirmed and total overall dollar amounts.
 * @param {number} totalAmountAll - The total dollar amount of all entries.
 * @param {number} totalAmountConfirmed - The total dollar amount of confirmed entries.
 */
export function displayEntrySummary(totalAmountAll, totalAmountConfirmed) {
    const summaryElement = document.getElementById('entry-summary-text');
    if (summaryElement) {
        // Reuse the imported formatCurrency function
        const formattedConfirmed = calculationsFormatCurrency(totalAmountConfirmed);
        const formattedAll = calculationsFormatCurrency(totalAmountAll);
        summaryElement.textContent = `Confirmed: ${formattedConfirmed} / Total: ${formattedAll}`;
    } else {
        console.warn('Could not find element #entry-summary-text to display amounts.');
    }
}

// Modify renderClientTable (or similar function) to accept and use monthlySubtotals
// Assuming a function like renderClientTable exists
// We need to find where month sections are created and add the subtotal logic.
// Example modification (conceptual - exact implementation depends on existing code):
/*
export function renderClientTable(clients, sortCriteria, filter = '', monthlySubtotals = {}) {
    // ... existing logic to group clients by month ...

    Object.keys(groupedClients).sort().reverse().forEach(monthYear => {
        const monthClients = groupedClients[monthYear];
        const monthSection = document.createElement('div');
        monthSection.className = 'month-section';
        monthSection.id = `month-${monthYear}`;

        const monthSubtotal = monthlySubtotals[monthYear] || 0;

        monthSection.innerHTML = `
            <div class="month-header">
                <h3>${formatMonthYear(monthYear)}</h3>
                <span class="month-subtotal">Subtotal: ${formatCurrency(monthSubtotal)}</span> 
            </div>
            <table class="client-table">
                <thead>
                    <tr>
                        <th data-sort="accountName">Account Name</th>
                        <th data-sort="renewalDate">Renewal Date</th>
                        <th data-sort="sentDate">Sent Date</th>
                        <th data-sort="closeDate">Close Date</th>
                        <th data-sort="amount">Amount (USD)</th>
                        <th data-sort="opportunityId">Opportunity ID</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${monthClients.map(client => createRow(client)).join('')}
                </tbody>
            </table>
        `;
        container.appendChild(monthSection);
    });

    // ... rest of the function ...
}
*/

// Need to read domUtils.js more thoroughly to apply the subtotal logic correctly. 

/**
 * Updates the Key Performance Indicators (KPIs) section in the UI.
 * Relies on calculated KPIs from the main data processing logic.
 *
 * @param {object} kpis - An object containing key performance indicators.
 *                 Example: { totalConfirmed: 15, avgAmount: 550.75, confirmRate: 85.2 }
 */
function displayKPIs(kpis) {
    console.log("displayKPIs called with:", kpis);
    if (!kpis) {
        console.error("KPI data is undefined or null. Cannot display KPIs.");
        // Optionally update UI to show an error state for KPIs
        updateElementText('kpi-total-confirmed', 'Error');
        updateElementText('kpi-avg-amount', 'Error');
        return;
    }

    // Safely access properties with default values or checks
    const totalConfirmed = kpis.totalConfirmed !== undefined ? kpis.totalConfirmed : 'N/A';
    const avgAmount = kpis.avgAmount !== undefined ? `$${Number(kpis.avgAmount).toFixed(2)}` : 'N/A';

    // Update the DOM elements
    updateElementText('kpi-total-confirmed', totalConfirmed);
    updateElementText('kpi-avg-amount', avgAmount);
}

// --- Custom Confirmation Modal --- 

/**
 * Hides the custom confirmation modal.
 */
function hideConfirmationModal() {
    const modal = document.getElementById('confirmation-modal');
    if (modal) {
        modal.style.display = 'none';
    }
    // Clean up listeners to prevent memory leaks
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');
    if (confirmBtn) confirmBtn.replaceWith(confirmBtn.cloneNode(true)); // Removes all listeners
    if (cancelBtn) cancelBtn.replaceWith(cancelBtn.cloneNode(true)); // Removes all listeners
}

/**
 * Shows a custom confirmation modal.
 * @param {string} message - The message to display in the modal.
 * @param {function} onConfirmCallback - Function to call if the user confirms.
 * @param {function} onCancelCallback - Function to call if the user cancels.
 */
export function showConfirmationModal(message, onConfirmCallback, onCancelCallback) {
    const modal = document.getElementById('confirmation-modal');
    const messageElement = document.getElementById('modal-message');
    const confirmBtn = document.getElementById('modal-confirm-btn');
    const cancelBtn = document.getElementById('modal-cancel-btn');

    if (!modal || !messageElement || !confirmBtn || !cancelBtn) {
        console.error("Confirmation modal elements not found!");
        // Fallback to native confirm if modal elements are missing
        if (confirm(message)) { 
            if (onConfirmCallback) onConfirmCallback();
        } else {
            if (onCancelCallback) onCancelCallback();
        }
        return;
    }

    messageElement.textContent = message;

    // IMPORTANT: Remove previous listeners before adding new ones
    // Clone and replace buttons to ensure no old listeners remain
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    const newCancelBtn = cancelBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);

    // Add new listeners
    newConfirmBtn.addEventListener('click', () => {
        hideConfirmationModal();
        if (onConfirmCallback) onConfirmCallback();
    });

    newCancelBtn.addEventListener('click', () => {
        hideConfirmationModal();
        if (onCancelCallback) onCancelCallback();
    });
    
    // Also allow closing by clicking the overlay (optional)
    modal.addEventListener('click', (event) => {
        if (event.target === modal) { // Check if click is on the overlay itself
             hideConfirmationModal();
             if (onCancelCallback) onCancelCallback(); // Treat overlay click as cancel
        }
    }, { once: true }); // Use once to automatically remove listener after first overlay click

    modal.style.display = 'flex';
}

/**
 * Shows the Add Renewal modal with blank fields.
 */
export function showAddRenewalModal() {
    const modal = document.getElementById('add-renewal-modal');
    if (modal) {
        // Clear all input fields to ensure form is blank
        const renewalDateInput = document.getElementById('renewal-date');
        const sentDateInput = document.getElementById('sent-date');
        const closeDateInput = document.getElementById('close-date');
        const nameInput = document.getElementById('account-name');
        const amountInput = document.getElementById('amount');
        const oppIdInput = document.getElementById('opportunity-id');

        if (renewalDateInput) renewalDateInput.value = '';
        if (sentDateInput) sentDateInput.value = '';
        if (closeDateInput) closeDateInput.value = '';
        if (nameInput) nameInput.value = '';
        if (amountInput) amountInput.value = '';
        if (oppIdInput) oppIdInput.value = '';

        modal.style.display = 'flex';
        document.getElementById('account-name')?.focus();
    } else {
        console.error("Add renewal modal element not found!");
    }
}

/**
 * Hides the Add Renewal modal.
 */
export function hideAddRenewalModal() {
    const modal = document.getElementById('add-renewal-modal');
    if (modal) {
        modal.style.display = 'none';
    }
} 

/**
 * Updates the visibility of client rows and month sections based on current view and search term.
 * Now supports searching all fields (Name, Opp ID, Dates, Amount) and only hides rows if at least one match is found.
 */
export function updateRowVisibility() {
    const currentView = state.currentView || 'all';
    const searchTerm = (state.getState ? state.getState().searchTerm : state.searchTerm || '').toLowerCase();
    let anyMatchFound = false;
    const allRows = document.querySelectorAll('.client-row');
    if (searchTerm) {
        for (const row of allRows) {
            const name = row.querySelector('.td-name')?.textContent.toLowerCase() || '';
            const opp = row.querySelector('.td-opp-id')?.textContent.toLowerCase() || '';
            const renDate = row.querySelector('.td-renewal-date')?.textContent.toLowerCase() || '';
            const senDate = row.querySelector('.td-sent-date')?.textContent.toLowerCase() || '';
            const cloDate = row.querySelector('.td-close-date')?.textContent.toLowerCase() || '';
            const amt = row.querySelector('.td-amount')?.textContent.toLowerCase() || '';
            if (
                name.includes(searchTerm) ||
                opp.includes(searchTerm) ||
                renDate.includes(searchTerm) ||
                senDate.includes(searchTerm) ||
                cloDate.includes(searchTerm) ||
                amt.includes(searchTerm)
            ) {
                anyMatchFound = true;
                break;
            }
        }
        console.log('[Filter Pre-scan] Any match found for term "' + searchTerm + '":', anyMatchFound);
    }
    allRows.forEach(clientRow => {
        const isChecked = clientRow.classList.contains('checked');
        const accountName = clientRow.querySelector('.td-name')?.textContent.toLowerCase() || '';
        const oppId = clientRow.querySelector('.td-opp-id')?.textContent.toLowerCase() || '';
        const renewalDateText = clientRow.querySelector('.td-renewal-date')?.textContent.toLowerCase() || '';
        const sentDateText = clientRow.querySelector('.td-sent-date')?.textContent.toLowerCase() || '';
        const closeDateText = clientRow.querySelector('.td-close-date')?.textContent.toLowerCase() || '';
        const amountText = clientRow.querySelector('.td-amount')?.textContent.toLowerCase() || '';
        let matchesSearch = true;
        if (searchTerm) {
            matchesSearch =
                accountName.includes(searchTerm) ||
                oppId.includes(searchTerm) ||
                renewalDateText.includes(searchTerm) ||
                sentDateText.includes(searchTerm) ||
                closeDateText.includes(searchTerm) ||
                amountText.includes(searchTerm);
        }
        let shouldBeVisibleBasedOnView = false;
        if (currentView === 'all') {
            shouldBeVisibleBasedOnView = true;
        } else {
            shouldBeVisibleBasedOnView = isChecked;
        }
        let isVisible = false;
        if (!searchTerm) {
            isVisible = shouldBeVisibleBasedOnView;
        } else {
            if (!anyMatchFound) {
                isVisible = shouldBeVisibleBasedOnView;
            } else {
                isVisible = shouldBeVisibleBasedOnView && matchesSearch;
            }
        }
        clientRow.style.display = isVisible ? '' : 'none';
    });
    // Update month section visibility: hide if no visible rows
    document.querySelectorAll('.month-section').forEach(section => {
        const visibleRows = Array.from(section.querySelectorAll('.client-row')).filter(row => row.style.display !== 'none');
        section.style.display = visibleRows.length > 0 ? '' : 'none';
    });
}

/**
 * Rebuilds the client list UI from the application state (state.clients), clearing the DOM and inserting all clients.
 * This does NOT perform sorting or update totals; call those separately after.
 */
export function rebuildClientListFromState() {
    const clients = state.getState ? state.getState().clients : state.clients;
    const container = document.getElementById('main-container');
    if (!container) {
        console.error('[rebuildClientListFromState] #main-container not found.');
        return;
    }
    // Clear the container
    container.innerHTML = '';
    console.log('[rebuildClientListFromState] Starting UI rebuild from state. Clients count:', clients.length);
    // Helper: Map of month name to tbody element
    const monthBodies = {};
    clients.forEach(client => {
        // Determine month section by closeDate
        const closeDate = client.closeDate;
        if (!closeDate) {
            console.warn('[rebuildClientListFromState] Client missing closeDate:', client);
            return;
        }
        const month = getMonthFromDate(closeDate);
        let monthTbody = monthBodies[month];
        if (!monthTbody) {
            // Create month section if missing
            monthTbody = createNewMonthSection(month);
            if (!monthTbody) {
                console.error('[rebuildClientListFromState] Could not create/find tbody for month:', month);
                return;
            }
            monthBodies[month] = monthTbody;
        }
        // Create row and append
        const rowElement = createRowElement(client);
        monthTbody.appendChild(rowElement);
    });
    console.log('[rebuildClientListFromState] UI rebuild completed.');
}

// Function to open the generic modal
function openGenericModal(title, contentUrl) {
    console.log('[openGenericModal] Called with title:', title, 'and URL:', contentUrl);
    const modal = document.getElementById('generic-content-modal');
    const modalTitle = document.getElementById('generic-modal-title');
    const iframe = document.getElementById('generic-modal-iframe');

    if (modal) {
        console.log('[openGenericModal] Found modal element:', modal);
        if (modalTitle) {
            console.log('[openGenericModal] Found modal title element:', modalTitle);
            modalTitle.textContent = title;
        } else {
            console.error('[openGenericModal] CRITICAL: Could not find modal title element #generic-modal-title');
        }

        if (iframe) {
            console.log('[openGenericModal] Found iframe element:', iframe);
            iframe.src = contentUrl || 'about:blank';
        } else {
            console.error('[openGenericModal] CRITICAL: Could not find iframe element #generic-modal-iframe');
        }

        // Attempt to display the modal
        modal.style.display = 'flex'; // Use flex as per .modal-overlay and general modal centering approach
        console.log('[openGenericModal] Set modal.style.display to:', modal.style.display);
        
        // Check computed style shortly after
        setTimeout(() => {
            const computedDisplay = window.getComputedStyle(modal).display;
            console.log('[openGenericModal] Computed modal display (after timeout):', computedDisplay);
            if (computedDisplay === 'none') {
                console.warn('[openGenericModal] Modal display is still "none" after attempting to set it. Check CSS overriding rules.');
            }
        }, 100); // 100ms delay

    } else {
        console.error('[openGenericModal] CRITICAL: Could not find modal element #generic-content-modal');
    }
}

// Function to close the generic modal
function closeGenericModal() {
    const modal = document.getElementById('generic-content-modal');
    if (modal) {
        modal.style.display = 'none';
        const iframe = document.getElementById('generic-modal-iframe');
        if (iframe) {
            iframe.src = 'about:blank'; // Clear iframe content to stop any processing
        }
    }
}

// Expose functions to global scope if they are called via onclick or need to be accessed from HTML directly
window.openGenericModal = openGenericModal;
window.closeGenericModal = closeGenericModal;