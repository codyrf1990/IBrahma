console.log('main.js: Module execution started.'); // Log module start
import { state, setSearchTerm, updateClientNote } from './state.js';
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

// --- NEW: Chat Pro Sidebar Helper Functions ---
const chatProSidebar = document.getElementById('chatProSidebar');
const chatProSidebarIframe = document.getElementById('chatProSidebarIframe');
const btnChatPro = document.getElementById('btn-chat-pro');
const closeChatProSidebarBtn = document.getElementById('closeChatProSidebarBtn');

function openChatProSidebar() {
    if (chatProSidebar && chatProSidebarIframe) {
        if (chatProSidebarIframe.src !== 'src/solidcam_chat_pro.html') {
            chatProSidebarIframe.src = 'src/solidcam_chat_pro.html';
            chatProSidebarIframe.addEventListener('load', function syncAndConfigOnce() {
                console.log('[Main.js] Chat Pro iframe loaded. Syncing dark mode and sending initial config.');
                if (typeof window.syncChatIframeDarkMode === 'function') {
                    window.syncChatIframeDarkMode();
                }
                sendChatConfigToIframe(); // <-- NEW: Send initial config
                chatProSidebarIframe.removeEventListener('load', syncAndConfigOnce);
            });
        } else {
            if (typeof window.syncChatIframeDarkMode === 'function') {
                window.syncChatIframeDarkMode();
            }
            // If iframe already loaded and sidebar is just being reopened, send current config
            sendChatConfigToIframe(); // <-- NEW: Send config on reopen
        }
        chatProSidebar.classList.add('open');
    } else {
        console.error('Chat Pro Sidebar elements not found.');
    }
}

function closeChatProSidebar() {
    if (chatProSidebar) {
        chatProSidebar.classList.remove('open');
        // document.body.classList.remove('chat-sidebar-open'); // Optional
        // Optionally clear the iframe to stop any processes
        // if (chatProSidebarIframe) {
        //     chatProSidebarIframe.src = 'about:blank';
        // }
    } else {
        console.error('Close Chat Pro Sidebar button not found.');
    }
}
// --- END NEW: Chat Pro Sidebar Helper Functions ---

// --- NEW: Chat Pro API Settings Modal Helper Functions ---
const chatProApiSettingsModal = document.getElementById('chat-pro-api-settings-modal');
const chatProApiKeyInput = document.getElementById('chat-pro-api-key');
const chatProConnectBtn = document.getElementById('chat-pro-connect-btn');
const chatProStatus = document.getElementById('chat-pro-status');
const chatProSaveSettingsBtn = document.getElementById('chat-pro-save-settings-btn'); // Added

// Model Parameter Inputs
const chatProTemperatureSlider = document.getElementById('chat-pro-temperature');
const chatProTemperatureValueSpan = chatProTemperatureSlider ? chatProTemperatureSlider.nextElementSibling : null; // Assuming span is next sibling
const chatProMaxTokensInput = document.getElementById('chat-pro-max-tokens');
const chatProTopPSlider = document.getElementById('chat-pro-top-p');
const chatProTopPValueSpan = chatProTopPSlider ? chatProTopPSlider.nextElementSibling : null; // Assuming span is next sibling
const chatProTopKInput = document.getElementById('chat-pro-top-k');

// LocalStorage keys
const LS_API_KEY = 'geminiProApiKey'; // Updated for clarity
const LS_TEMPERATURE = 'geminiProTemperature';
const LS_MAX_TOKENS = 'geminiProMaxTokens';
const LS_TOP_P = 'geminiProTopP';
const LS_TOP_K = 'geminiProTopK';
const LS_SELECTED_MODEL = 'geminiProSelectedModel'; // For the main model selector

// Define default model parameter values
const DEFAULT_TEMPERATURE = '0.7';
const DEFAULT_MAX_TOKENS = '2048';
const DEFAULT_TOP_P = '0.95';
const DEFAULT_TOP_K = '40';

function openChatProApiSettingsModal() {
    if (chatProApiSettingsModal) {
        // Load and display API key
        const savedApiKey = localStorage.getItem(LS_API_KEY);
        if (savedApiKey && chatProApiKeyInput) {
            chatProApiKeyInput.value = savedApiKey;
        }
        if (chatProStatus && chatProApiKeyInput) {
            chatProStatus.textContent = chatProApiKeyInput.value ? 'Status: Key loaded from local storage' : 'Status: Not Connected';
        }

        // Load and display Model Parameters & their defaults
        const tempDisplay = document.getElementById('default-temp-display');
        const maxTokensDisplay = document.getElementById('default-max-tokens-display');
        const topPDisplay = document.getElementById('default-top-p-display');
        const topKDisplay = document.getElementById('default-top-k-display');

        if (chatProTemperatureSlider) {
            chatProTemperatureSlider.value = localStorage.getItem(LS_TEMPERATURE) || DEFAULT_TEMPERATURE;
            if (chatProTemperatureValueSpan) chatProTemperatureValueSpan.textContent = chatProTemperatureSlider.value;
            if (tempDisplay) tempDisplay.textContent = `(Default: ${DEFAULT_TEMPERATURE})`;
        }
        if (chatProMaxTokensInput) {
            chatProMaxTokensInput.value = localStorage.getItem(LS_MAX_TOKENS) || DEFAULT_MAX_TOKENS; 
            if (maxTokensDisplay) maxTokensDisplay.textContent = `(Default: ${DEFAULT_MAX_TOKENS})`;
        }
        if (chatProTopPSlider) {
            chatProTopPSlider.value = localStorage.getItem(LS_TOP_P) || DEFAULT_TOP_P;
            if (chatProTopPValueSpan) chatProTopPValueSpan.textContent = chatProTopPSlider.value;
            if (topPDisplay) topPDisplay.textContent = `(Default: ${DEFAULT_TOP_P})`;
        }
        if (chatProTopKInput) {
            chatProTopKInput.value = localStorage.getItem(LS_TOP_K) || DEFAULT_TOP_K;
            if (topKDisplay) topKDisplay.textContent = `(Default: ${DEFAULT_TOP_K})`;
        }
        chatProApiSettingsModal.style.display = 'block'; // Or 'flex'
    } else {
        console.error('Chat Pro API Settings Modal not found.');
    }
}

function closeChatProApiSettingsModal() {
    if (chatProApiSettingsModal) {
        chatProApiSettingsModal.style.display = 'none';
    }
}

function handleChatProConnect() {
    if (chatProApiKeyInput && chatProStatus) {
        const apiKey = chatProApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem(LS_API_KEY, apiKey);
            chatProStatus.textContent = 'Status: Connected (Key Saved)';
            console.log('Chat Pro API Key saved:', apiKey);
            // No longer call sendChatConfigToIframe directly, save button will do it.
            // Or, we can call it if the user expects connect to also apply current settings.
            // For now, let's assume "Connect" just saves the key, and "Save Settings" saves all.
        } else {
            chatProStatus.textContent = 'Status: API Key cannot be empty.';
            localStorage.removeItem(LS_API_KEY);
        }
    } else {
        console.error('Chat Pro API Key input or status element not found.');
    }
}

// NEW: Function to save all settings from the modal
function handleSaveChatProSettings() {
    console.log('Saving Chat Pro API settings...');
    if (chatProApiKeyInput) {
        const apiKey = chatProApiKeyInput.value.trim();
        if (apiKey) {
            localStorage.setItem(LS_API_KEY, apiKey);
            if(chatProStatus) chatProStatus.textContent = 'Status: Connected (Key Saved)';
            console.log('API Key saved:', apiKey);
        } else {
            localStorage.removeItem(LS_API_KEY);
            if(chatProStatus) chatProStatus.textContent = 'Status: API Key cannot be empty. Not saved.';
            console.log('API Key cleared.');
        }
    }

    if (chatProTemperatureSlider) localStorage.setItem(LS_TEMPERATURE, chatProTemperatureSlider.value);
    if (chatProMaxTokensInput) localStorage.setItem(LS_MAX_TOKENS, chatProMaxTokensInput.value);
    if (chatProTopPSlider) localStorage.setItem(LS_TOP_P, chatProTopPSlider.value);
    if (chatProTopKInput) localStorage.setItem(LS_TOP_K, chatProTopKInput.value);

    console.log('Model parameters saved:', {
        temp: chatProTemperatureSlider ? chatProTemperatureSlider.value : 'N/A',
        maxTokens: chatProMaxTokensInput ? chatProMaxTokensInput.value : 'N/A',
        topP: chatProTopPSlider ? chatProTopPSlider.value : 'N/A',
        topK: chatProTopKInput ? chatProTopKInput.value : 'N/A',
    });

    sendChatConfigToIframe(); // Send the updated config to the iframe
    
    if (chatProStatus) { // General saved message
        chatProStatus.textContent = 'Settings Saved.';
        setTimeout(() => { // Revert to connection status after a delay
            if (chatProApiKeyInput && chatProApiKeyInput.value.trim()) {
                chatProStatus.textContent = 'Status: Key loaded from local storage';
            } else {
                chatProStatus.textContent = 'Status: Not Connected';
            }
        }, 2000);
    }
    // Optionally close the modal after saving
    // closeChatProApiSettingsModal(); 
}

// --- NEW: Function to send config to Chat Pro Iframe ---
function sendChatConfigToIframe() {
    const apiKey = localStorage.getItem(LS_API_KEY);
    const modelSelector = document.getElementById('gemini-model-selector'); // In index.html
    
    const temperature = localStorage.getItem(LS_TEMPERATURE) || '0.7';
    const maxOutputTokens = localStorage.getItem(LS_MAX_TOKENS) || '2048';
    const topP = localStorage.getItem(LS_TOP_P) || '0.95';
    const topK = localStorage.getItem(LS_TOP_K) || '40';

    if (chatProSidebarIframe && chatProSidebarIframe.contentWindow && modelSelector) {
        const selectedModel = modelSelector.value;
        // Save the selected model to localStorage as well, so it can be reloaded if needed
        localStorage.setItem(LS_SELECTED_MODEL, selectedModel);

        console.log(`[Main.js] Sending config to iframe: Model - ${selectedModel}, API Key present - ${!!apiKey}, Temp - ${temperature}, MaxTokens - ${maxOutputTokens}, TopP - ${topP}, TopK - ${topK}`);
        chatProSidebarIframe.contentWindow.postMessage({
            type: 'CHAT_PRO_CONFIG',
            apiKey: apiKey,
            selectedModel: selectedModel,
            temperature: parseFloat(temperature),
            maxOutputTokens: parseInt(maxOutputTokens, 10),
            topP: parseFloat(topP),
            topK: parseInt(topK, 10)
        }, '*'); // Consider specifying target origin in production
    } else {
        if (!modelSelector) console.error('[Main.js] Main page model selector not found for sending config.');
        if (!chatProSidebarIframe || !chatProSidebarIframe.contentWindow) console.error('[Main.js] Chat Pro iframe or its contentWindow not available for sending config.');
    }
}
// --- END NEW: Function to send config to Chat Pro Iframe ---

// --- NEW: Chat Pro Sidebar Resize Logic ---
const chatProSidebarDragHandle = document.getElementById('chatProSidebarDragHandle');
let isResizingChat = false;
let initialChatSidebarWidth = 0;
let initialChatMouseX = 0;
let activePointerId = null; // To store the pointer ID

// Define handlers with explicit names for easier removal reference if needed
const handleChatResizeMouseMoveBound = (e) => handleChatResizeMouseMove(e);
const stopChatResizeBound = (e) => stopChatResize(e); // Pass event to stopChatResize

if (chatProSidebar && chatProSidebarDragHandle) {
    chatProSidebarDragHandle.addEventListener('pointerdown', (e) => { // Changed to pointerdown
        // Prevent default browser actions for mousedown, like text selection or image dragging
        // Only capture for primary button to avoid issues with other pointer types/buttons
        if (e.button !== 0) return;
        e.preventDefault(); 
        
        console.log('[POINTERDOWN] target:', e.target, 'currentTarget:', e.currentTarget, 'pointerId:', e.pointerId); // DEBUG

        isResizingChat = true;
        activePointerId = e.pointerId; // Store the pointerId
        initialChatMouseX = e.clientX;
        initialChatSidebarWidth = chatProSidebar.offsetWidth;
        
        // Disable text selection on the entire body during drag
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        
        // Crucially, disable transitions on the sidebar during drag for direct width manipulation
        chatProSidebar.style.transition = 'none'; 

        // Capture the pointer on the drag handle itself
        e.target.setPointerCapture(activePointerId);

        chatProSidebarDragHandle.addEventListener('pointermove', handleChatResizeMouseMoveBound); // Changed to pointermove, attached to handle
        chatProSidebarDragHandle.addEventListener('pointerup', stopChatResizeBound); // Changed to pointerup, attached to handle
        chatProSidebarDragHandle.addEventListener('pointercancel', stopChatResizeBound); // Handle unexpected pointer cancellations
    });
}

function handleChatResizeMouseMove(e) {
    if (!isResizingChat || e.pointerId !== activePointerId) return; // Process only the captured pointer
    // No need to preventDefault here as pointermove on a captured element won't scroll by default

    console.log('[POINTERMOVE] target:', e.target, 'currentTarget:', e.currentTarget, 'pointerId:', e.pointerId); // DEBUG
    // const sidebarRect = chatProSidebar.getBoundingClientRect(); // DEBUG - No longer strictly needed if target is consistent

    const currentMouseX = e.clientX;
    const deltaX = currentMouseX - initialChatMouseX;
    let newWidth = initialChatSidebarWidth - deltaX;

    console.log(`initialX: ${initialChatMouseX}, currentX: ${e.clientX}, deltaX: ${deltaX}, initialWidth: ${initialChatSidebarWidth}, newWidth: ${newWidth}`);

    const minWidth = 200; // Minimum width
    const maxWidth = Math.min(800, window.innerWidth - 20); // Maximum width, ensuring it stays mostly on screen

    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    chatProSidebar.style.width = newWidth + 'px';
}

function stopChatResize(e) { // Accept event argument
    if (isResizingChat) {
        console.log('[POINTERUP/CANCEL] target:', e.target, 'currentTarget:', e.currentTarget, 'pointerId:', e.pointerId); // DEBUG
        
        if (activePointerId !== null && e.target.hasPointerCapture(activePointerId)) {
            e.target.releasePointerCapture(activePointerId); // Release the captured pointer
        }
        activePointerId = null;
        isResizingChat = false;
        
        // Re-enable text selection and reset cursor
        document.body.style.userSelect = ''; 
        document.body.style.cursor = 'default';
        
        // Only re-enable the transition for the 'right' property (for open/close animation)
        // The width has been set manually and should not transition immediately after drag.
        chatProSidebar.style.transition = 'right 0.3s ease-in-out'; 

        chatProSidebarDragHandle.removeEventListener('pointermove', handleChatResizeMouseMoveBound);
        chatProSidebarDragHandle.removeEventListener('pointerup', stopChatResizeBound);
        chatProSidebarDragHandle.removeEventListener('pointercancel', stopChatResizeBound);
    }
}
// --- END NEW: Chat Pro Sidebar Resize Logic ---

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

    // --- Attach Event Listeners for Chat Pro API Modal (NEW SECTION - MODIFIED) ---
    // Listeners for the API Settings Modal (within Chat Pro Sidebar)
    const openApiSettingsBtn = document.getElementById('chat-pro-api-settings-btn');
    const closeApiSettingsBtn = document.getElementById('close-chat-pro-api-settings-modal-btn');
    const mainPageModelSelector = document.getElementById('gemini-model-selector'); // Selector from index.html

    if (openApiSettingsBtn) {
        openApiSettingsBtn.addEventListener('click', () => {
            // If modal is currently visible (i.e., display is not 'none' and not empty), then close it.
            // Otherwise, open it.
            if (chatProApiSettingsModal && 
                chatProApiSettingsModal.style.display && 
                chatProApiSettingsModal.style.display !== 'none') {
                closeChatProApiSettingsModal();
            } else {
                if (chatProApiSettingsModal) { 
                    openChatProApiSettingsModal();
                } else {
                    console.error('[KeyIconClick] chatProApiSettingsModal element is null. Cannot open.');
                }
            }
        });
    } else {
        console.error('Button to open Chat Pro API Settings modal (#chat-pro-api-settings-btn) not found.');
    }
    if (closeApiSettingsBtn) {
        closeApiSettingsBtn.addEventListener('click', closeChatProApiSettingsModal);
    } else {
        console.error('Button to close Chat Pro API Settings modal (#close-chat-pro-api-settings-modal-btn) not found.');
    }
    if (chatProConnectBtn) {
        chatProConnectBtn.addEventListener('click', () => {
            handleChatProConnect(); 
            // UX: Decide if modal should auto-close on connect. For now, "Connect" only handles key.
            // "Save Settings" button handles saving all params and sending to iframe.
        });
    } else {
        console.error('Chat Pro API Connect button (#chat-pro-connect-btn) not found in modal.');
    }

    // NEW: Listener for Save Settings button in API Modal
    if (chatProSaveSettingsBtn) {
        chatProSaveSettingsBtn.addEventListener('click', handleSaveChatProSettings);
    } else {
        console.error('Chat Pro API Save Settings button (#chat-pro-save-settings-btn) not found in modal.');
    }

    // Listeners for sliders to update their value displays
    if (chatProTemperatureSlider && chatProTemperatureValueSpan) {
        chatProTemperatureSlider.addEventListener('input', (event) => {
            chatProTemperatureValueSpan.textContent = event.target.value;
        });
    }
    if (chatProTopPSlider && chatProTopPValueSpan) {
        chatProTopPSlider.addEventListener('input', (event) => {
            chatProTopPValueSpan.textContent = event.target.value;
        });
    }

    // Listener for main page model selector changes
    if (mainPageModelSelector) {
        // Load saved model on init
        const savedModel = localStorage.getItem(LS_SELECTED_MODEL);
        if (savedModel) {
            mainPageModelSelector.value = savedModel;
        }
        mainPageModelSelector.addEventListener('change', () => {
            console.log('[Main.js] Main page model selector changed.');
            localStorage.setItem(LS_SELECTED_MODEL, mainPageModelSelector.value); // Save on change
            sendChatConfigToIframe(); // <-- NEW: Send config on model change
        });
    } else {
        console.error('[Main.js] Main page model selector (#gemini-model-selector) not found for event listener.');
    }
    // --- END Attach Event Listeners for Chat Pro API Modal ---

    // Fix structure (if needed, based on original script logic)
    // fixRowStructure();

    // --- Attach Event Listeners ---

    // Add listener for Escape key to close the Add Renewal modal
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            console.log('Escape key pressed'); // Debug log
            const addModal = document.getElementById('add-renewal-modal');
            if (addModal && addModal.style.display !== 'none') {
                hideAddRenewalModal();
            }
            const genericModal = document.getElementById('generic-content-modal');
            if (genericModal && genericModal.style.display !== 'none') {
                closeGenericModal(); 
            }
            // Close Chat Pro Sidebar on Escape
            if (chatProSidebar && chatProSidebar.classList.contains('open')) {
                closeChatProSidebar();
            }
            // Close Chat Pro API Settings Modal on Escape (NEW)
            if (chatProApiSettingsModal && chatProApiSettingsModal.style.display !== 'none') {
                closeChatProApiSettingsModal();
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

    // Enhanced logging for btn-chat-pro
    console.log('[Main.js] Attempting to find #btn-chat-pro for event listener attachment...');
    if (btnChatPro) {
        console.log('[Main.js] Found #btn-chat-pro element:', btnChatPro);
        btnChatPro.addEventListener('click', () => {
            console.log('[Main.js] SolidCAM Chat Pro button CLICKED!');
            if (chatProSidebar && chatProSidebar.classList.contains('open')) {
                closeChatProSidebar();
            } else {
                openChatProSidebar(); 
            }
        });
        console.log('[Main.js] Event listener ATTACHED to #btn-chat-pro.');
    } else {
        console.error('[Main.js] CRITICAL: Could not find #btn-chat-pro element. Listener NOT attached.');
    }

    // Listener for the new sidebar's close button
    if (closeChatProSidebarBtn) {
        closeChatProSidebarBtn.addEventListener('click', closeChatProSidebar);
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

    console.log("App initialized.");
});