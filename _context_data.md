# Application Data Structures

## 1. Primary Data Persistence: JSON Files

The application primarily uses file-based import/export for persistent data storage. Users can save their current tracker state to a JSON file and load it back later.

*   **Format**: JSON
*   **Structure**: An object containing the following keys:

    ```json
    {
      "clients": [
        {
          "id": "row_1678886400000_abcdef123", // Unique string ID for the row/entry
          "name": "Example Client Inc.",        // String: Account Name
          "closeDate": "2024-03-15",           // String: Close Date (YYYY-MM-DD)
          "renewalDate": "2025-03-15",         // String: Renewal Date (YYYY-MM-DD)
          "sentDate": "2024-02-10",            // String: Sent Date (YYYY-MM-DD)
          "amount": 12345.67,                  // Number: Entry Amount (USD)
          "opportunityId": "OPP-00123",        // String: Opportunity ID
          "isChecked": true,                   // Boolean: Indicates if the row is checked/confirmed
          "notes": "Client requested early renewal." // String: Optional notes about the client/entry
        }
        // ... more client objects
      ],
      "checkedRows": [                        // Array of strings: IDs of rows currently checked
        "row_1678886400000_abcdef123"
        // ... more checked row IDs
      ],
      "receiptsGoal": 55                      // Number: User-defined goal for confirmed entries
    }
    ```
*   **Generation**: Created by `handleSaveToFile` (`eventHandlers.js`), which gathers data using `getAllClientsFromDOM` (from `domUtils.js`) and accesses `state.checkedRows` and `state.receiptsGoal`.
*   **Loading**: Handled by `handleFileLoad` (`eventHandlers.js`) and processed by `validateAndImport` (`data.js`), which updates the `state` object and rebuilds the DOM.

## 2. Runtime Data Storage: DOM

During application use, the primary source of truth for calculations and display is the HTML DOM itself.

*   **Entry Data**: Stored within `<tr>` elements (`.client-row`) inside monthly table bodies (`<tbody id="{month}-clients-body">`).
    *   **Text Content**: Values like Account Name, Amount, Opportunity ID, and formatted dates are stored directly in `<td>` elements with specific classes (e.g., `.td-name`, `.td-amount`).
    *   **Data Attributes**: Key information, especially dates in standard `YYYY-MM-DD` format, the Opportunity ID, and notes, are stored in `data-*` attributes on the `<tr>` element (e.g., `data-close-date`, `data-opportunity-id`, `data-notes`) to facilitate reliable retrieval and sorting.
    *   **Confirmation Status**: Represented by the presence of the `.checked` class on the `<tr>` element and the `checked` property of the checkbox input within that row. The `state.checkedRows` array also tracks IDs of confirmed rows.
    *   **Unique ID**: Each `<tr>` has a unique `id` attribute (e.g., `id="row_123..."`).
*   **Structure**: Entries are grouped into month sections (`<div class="month-section">`), each containing a header, table, and subtotal display.
*   **Retrieval**: The `getAllClientsFromDOM()` function in `domUtils.js` iterates through all `.client-row` elements, reads their cell content and `data-*` attributes, parses the values (including deriving `isChecked` from the checkbox state), and returns an array of client objects mirroring the structure used in the JSON save file.

## 3. Session Persistence: Local Storage (`localStorage`)

`localStorage` is used for **auto-saving** the current state, providing session persistence if the user accidentally closes the browser or navigates away without explicitly saving to a file.

*   **Key**: `licenseData` (or a similar key, e.g., `renewalTrackerData`)
*   **Value**: A JSON string with the same structure as the file export (clients array, checkedRows array, receiptsGoal).
*   **Writing**: Updated by the `saveData()` function (`data.js`), which is called after significant actions (add, edit, delete, check/uncheck, goal update).
*   **Reading**: Loaded by `loadInitialData()` (`data.js`) when the application starts. If the key exists in `localStorage`, its data is used to initialize the application state and UI.

## 4. Application Runtime State (`state.js`)

A global `state` object holds runtime configuration and state information that isn't directly part of the entry data itself but is needed for application logic.

```javascript
export const state = {
    // clients: [], // Client data is primarily read from the DOM for most operations.
    currentView: 'all',      // String: Placeholder, not fully implemented for distinct views.
    totals: {},              // Object: Not used for primary calculation; summary totals derived dynamically.
    receiptsGoal: 55,        // Number: Target number of confirmed entries (synced with storage/files).
    checkedRows: [],         // Array: Stores the IDs (strings) of checked rows (synced with storage/files).
    lastSaved: null,         // Date Object: Timestamp of the last successful auto-save (runtime only).
    editingRowId: null,      // String | null: ID of the row currently being edited (runtime only).
    searchTerm: ''           // String: Current search term for filtering entries.
};
```

Key points:
*   `receiptsGoal` and `checkedRows` are critical for tracking progress and are loaded from/saved to persistent storage.
*   `editingRowId` and `lastSaved` are transient runtime states, not saved in JSON files.
*   `searchTerm` is a runtime state for UI filtering.
*   The main list of `clients` or entries is primarily derived from the DOM (`getAllClientsFromDOM`) for calculations and saving, rather than being constantly mirrored in this state object.

## 5. Data Fields (Logical)

These represent the core pieces of information tracked for each entry:

*   **ID**: (string, unique) `id` - e.g., `row_timestamp_randomSuffix`
*   **Account Name**: (string) `name`
*   **Renewal Date**: (date string - YYYY-MM-DD) `renewalDate`
*   **Sent Date**: (date string - YYYY-MM-DD) `sentDate`
*   **Close Date**: (date string - YYYY-MM-DD) `closeDate` (Crucial for monthly grouping)
*   **Amount USD**: (number) `amount`
*   **Opportunity ID**: (string) `opportunityId`
*   **Confirmation Status**: (boolean) `isChecked` - Derived from checkbox state in DOM, reflected in `state.checkedRows` and persisted.
*   **Notes**: (string) `notes` - Optional text notes, stored as a data attribute and in persisted data.

## 6. Data Flow Summary

1.  **Load/Import**: JSON (from file or `localStorage`) -> `validateAndImport()` -> Updates `state` (`checkedRows`, `receiptsGoal`) & Rebuilds DOM from `clients` array in JSON.
2.  **Runtime Calculation**: `updateUIAndSummaries()` -> `getAllClientsFromDOM()` -> Reads DOM (deriving `isChecked` for each entry) & uses `state.checkedRows` -> `calculations.js` -> Calculates Stats.
3.  **Display Update**: `updateUIAndSummaries()` -> `domUtils.js` -> Updates DOM display elements (KPIs, progress, counts, subtotals).
4.  **User Action (e.g., Add, Edit, Delete, Check)**: Modifies DOM directly and/or updates `state.checkedRows` -> Calls `updateUIAndSummaries()` -> Calls `saveData()`.
5.  **Search Filtering**: User types in search input -> Updates `state.searchTerm` -> `updateRowVisibility()` (in `domUtils.js`) -> Shows/hides DOM rows.
6.  **Client Notes**: User edits notes -> `updateClientNote()` (in `eventHandlers.js` or similar) -> Updates DOM `data-notes` attribute and potentially calls `saveData()`.
7.  **Auto-Save (`saveData` in `data.js`)**: `getAllClientsFromDOM()` -> `state.checkedRows`, `state.receiptsGoal` -> Forms data object -> Writes JSON to `localStorage`.
8.  **File Save (`handleSaveToFile` in `eventHandlers.js`)**: `getAllClientsFromDOM()` -> `state.checkedRows`, `state.receiptsGoal` -> Forms data object -> Generates JSON file download.