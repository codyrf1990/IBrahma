// State management for the application
import { getAllClientsFromDOM } from './domUtils.js'; // Import DOM utility

export const state = {
    clients: [], // Added placeholder based on plan - data might live elsewhere?
    currentView: 'all', // Default view
    totals: {}, // Monthly subtotals - Should these be saved? Recalculated usually better.
    receiptsGoal: 55, // Target number of confirmed receipts
    checkedRows: [], // Array to store the IDs of checked rows
    lastSaved: null, // Timestamp of the last save - maybe not needed in saved file?
    editingRowId: null, // Transient state, likely should not be saved.
    searchTerm: '', // Added placeholder based on plan
    activeYear: new Date().getFullYear(), // Currently selected year
    availableYears: [], // Array of years with tabs (sorted ascending)
    sortPreferences: {
        field: 'closeDate', // Default sort field
        direction: 'asc'    // 'asc' or 'desc'
    }
}; 

/**
 * Returns a copy of the relevant application state for saving.
 * Excludes transient state like editingRowId or potentially calculated totals.
 */
export function getStateForSave() {
    // Retrieve the current clients directly from the application state (NOT the DOM)
    const stateToSave = {
        clients: state.clients.map(c => ({ ...c, notes: c.notes || '' })),
        receiptsGoal: state.receiptsGoal,
        checkedRows: state.checkedRows,
        searchTerm: state.searchTerm,
        activeYear: state.activeYear,
        availableYears: state.availableYears
    };
    return stateToSave;
}

/**
 * Replaces the current application state with data loaded from a file.
 * NOTE: This updates the state object, but the UI refresh triggered afterwards
 * MUST use state.clients instead of getAllClientsFromDOM() to reflect these changes.
 * @param {object} newState - The state object loaded from the file.
 */
export function replaceState(newState) {
    // Basic validation
    if (newState && typeof newState === 'object') {
        // Replace state properties, providing defaults if missing
        // This updates the state object, which *should* become the source of truth
        state.clients = (Array.isArray(newState.clients)) ? newState.clients.map(client => ({ ...client, notes: client.notes || '' })) : [];
        state.receiptsGoal = (typeof newState.receiptsGoal === 'number') ? newState.receiptsGoal : 55; // Default goal
        state.checkedRows = Array.isArray(newState.checkedRows) ? newState.checkedRows : [];
        state.searchTerm = (typeof newState.searchTerm === 'string') ? newState.searchTerm : '';
        state.activeYear = (typeof newState.activeYear === 'number') ? newState.activeYear : new Date().getFullYear();
        state.availableYears = Array.isArray(newState.availableYears) ? newState.availableYears : [];
        // Reset transient state
        state.editingRowId = null;
    } else {
        console.error('[State] Invalid data provided to replaceState.');
    }
}

// Add a setter for the search term
export function setSearchTerm(term) {
  state.searchTerm = term;
}

/**
 * Update the notes for a client by clientId
 */
export function updateClientNote(clientId, newNoteText) {
    const client = state.clients.find(c => c.id === clientId);
    if (client) {
        client.notes = newNoteText;
    } else {
        console.warn(`[State] Client not found for note update: ${clientId}`);
    }
}

/**
 * Load sort preferences from localStorage
 */
export function loadSortPreferences() {
    try {
        const saved = localStorage.getItem('opportunityTrackerSortPreferences');
        if (saved) {
            const preferences = JSON.parse(saved);
            if (preferences && typeof preferences === 'object') {
                state.sortPreferences.field = preferences.field || 'closeDate';
                state.sortPreferences.direction = preferences.direction || 'asc';
            }
        }
    } catch (error) {
        console.warn('[State] Failed to load sort preferences from localStorage:', error);
    }
}

/**
 * Save sort preferences to localStorage
 */
export function saveSortPreferences() {
    try {
        const preferences = {
            field: state.sortPreferences.field,
            direction: state.sortPreferences.direction
        };
        localStorage.setItem('opportunityTrackerSortPreferences', JSON.stringify(preferences));
    } catch (error) {
        console.warn('[State] Failed to save sort preferences to localStorage:', error);
    }
}

/**
 * Update sort preferences and save to localStorage
 */
export function updateSortPreferences(field, direction) {
    state.sortPreferences.field = field;
    state.sortPreferences.direction = direction;
    saveSortPreferences();
}