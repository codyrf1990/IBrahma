console.log('main.js: Module execution started.'); // Log module start
import { state, setSearchTerm, updateClientNote } from './state.js';
import { showMessage, getMonthFromDate, getSampleFormData } from './utils.js';
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
    updateRowVisibility
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

// --- Global Update Function ---

/**
 * Central function to recalculate statistics and update the entire UI.
 * Reads data from the DOM, performs calculations, and updates summary displays and month subtotals.
 */
export function updateUIAndSummaries() {
    console.log("Updating UI and Summaries...");
    try {
        // 1. Get Data and Settings
        const clients = getAllClientsFromDOM(); // MODIFIED: Get data from DOM
        // Log the data retrieved from DOM at the start of the update process
        console.log('[UpdateUI] Data retrieved from DOM:', JSON.stringify(clients, null, 2)); // MODIFIED: Log message
        
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

        console.log("UI and Summaries updated.");

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
    console.log('main.js: DOMContentLoaded event fired.'); // Log DOMContentLoaded
    console.log("DOM fully loaded and parsed. Initializing app...");

    // Initial data load
    loadInitialData();

    // First update of UI based on loaded data
    updateUIAndSummaries();

    // Fix structure (if needed, based on original script logic)
    // fixRowStructure();

    // --- Attach Event Listeners ---

    // Add listener for Escape key to close the Add Renewal modal
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            console.log('Escape key pressed'); // Debug log
            const addModal = document.getElementById('add-renewal-modal');
            // Check if the modal exists and is currently visible (display is not 'none')
            if (addModal && addModal.style.display !== 'none') {
                hideAddRenewalModal();
            }
            // Also close generic content modal on Escape
            const genericModal = document.getElementById('generic-content-modal');
            if (genericModal && genericModal.style.display !== 'none') {
                closeGenericModal(); // Assuming closeGenericModal function exists
            }
        }
    });

    // Event Delegation for dynamic content in main-container
    const mainContainer = document.getElementById('main-container');
    if (mainContainer) {
        mainContainer.addEventListener('click', (event) => {
            const target = event.target;
            
            // Checkbox click
            if (target.matches('.custom-checkbox')) {
                console.log('[Delegation] Checkbox clicked:', target);
                const rowId = target.getAttribute('data-row-id');
                console.log('[Delegation] Row ID:', rowId);
                if (rowId) {
                     // Call the actual handler function from eventHandlers.js
                     toggleChecked(rowId);
                 }
            }
            
            // Edit icon click
            if (target.matches('.edit-icon')) {
                console.log('[Delegation] Edit icon clicked:', target);
                const row = target.closest('.client-row');
                const rowId = row ? row.id : null;
                console.log('[Delegation] Row ID for edit:', rowId);
                 if (rowId) {
                     // Call the actual handler function from domUtils.js
                     openEditModal(rowId);
                 }
            }

            // Delete icon click
            if (target.matches('.delete-icon')) {
                console.log('[Delegation] Delete icon clicked:', target);
                const row = target.closest('.client-row');
                const rowId = row ? row.id : null;
                console.log('[Delegation] Row ID for delete:', rowId);
                 if (rowId) {
                     console.log('[Delegation] Entered if(rowId) block, preparing for modal.');
                     console.log('[Delegation] Showing confirmation modal for:', rowId);
                     const rowElement = document.getElementById(rowId);
                     const clientName = rowElement?.querySelector('.td-name')?.textContent || 'this entry';

                     // Use the new confirmation modal
                     showConfirmationModal(
                         `Are you sure you want to delete the entry for "${clientName}" (ID: ${rowId})?`,
                         () => { // onConfirm callback
                             console.log('[Delegation] Modal confirmed for:', rowId);
                             deleteRow(rowId); // Call the original delete function
                         },
                         () => { // onCancel callback
                             console.log('[Delegation] Modal cancelled for:', rowId);
                         }
                     );

                 } else {
                     console.warn('[Delegation] Delete clicked, but could not find parent row ID.');
                     showMessage('Could not identify the row to delete.', 'error');
                 }
            }
            
            // Notes icon click
            if (target.matches('.notes-icon')) {
                console.log('[Delegation] Notes icon clicked:', target);
                event.stopPropagation();
                if (currentNotesEditor.popup) closeNotesEditor(true);
                if (currentNotesTooltip) {
                    currentNotesTooltip.remove();
                    currentNotesTooltip = null;
                }
                const row = target.closest('.client-row');
                if (!row) return;
                const rowId = row.id;
                const currentNote = row.dataset.notes || '';
                const popup = document.createElement('div');
                popup.className = 'notes-editor-popup';
                popup.dataset.rowId = rowId;
                const textarea = document.createElement('textarea');
                textarea.value = currentNote;
                popup.appendChild(textarea);

                // --- Position the popup below the icon, but keep it on screen ---
                const iconRect = target.getBoundingClientRect();
                const popupWidth = 260; // Approximate, should match/min-width in CSS
                const popupHeight = 100; // Approximate, for bottom edge check
                const gap = 5;
                let popupLeft = iconRect.left + window.scrollX;
                let popupTop = iconRect.bottom + window.scrollY + gap;

                // Clamp right edge
                const maxLeft = window.scrollX + window.innerWidth - popupWidth - 8; // 8px margin
                if (popupLeft > maxLeft) popupLeft = maxLeft;
                // Clamp left edge
                if (popupLeft < window.scrollX + 4) popupLeft = window.scrollX + 4;
                // Clamp bottom edge (optional, if popup would go off bottom)
                const maxTop = window.scrollY + window.innerHeight - popupHeight - 8;
                if (popupTop > maxTop) popupTop = maxTop;
                // Clamp top edge (optional, if icon is near bottom)
                if (popupTop < window.scrollY + 4) popupTop = window.scrollY + 4;

                popup.style.position = 'absolute';
                popup.style.top = `${popupTop}px`;
                popup.style.left = `${popupLeft}px`;
                document.body.appendChild(popup);
                textarea.focus();
                // Prevent immediate close
                setTimeout(() => {
                    const globalClickListener = (e) => {
                        if (currentNotesEditor.popup && !currentNotesEditor.popup.contains(e.target)) {
                            closeNotesEditor(true);
                        }
                    };
                    document.addEventListener('click', globalClickListener, true);
                    currentNotesEditor = { popup, globalClickListener };
                }, 0);
            }
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

        let currentNotesEditor = { popup: null, globalClickListener: null };

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

    // Show Add Renewal Modal Button
    const showAddBtn = document.getElementById('show-add-form-btn');
    if (showAddBtn) {
        showAddBtn.addEventListener('click', () => {
            console.log('Show Add Renewal button clicked');
            clearForm(); // Clear form before showing
            showAddRenewalModal();
        });
    } else {
        console.error("Button #show-add-form-btn not found");
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
    const percentCalcInput = document.getElementById('percent-input');
    if (percentCalcInput) {
        percentCalcInput.addEventListener('input', updatePercentageCalculator);
        // Initial calculation (in case there's a default value)
        updatePercentageCalculator();
    } else {
        console.error("Quick % Calc input field (#percent-input) not found");
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

    const iconSystemSettings = document.getElementById('icon-system-settings');
    if (iconSystemSettings) {
        iconSystemSettings.addEventListener('click', () => {
            console.log('System Settings icon clicked');
            // openGenericModal('System Settings', 'placeholder_settings.html'); // Example
        });
    }

    const iconUserProfile = document.getElementById('icon-user-profile');
    if (iconUserProfile) {
        iconUserProfile.addEventListener('click', () => {
            console.log('User Profile icon clicked');
            // openGenericModal('User Profile', 'placeholder_profile.html'); // Example
        });
    }

    const iconSystemHelp = document.getElementById('icon-system-help');
    if (iconSystemHelp) {
        iconSystemHelp.addEventListener('click', () => {
            console.log('System Help icon clicked');
            // openGenericModal('Help', 'placeholder_help.html'); // Example
        });
    }

    const btnChatStd = document.getElementById('btn-chat-std');
    if (btnChatStd) {
        btnChatStd.addEventListener('click', () => {
            console.log('SolidCAM Chat Std button clicked');
            openGenericModal('SolidCAM Chat Standard', 'YOUR_CHAT_LINK_HERE_STD'); // Replace with actual URL
        });
    }

    // Enhanced logging for btn-chat-pro
    console.log('[Main.js] Attempting to find #btn-chat-pro for event listener attachment...');
    const btnChatPro = document.getElementById('btn-chat-pro');
    if (btnChatPro) {
        console.log('[Main.js] Found #btn-chat-pro element:', btnChatPro);
        btnChatPro.addEventListener('click', () => {
            console.log('[Main.js] SolidCAM Chat Pro button CLICKED!');
            openGenericModal('SolidCAM Chat Pro', 'src/chatbot_pro_interface.html');
        });
        console.log('[Main.js] Event listener ATTACHED to #btn-chat-pro.');
    } else {
        console.error('[Main.js] CRITICAL: Could not find #btn-chat-pro element. Listener NOT attached.');
    }

    const iconEmailTemplates = document.getElementById('icon-email-templates');
    if (iconEmailTemplates) {
        iconEmailTemplates.addEventListener('click', () => {
            console.log('Email Templates icon clicked');
            openGenericModal('Email Template System', 'placeholder_email_system.html'); // Replace with actual path/handler
        });
    }

    const iconAdvCalculator = document.getElementById('icon-adv-calculator');
    if (iconAdvCalculator) {
        iconAdvCalculator.addEventListener('click', () => {
            console.log('Advanced Calculator icon clicked');
            // openGenericModal('Advanced Calculator', 'placeholder_calculator.html'); // Example
        });
    }

    const iconScratchpad = document.getElementById('icon-scratchpad');
    if (iconScratchpad) {
        iconScratchpad.addEventListener('click', () => {
            console.log('Scratchpad icon clicked');
            // openGenericModal('Scratchpad', 'placeholder_scratchpad.html'); // Example
        });
    }

    console.log("App initialized.");
});