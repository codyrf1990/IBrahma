import { state, setSearchTerm, updateClientNote, loadSortPreferences } from './state.js';
import { showMessage, getMonthFromDate } from './utils.js';
import { loadInitialData, saveData, previewImportData, validateAndImport } from './data.js';
import {
    toggleView,
    openEditModal,
    closeEditModal,
    fixRowStructure,
    clearForm,
    displaySummaryStatistics,
    displayEntrySummary,
    getAllClientsFromDOM,
    updateMonthSection,
    sortClientsByDate,
    sortMonthSections,
    showConfirmationModal,
    showAddRenewalModal,
    hideAddRenewalModal,
    updateRowVisibility,
    sortRowsByField,
    updateSortIndicators
} from './domUtils.js';
import { addLicense, toggleChecked, deleteRow, saveEditChanges, updateReceiptsGoal } from './eventHandlers.js';
import { 
    calculateAllSummaryStats, 
    calculateMonthlySubtotals, 
    formatCurrency, 
    calculateTotalEntries,
    countConfirmedDeals,
    calculateTotalConfirmed,
    calculateTotalAmountAllEntries
} from './calculations.js';
// Import save/load handlers
import { handleSaveToFile, handleLoadClick, handleFileLoad, updatePercentageCalculator } from './eventHandlers.js';
// Import year tabs functions
import { initializeYearTabs, rebuildYearTabs, switchYear } from './yearTabs.js';

// --- NEW: Generic Modal Helper Functions ---
function openGenericModal(title, iframeSrc) {
    const modal = document.getElementById('generic-content-modal');
    const modalTitle = document.getElementById('generic-modal-title');
    const iframe = document.getElementById('generic-modal-iframe');

    if (modal && modalTitle && iframe) {
        modalTitle.textContent = title;
        iframe.src = iframeSrc;
        modal.style.display = 'block'; // Or 'flex' if it's styled with flex
        // Consider adding a class to body to prevent scrolling if needed
        // document.body.classList.add('modal-open');
    } else {
        console.error('Generic modal elements not found.');
    }
}

// Make it globally accessible if not already via other means, or pass to event listeners
// For simplicity in this step, making it available for event listeners.
// Consider a more structured approach for managing modal visibility if complexity grows.
window.closeGenericModal = function() { // Ensure this function is defined if not already
    const modal = document.getElementById('generic-content-modal');
    if (modal) {
        modal.style.display = 'none';
        const iframe = document.getElementById('generic-modal-iframe');
        if (iframe) {
            iframe.src = 'about:blank'; // Clear iframe content on close
        }
        // document.body.classList.remove('modal-open');
    }
};
// --- END NEW: Generic Modal Helper Functions ---

// --- Global Update Function ---

/**
 * Central function to recalculate statistics and update the entire UI.
 * Reads data from the DOM, performs calculations, and updates summary displays and month subtotals.
 */
export function updateUIAndSummaries() {
    try {
        // 1. Get Data and Settings - Use state as source of truth
        const allClients = state.clients;

        // Filter clients by active year
        const clients = allClients.filter(client => {
            if (!client.closeDate || client.closeDate.length < 4) return false;
            const year = parseInt(client.closeDate.substring(0, 4), 10);
            return year === state.activeYear;
        });

        const goalInput = document.getElementById('receipts-goal-input');
        const goal = goalInput ? parseInt(goalInput.value, 10) : state.receiptsGoal;
        state.receiptsGoal = goal || 0;

        // 2. Perform Calculations
        const summaryStats = calculateAllSummaryStats(clients, goal);
        const monthlySubtotals = calculateMonthlySubtotals(clients);
        const totalAmountConfirmed = calculateTotalConfirmed(clients);
        const totalAmountAll = calculateTotalAmountAllEntries(clients);

        // Log calculated amounts
        // console.log(`[UpdateWorkflow] Calculated Total Amount: ${totalAmountAll}`); // Removed log
        // console.log(`[UpdateWorkflow] Calculated Confirmed Amount: ${totalAmountConfirmed}`); // Removed log

        // 3. Update Summary Statistics Display
        displaySummaryStatistics(summaryStats);
        displayEntrySummary(totalAmountAll, totalAmountConfirmed);

        // 4. Update Monthly Subtotals in the DOM
        document.querySelectorAll('.month-section').forEach(section => {
            // Extract month name (e.g., 'january') from section ID ('january-section')
            const monthName = section.id.replace('-section', ''); 
            // Extract YYYY-MM from section attributes if needed for matching keys in monthlySubtotals
            // const year = section.getAttribute('data-year');
            // const monthIndex = section.getAttribute('data-month-index');
            // For now, assume monthlySubtotals keys are YYYY-MM and we need to map monthName to the correct key
            // *** This part needs refinement based on how month sections are identified and how subtotals are keyed ***
            // TEMPORARY: Update based on month name - assumes subtotals are keyed by name (likely incorrect)
            // TODO: Refine matching between month section and subtotal key (YYYY-MM)
            // We need a reliable way to get the YYYY-MM corresponding to the month section.
            // Let's assume for now calculateMonthlySubtotals uses YYYY-MM and we need to find the correct subtotal for the section
            
            // **Revised Approach:** Iterate subtotals, find/update corresponding section
        });
        
        // Iterate through calculated subtotals and update corresponding month sections
        const allMonthSections = Array.from(document.querySelectorAll('.month-section'));
        Object.keys(monthlySubtotals).forEach(monthYearKey => { // Key is 'YYYY-MM'
            const subtotal = monthlySubtotals[monthYearKey];
            // Find the DOM section that corresponds to this monthYearKey
            // This assumes createNewMonthSection adds appropriate data attributes (e.g., data-month-year="YYYY-MM")
            // Let's assume `getMonthFromDate` (from utils) can extract month name from YYYY-MM-DD
            // We need to adapt how sections are identified or how subtotals are looked up

            // **Simplification:** Call updateMonthSection for *every* month currently in the DOM.
            // updateMonthSection will update the count and use the provided subtotal.
            // It relies on month name matching only.
            // We need to find the month name from the YYYY-MM key to call updateMonthSection.
            // This is getting complex. Let's stick to updating all existing sections and passing the *correct* subtotal.

        });

        // **Better Approach:** Update all *existing* month sections, passing the correct subtotal.
        allMonthSections.forEach(section => {
            const monthYearAttr = section.getAttribute('data-month-year'); // e.g., "2024-08"
            const monthName = section.id.replace('-section', ''); // e.g., "august"
            
            // Filter clients for the current month
            const clientsForMonth = clients.filter(client => {
                if (!client.closeDate || client.closeDate.length < 7) return false; // Basic check
                return client.closeDate.substring(0, 7) === monthYearAttr;
            });

            const totalEntryCountForMonth = clientsForMonth.length;
            const confirmedCountForMonth = countConfirmedDeals(clientsForMonth);
            const totalEntryAmountForMonth = calculateTotalAmountAllEntries(clientsForMonth);
            const totalConfirmedAmountForMonth = calculateTotalConfirmed(clientsForMonth);
            
            // The 'subtotal' variable here was the monetary subtotal, which is no longer directly used by updateMonthSection for display.
            // We pass 0 as a placeholder for the old subtotal argument.
            // updateMonthSection now uses confirmedCountParam for the header count.
            updateMonthSection(monthName, 0, totalEntryCountForMonth, confirmedCountForMonth, totalEntryAmountForMonth, totalConfirmedAmountForMonth); 
        });
        
        // --- NEW: Update row and section visibility for search ---
        updateRowVisibility();
        sortClientsByDate(); // Sort rows within months
        sortMonthSections(); // Sort month sections chronologically

    } catch (error) {
        console.error("Error in updateUIAndSummaries:", error);
        showMessage('Failed to update UI summaries: ' + error.message, 'error');
    }
}

// --- Global Setup ---

// No longer exposing functions globally
// window.toggleView = toggleView;
// window.addLicense = addLicense;
// window.addRandomTestData = addRandomTestData;
// window.toggleChecked = toggleChecked;
// window.deleteRow = deleteRow;
// window.openEditModal = openEditModal;
// window.closeEditModal = closeEditModal;
// window.saveEditChanges = saveEditChanges;

// --- Initialization ---

// Clean up old Obsidian local storage keys (if they exist)
try {
    localStorage.removeItem('obsidianVault');
    localStorage.removeItem('obsidianNotePath');
} catch (e) {
    console.warn("Could not remove old Obsidian keys from localStorage:", e);
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load sort preferences from localStorage
    loadSortPreferences();

    // Initial data load
    loadInitialData();

    // Initialize year tabs
    initializeYearTabs();

    // First update of UI based on loaded data
    updateUIAndSummaries();

    // Apply default sort and update indicators
    sortRowsByField(state.sortPreferences.field, state.sortPreferences.direction);
    updateSortIndicators(state.sortPreferences.field, state.sortPreferences.direction);

    // Fix structure (if needed, based on original script logic)
    // fixRowStructure();

    // --- Attach Event Listeners ---

    // Add listener for Escape key to close the Add Renewal modal
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            const addModal = document.getElementById('add-renewal-modal');
            if (addModal && addModal.style.display !== 'none') {
                hideAddRenewalModal();
            }
            const genericModal = document.getElementById('generic-content-modal');
            if (genericModal && genericModal.style.display !== 'none') {
                closeGenericModal();
            }
        }
    });

    // Event Delegation for dynamic content in main-container
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        // Notes editor state variables (must be declared before use)
        let currentNotesEditor = { popup: null, globalClickListener: null };
        let currentNotesTooltip = null;

        mainContainer.addEventListener('click', (event) => {
            const target = event.target;
            
            // Checkbox click
            if (target.matches('.custom-checkbox')) {
                const rowId = target.getAttribute('data-row-id');
                if (rowId) {
                     toggleChecked(rowId);
                 }
            }

            // Edit icon click
            if (target.matches('.edit-icon')) {
                const row = target.closest('.client-row');
                const rowId = row ? row.id : null;
                 if (rowId) {
                     openEditModal(rowId);
                 }
            }

            // Delete icon click
            if (target.matches('.delete-icon')) {
                const row = target.closest('.client-row');
                const rowId = row ? row.id : null;
                 if (rowId) {
                     const rowElement = document.getElementById(rowId);
                     const clientName = rowElement?.querySelector('.td-name')?.textContent || 'this entry';

                     showConfirmationModal(
                         `Are you sure you want to delete the entry for "${clientName}" (ID: ${rowId})?`,
                         () => { deleteRow(rowId); },
                         () => { /* Cancelled */ }
                     );

                 } else {
                     showMessage('Could not identify the row to delete.', 'error');
                 }
            }

            // Notes icon click handling is done below with separate event listeners (line 771+)
        });
        
        let notesHoverTimeoutId = null;

        mainContainer.addEventListener('mouseover', function(event) {
            const target = event.target.closest('.notes-icon');
            if (!target) return;
            if (notesHoverTimeoutId) clearTimeout(notesHoverTimeoutId);
            notesHoverTimeoutId = setTimeout(() => {
                if (currentNotesEditor.popup) return; // Don't show preview if editing
                document.querySelector('.notes-popup:not(.is-editing)')?.remove();
                const row = target.closest('.client-row');
                if (!row) return;
                const noteText = row.dataset.notes || '';
                const popup = document.createElement('div');
                popup.className = 'notes-popup';
                popup.dataset.rowId = row.id;
                const preview = document.createElement('div');
                preview.className = 'notes-preview-content';
                preview.textContent = noteText || 'No note';
                popup.appendChild(preview);
                popup.style.visibility = 'hidden';
                popup.style.display = 'block';
                document.body.appendChild(popup);
                // Measure popup size
                const popupHeight = popup.offsetHeight;
                const popupWidth = popup.offsetWidth;
                const iconRect = target.getBoundingClientRect();
                const popupTop = iconRect.top + window.scrollY - popupHeight - 8;
                const popupLeft = iconRect.left + window.scrollX;
                const finalTop = Math.max(5, popupTop);
                const finalLeft = Math.max(5, popupLeft);
                popup.style.position = 'absolute';
                popup.style.top = `${finalTop}px`;
                popup.style.left = `${finalLeft}px`;
                popup.style.visibility = 'visible';
            }, 500);
        });

        mainContainer.addEventListener('mouseout', function(event) {
            const target = event.target.closest('.notes-icon');
            if (!target) return;
            if (notesHoverTimeoutId) clearTimeout(notesHoverTimeoutId);
            if (currentNotesEditor.popup) return; // Don't hide preview if editing
            document.querySelector('.notes-popup:not(.is-editing)')?.remove();
        });

        mainContainer.addEventListener('click', function(event) {
            const target = event.target.closest('.notes-icon');
            if (!target) return;
            event.stopPropagation();
            const row = target.closest('.client-row');
            if (!row) return;
            const rowId = row.id;
            const currentNote = row.dataset.notes || '';
            // If editor for another row is open, close it
            if (currentNotesEditor.popup) {
                if (currentNotesEditor.popup.dataset.rowId !== rowId) {
                    closeNotesEditor(true);
                } else {
                    // Already editing this row, focus textarea
                    currentNotesEditor.popup.querySelector('textarea')?.focus();
                    return;
                }
            }
            // Remove preview popup if present
            let popupElement = document.querySelector('.notes-popup:not(.is-editing)');
            if (popupElement) {
                popupElement.innerHTML = '';
                popupElement.classList.add('is-editing');
            } else {
                popupElement = document.createElement('div');
                popupElement.className = 'notes-popup is-editing';
                popupElement.dataset.rowId = rowId;
                popupElement.style.display = 'block';
                document.body.appendChild(popupElement);
                const popupHeight = 100; // Estimate or measure if needed
                const iconRect = target.getBoundingClientRect();
                const popupTop = iconRect.top + window.scrollY - popupHeight - 8;
                const popupLeft = iconRect.left + window.scrollX;
                const finalTop = Math.max(5, popupTop);
                const finalLeft = Math.max(5, popupLeft);
                popupElement.style.position = 'absolute';
                popupElement.style.top = `${finalTop}px`;
                popupElement.style.left = `${finalLeft}px`;
            }
            // Add textarea
            const textarea = document.createElement('textarea');
            textarea.className = 'notes-editor-textarea';
            textarea.value = currentNote;
            popupElement.appendChild(textarea);
            // Remove any old click listener
            if (currentNotesEditor.globalClickListener) {
                document.removeEventListener('click', currentNotesEditor.globalClickListener, true);
            }
            document.addEventListener('click', globalClickListener, true);
            currentNotesEditor = { popup: popupElement, globalClickListener };
            textarea.focus();
        });

        // Global click listener for closing the notes editor
        function globalClickListener(e) {
            if (currentNotesEditor.popup && !currentNotesEditor.popup.contains(e.target)) {
                closeNotesEditor(true);
            }
        }

        function closeNotesEditor(saveChanges = false) {
            if (!currentNotesEditor.popup) return;
            if (saveChanges) {
                const textarea = currentNotesEditor.popup.querySelector('textarea');
                const newNoteText = textarea.value;
                const rowId = currentNotesEditor.popup.dataset.rowId;
                const rowElement = document.getElementById(rowId);
                if (rowElement) {
                    rowElement.dataset.notes = newNoteText;
                    updateClientNote(rowId, newNoteText);
                }
            }
            document.removeEventListener('click', currentNotesEditor.globalClickListener, true);
            currentNotesEditor.popup.remove();
            currentNotesEditor = { popup: null, globalClickListener: null };
        }
    }

    // Add Section
    const addSection = document.getElementById('add-section');
    if (addSection) {
        const addBtn = addSection.querySelector('.add-btn');
        const cancelBtn = addSection.querySelector('.cancel-btn');
        if (addBtn) addBtn.addEventListener('click', addLicense);
        if (cancelBtn) cancelBtn.addEventListener('click', hideAddRenewalModal);
    }

    // Save/Load Buttons & Input
    const saveBtn = document.getElementById('save-button');
    if (saveBtn) {
        saveBtn.addEventListener('click', handleSaveToFile);
    }
    const loadBtn = document.getElementById('load-button');
    if (loadBtn) {
        loadBtn.addEventListener('click', handleLoadClick);
    }
    const fileInputElement = document.getElementById('file-input');
    if (fileInputElement) {
        fileInputElement.addEventListener('change', handleFileLoad);
    }

    // Progress Overview Buttons
    const updateGoalBtn = document.getElementById('update-goal-btn');
    if (updateGoalBtn) updateGoalBtn.addEventListener('click', updateReceiptsGoal);

    // Quick % Calculator
    const percentCalcInput = document.getElementById('calculator-amount');
    if (percentCalcInput) {
        percentCalcInput.addEventListener('input', updatePercentageCalculator);
        // Initial calculation (in case there's a default value)
        updatePercentageCalculator();
    }

    // View Toggle Buttons
    const viewAllBtn = document.getElementById('view-all-btn');
    if (viewAllBtn) viewAllBtn.addEventListener('click', () => toggleView('all'));
    const viewConfirmedBtn = document.getElementById('view-confirmed-btn');
    if (viewConfirmedBtn) viewConfirmedBtn.addEventListener('click', () => toggleView('confirmed'));

    // Edit Modal Buttons
    const editModal = document.getElementById('edit-modal');
    if (editModal) {
        const closeBtn = editModal.querySelector('.modal-close');
        if (closeBtn) closeBtn.addEventListener('click', closeEditModal);
        const cancelBtn = editModal.querySelector('.modal .cancel-btn'); // More specific selector
        if (cancelBtn) cancelBtn.addEventListener('click', closeEditModal);
        const saveBtn = editModal.querySelector('.modal .add-btn'); // More specific selector
        if (saveBtn) saveBtn.addEventListener('click', saveEditChanges);
    }
    
    // TODO: Add listeners for Export, Import, Percentage Calc
    // TODO: Verify listeners for dynamic elements (checkbox, edit, delete) are handled elsewhere (e.g., event delegation)

    // Set up auto-save interval (e.g., every 30 seconds)
    setInterval(() => {
        // console.log('Auto-saving...');
        saveData();
    }, 30000); // 30 seconds

    // --- Add live search event listener ---
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        const newSearchTerm = event.target.value.trim().toLowerCase();
        setSearchTerm(newSearchTerm);
        updateUIAndSummaries();
      });
    } else {
      console.error('Search input element #search-input not found.');
    }

    // --- Logo Hover Message Window Logic ---
    const logoArea = document.getElementById('appLogoArea');
    const messageWindow = document.getElementById('logoHoverMessageWindow');
    const closeMessageButton = document.getElementById('closeLogoHoverMessage');
    const messageOverlay = document.getElementById('fancyMessageOverlay'); // If using overlay
    let hoverTimer = null;

    function showLogoMessageWindow() {
      if (messageWindow) messageWindow.style.display = 'block';
      if (messageOverlay) messageOverlay.style.display = 'block'; // If using overlay
      // document.body.classList.add('modal-open'); // Optional: if it should behave like other modals
    }

    function hideLogoMessageWindow() {
      if (messageWindow) messageWindow.style.display = 'none';
      if (messageOverlay) messageOverlay.style.display = 'none'; // If using overlay
      // document.body.classList.remove('modal-open'); // Optional
    }

    if (logoArea) {
      logoArea.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimer); // Clear any existing timer
        hoverTimer = setTimeout(showLogoMessageWindow, 2000);
      });

      logoArea.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimer);
        // Optionally, hide window if mouse leaves logo area, or let it persist.
        // For now, let it persist until explicitly closed.
      });
    }

    if (closeMessageButton) {
      closeMessageButton.addEventListener('click', hideLogoMessageWindow);
    }

    // Optional: Listener to close on Escape key
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && messageWindow && messageWindow.style.display === 'block') {
        hideLogoMessageWindow();
      }
    });

    // Optional: Listener to close on overlay click
    if (messageOverlay) {
      messageOverlay.addEventListener('click', hideLogoMessageWindow);
    }
    // --- End Logo Hover Message Window Logic ---

    // --- Commander Card Event Listeners ---
    const iconSaveToFile = document.getElementById('icon-save-to-file');
    if (iconSaveToFile) {
        iconSaveToFile.addEventListener('click', handleSaveToFile);
    }

    const iconLoadFromFile = document.getElementById('icon-load-from-file');
    if (iconLoadFromFile) {
        iconLoadFromFile.addEventListener('click', handleLoadClick);
    }

    const iconAddRenewal = document.getElementById('icon-add-renewal');
    if (iconAddRenewal) {
        iconAddRenewal.addEventListener('click', showAddRenewalModal);
    }

    // --- Custom Help Modal Logic ---
    const helpModalOverlay = document.getElementById('custom-help-modal-overlay');
    const helpModalCloseBtn = document.getElementById('custom-help-modal-close-btn');
    const iconSystemHelp = document.getElementById('icon-system-help');

    function openHelpModal() {
        if (helpModalOverlay) {
            helpModalOverlay.style.display = 'flex';
            setTimeout(() => helpModalOverlay.classList.add('active'), 10); // for fade-in if desired
        }
    }
    function closeHelpModal() {
        if (helpModalOverlay) {
            helpModalOverlay.style.display = 'none';
            helpModalOverlay.classList.remove('active');
        }
    }
    if (iconSystemHelp) {
        iconSystemHelp.addEventListener('click', openHelpModal);
    }
    if (helpModalCloseBtn) {
        helpModalCloseBtn.addEventListener('click', closeHelpModal);
    }
    if (helpModalOverlay) {
        helpModalOverlay.addEventListener('click', (event) => {
            if (event.target === helpModalOverlay) {
                closeHelpModal();
            }
        });
    }
    // Optional: Escape key closes help modal if open
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && helpModalOverlay && helpModalOverlay.style.display !== 'none') {
            closeHelpModal();
        }
    });

    // const btnChatStd = document.getElementById('btn-chat-std');
    // if (btnChatStd) {
    //     btnChatStd.addEventListener('click', () => {
    //         console.log('SolidCAM Chat Std button clicked');
    //         openGenericModal('SolidCAM Chat', 'src/pro_chat.html'); // This might need updating if pro_chat.html was removed/renamed
    //     });
    // }

    // --- App Suggestions Modal Logic (Updated for new structure) ---
    const appSuggestionsButton = document.getElementById('icon-app-suggestions');
    const appSuggestionModalOverlay = document.getElementById('app-suggestion-modal-overlay');
    const appSuggestionModalCloseBtn = document.getElementById('app-suggestion-modal-close-btn');
    const appSuggestionCancelBtn = document.getElementById('app-suggestion-cancel-btn');
    const appSuggestionForm = document.getElementById('app-suggestion-form');
    // Open
    function openSuggestionModal() {
        if (appSuggestionModalOverlay) {
            appSuggestionModalOverlay.style.display = 'flex';
            setTimeout(() => appSuggestionModalOverlay.classList.add('active'), 10);
        }
    }
    // Close
    function closeSuggestionModal() {
        if (appSuggestionModalOverlay) {
            appSuggestionModalOverlay.style.display = 'none';
            appSuggestionModalOverlay.classList.remove('active');
        }
        // Optionally clear form fields
        if (appSuggestionForm) {
            appSuggestionForm.reset();
        }
    }
    if (appSuggestionsButton) {
        appSuggestionsButton.addEventListener('click', openSuggestionModal);
    }
    if (appSuggestionModalCloseBtn) {
        appSuggestionModalCloseBtn.addEventListener('click', closeSuggestionModal);
    }
    if (appSuggestionCancelBtn) {
        appSuggestionCancelBtn.addEventListener('click', closeSuggestionModal);
    }
    if (appSuggestionModalOverlay) {
        appSuggestionModalOverlay.addEventListener('click', (event) => {
            if (event.target === appSuggestionModalOverlay) {
                closeSuggestionModal();
            }
        });
    }
    // Escape key closes modal if open
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && appSuggestionModalOverlay && appSuggestionModalOverlay.style.display !== 'none') {
            closeSuggestionModal();
        }
    });

    if (appSuggestionForm) {
        appSuggestionForm.addEventListener('submit', (event) => {
            event.preventDefault(); // Prevent default form submission

            const title = document.getElementById('suggestion-title').value;
            const details = document.getElementById('suggestion-details').value;
            const priority = document.getElementById('suggestion-priority').value;
            const userName = document.getElementById('suggestion-user-name').value;

            const mailtoEmail = 'cody.solidcam@gmail.com';
            let subject = `App Suggestion: ${title || 'No Title'}`;
            
            // Build plain text body without URL encoding yet
            let bodyText = "--- App Suggestion ---\n\n";
            bodyText += `Title: ${title || 'N/A'}\n\n`;
            bodyText += "Details:\n";
            bodyText += `${details || 'No details provided.'}\n\n`;
            bodyText += `Priority: ${priority || 'Medium'}\n\n`;
            
            if (userName) {
                bodyText += `Submitted by: ${userName}\n\n`;
            }
            bodyText += "----------------------";

            // Create mailto link with properly encoded body
            const mailtoLink = `mailto:${mailtoEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

            // Open the user's default email client
            window.location.href = mailtoLink;

            // Reset form and close modal
            setTimeout(() => {
                appSuggestionForm.reset();
                if (appSuggestionsModal) {
                    appSuggestionsModal.style.display = 'none';
                }
                
                // Show success message
                alert('Your suggestion has been prepared and will open in your email client.');
            }, 100); // Small delay to ensure form reset happens after email client opens
        });
    }
    // --- END App Suggestions Modal Logic ---

});