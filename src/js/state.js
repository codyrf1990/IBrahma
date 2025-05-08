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
    searchTerm: '' // Added placeholder based on plan
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
        searchTerm: state.searchTerm
    };
    console.log("[State] getStateForSave called. Returning state:", stateToSave);
    return stateToSave;
}

/**
 * Replaces the current application state with data loaded from a file.
 * NOTE: This updates the state object, but the UI refresh triggered afterwards
 * MUST use state.clients instead of getAllClientsFromDOM() to reflect these changes.
 * @param {object} newState - The state object loaded from the file.
 */
export function replaceState(newState) {
    console.log("[State] replaceState called with:", newState);
    // Basic validation
    if (newState && typeof newState === 'object') {
        // Replace state properties, providing defaults if missing
        // This updates the state object, which *should* become the source of truth
        state.clients = (Array.isArray(newState.clients)) ? newState.clients.map(client => ({ ...client, notes: client.notes || '' })) : []; 
        state.receiptsGoal = (typeof newState.receiptsGoal === 'number') ? newState.receiptsGoal : 55; // Default goal
        state.checkedRows = Array.isArray(newState.checkedRows) ? newState.checkedRows : [];
        state.searchTerm = (typeof newState.searchTerm === 'string') ? newState.searchTerm : '';
        // Reset transient state
        state.editingRowId = null;

        console.log('[State] State object replaced with loaded data.', state);
    } else {
        console.error('[State] Invalid data provided to replaceState.');
    }
}

// Add a setter for the search term
export function setSearchTerm(term) {
  state.searchTerm = term;
  console.log('[State] Search term set to:', term);
}

/**
 * Update the notes for a client by clientId
 */
export function updateClientNote(clientId, newNoteText) {
    const client = state.clients.find(c => c.id === clientId);
    if (client) {
        client.notes = newNoteText;
        console.log(`[State] Updated note for client ${clientId}:`, newNoteText);
    } else {
        console.warn(`[State] Client not found for note update: ${clientId}`);
    }
}