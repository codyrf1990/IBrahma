# Core Application Logic and Workflow

## 1. Initialization Process (`main.js` `DOMContentLoaded` listener)

1.  **Page Load and DOM Ready**:
    *   The `DOMContentLoaded` event triggers the initialization sequence.

2.  **Data Loading (`data.js` `loadInitialData`)**:
    *   Attempts to load auto-saved data (`licenseData`) from `localStorage`.
    *   If data exists, `validateAndImport()` is called to parse, validate, and populate the UI:
        *   Clears the existing UI (`#main-container`).
        *   Restores state variables (`receiptsGoal`, `checkedRows`) from the loaded data.
        *   Iterates through loaded `licenses` (entries):
            *   Determines the month from `closeDate`.
            *   If the month section doesn't exist in the DOM, `createNewMonthSection()` (`domUtils.js`) creates it.
            *   `createRowElement()` (`domUtils.js`) creates the `<tr>` element for the entry, adding data attributes and appropriate classes (e.g., `.checked`).
            *   The row is appended to the correct month's `<tbody>`.
        *   Sorts month sections (`sortMonthSections`) and rows within sections (`sortClientsByDate`) (`domUtils.js`).
    *   If no `localStorage` data exists, the UI remains empty initially, awaiting user input or file load.
    *   The auto-save indicator is created (`createAutoSaveIndicator` in `domUtils.js`).

3.  **Initial UI Calculation and Display (`main.js` `updateUIAndSummaries`)**:
    *   This central function is called *after* `loadInitialData`.
    *   Retrieves current client data from the DOM using `getAllClientsFromDOM()` (`domUtils.js`).
    *   Retrieves the current goal from the input field.
    *   Calls functions in `calculations.js` to compute:
        *   Total confirmed amount (`calculateTotalConfirmed`)
        *   Number of confirmed deals (`countConfirmedDeals`)
        *   Average confirmed deal size (`calculateAverageDealSize`)
        *   Total amount for all entries (`calculateTotalAmountAllEntries`)
        *   Monthly subtotals for confirmed deals (`calculateMonthlySubtotals`)
    *   Calls functions in `domUtils.js` to update the UI display:
        *   Summary statistics (`displaySummaryStatistics`)
        *   Entry summary counts/amounts (`displayEntrySummary`)
        *   Monthly counts and subtotals (`updateMonthSection`)
    *   Updates row visibility based on search criteria if a search is active (`updateRowVisibility`)

4.  **Event Listeners Setup (`main.js` `DOMContentLoaded`)**:
    *   Event delegation is set up on `#main-container` for dynamic row content (checkbox clicks, edit/delete icons, notes icon).
    *   Direct listeners are attached to static elements: Save/Load buttons, Add Renewal button, modal buttons, goal update button, percentage calculator input, search input.
    *   A global `keydown` listener is added for closing modals with the Escape key.
    *   Logic for a notification message (e.g., for successful actions) exists but is currently hidden by default via CSS (`.sync-message { display: none !important; }`).

## 2. Key User Interactions and Workflows (`eventHandlers.js`)

### 2.1 Adding a New Entry (`addLicense`)

1.  User clicks "Add Renewal" -> The `showAddRenewalModal` function (triggered by `eventHandlers.js`) shows the modal for adding a new entry. The form may be pre-populated with sample data for testing/demo purposes via `utils.getSampleFormData()`.
2.  User submits form -> `addLicense()` triggered.
3.  Validates form data.
4.  Determines target month from `closeDate`.
5.  If month section doesn't exist, `createNewMonthSection()` (`domUtils.js`) creates it.
6.  `createRowElement()` (`domUtils.js`) creates the new `<tr>`.
7.  Appends row to the month's `<tbody>`.
8.  Calls `updateUIAndSummaries()` (`main.js`) to recalculate and refresh all displays.
9.  Calls `saveData()` (`data.js`) to auto-save the current state to `localStorage`.
10. Clears form (`clearForm` in `domUtils.js`), hides modal (`hideAddRenewalModal`). The success message display is currently suppressed by CSS.

### 2.2 Editing an Entry (`openEditModal`, `saveEditChanges`)

1.  User clicks edit icon (✏️) -> Event delegation calls `openEditModal()` (`domUtils.js`).
2.  `openEditModal()` reads data from the target row's cells/attributes, populates the edit modal form, sets `state.editingRowId`, and shows the modal.
3.  User submits changes -> `saveEditChanges()` triggered.
4.  Validates form data.
5.  Retrieves the target row using `state.editingRowId`.
6.  Updates the row's data attributes and cell text content.
7.  Checks if the `closeDate` (and thus the month) changed:
    *   If yes, removes the row from the old month's `<tbody>`.
    *   Finds/creates the new target month section (`createNewMonthSection` if needed).
    *   Appends the row to the new month's `<tbody>`.
8.  Calls `updateUIAndSummaries()` (`main.js`) to recalculate and refresh all displays.
9.  Calls `saveData()` (`data.js`) to auto-save.
10. Closes modal (`closeEditModal`), clears `state.editingRowId`. Success message display is suppressed by CSS.

### 2.3 Deleting an Entry (`showConfirmationModal`, `deleteRow`)

1.  User clicks delete icon (✖) -> Event delegation calls `showConfirmationModal()` (`domUtils.js`).
2.  Modal asks for confirmation, providing `deleteRow()` as the confirm callback.
3.  If user confirms -> `deleteRow()` triggered with the row ID.
4.  Row is faded out and removed from the DOM.
5.  Row ID is removed from `state.checkedRows` if present.
6.  Calls `updateUIAndSummaries()` (`main.js`) to recalculate and refresh all displays.
7.  Calls `saveData()` (`data.js`) to auto-save.
8.  Success message display is suppressed by CSS.

### 2.4 Confirming an Entry (Checkbox) (`toggleChecked`)

1.  User clicks checkbox -> Event delegation calls `toggleChecked()`.
2.  Reads the checkbox's `checked` state.
3.  Toggles the `.checked` class on the parent `<tr>`.
4.  Adds/removes the row ID from the `state.checkedRows` array.
5.  Calls `updateUIAndSummaries()` (`main.js`) to recalculate and refresh all displays (progress, totals, etc.).
6.  Calls `saveData()` (`data.js`) to auto-save.

### 2.5 Updating Receipt Goal (`updateReceiptsGoal`)

1.  User changes goal input and clicks "Update Goal".
2.  `updateReceiptsGoal()` validates input and updates `state.receiptsGoal`.
3.  Calls `updateUIAndSummaries()` (`main.js`) to recalculate progress percentage.
4.  Calls `saveData()` (`data.js`) to auto-save the new goal.

### 2.6 Data Import/Export (`handleSaveToFile`, `handleLoadClick`, `handleFileLoad`)

1.  **Save:**
    *   User clicks "Save to File" -> `handleSaveToFile()`.
    *   `getAllClientsFromDOM()` (`domUtils.js`) retrieves current data.
    *   Creates a data object containing `licenses` (from DOM), `checkedRows` (from state), and `receiptsGoal` (from state).
    *   Converts to JSON and triggers a file download.
2.  **Load:**
    *   User clicks "Load from File" -> `handleLoadClick()` triggers the hidden file input.
    *   User selects a JSON file -> `handleFileLoad()` is triggered.
    *   Reads the file content using `FileReader`.
    *   Calls `validateAndImport()` (`data.js`) with the JSON string.
    *   `validateAndImport()` parses, validates, clears the UI, updates `state`, rebuilds the DOM row by row.
    *   Finally, `updateUIAndSummaries()` (`main.js`) is called to calculate and display stats for the newly loaded data.

### 2.7 Searching for Entries (`updateRowVisibility`)

1. User types in the search input field (`#search-input`). The styling for this input and its container (`search-container`) has been adjusted for spacing.
2. Event listener calls `setSearchTerm()` in `state.js` to update the search term in the state.
3. `updateRowVisibility()` in `domUtils.js` is called to filter rows:
   * Each row is checked if its name or opportunity ID contains the search term (case-insensitive).
   * Rows that don't match are hidden with the `display: none` style.
   * Matching rows are shown.
   * Month sections are hidden if all their rows are hidden.
4. The filtering is applied immediately as the user types, providing real-time search results.

### 2.8 Managing Client Notes (`updateClientNote`)

1. User clicks the notes icon (📝) on a row -> Event delegation handles the click.
2. A popup editor appears allowing the user to view and edit notes for the selected client.
3. When the user saves changes, `updateClientNote()` in `state.js` is called to update the notes in the state.
4. The notes are also stored in the DOM as a data attribute on the row.
5. Notes are saved with the client data during auto-save or manual save operations.
6. A hover tooltip shows a preview of notes when hovering over the notes icon.

## 3. Central Update Mechanism (`main.js` `updateUIAndSummaries`)

This function is the core of keeping the UI consistent after any data change. It orchestrates the following steps:

1.  **Get Data Source**: Reads all current client data directly from the DOM (`getAllClientsFromDOM`).
2.  **Calculate**: Calls various functions from `calculations.js` to compute all necessary statistics (totals, counts, averages, monthly subtotals) based on the data read from the DOM and the `state` object (`checkedRows`).
3.  **Update Display**: Calls functions from `domUtils.js` to update all relevant parts of the UI with the newly calculated values (KPIs, progress bar, entry summary, month counts/subtotals).
4.  **Update Search Results**: Applies current search filtering (`updateRowVisibility`).
5.  **Sort**: Ensures rows within months and the month sections themselves are chronologically sorted (`sortClientsByDate`, `sortMonthSections` in `domUtils.js`).

## 4. Data Flow Summary

*   **Source of Truth (for display & interaction)**: The DOM (specifically the `client-row` elements and their attributes/content) is treated as the primary source of truth for calculations during runtime and for direct user interaction.
*   **State Object (`state.js`)**: Holds configuration (`receiptsGoal`), derived state from interactions (`checkedRows`, `editingRowId`), and UI state like `searchTerm`. It's populated on load/import and updated by user actions. Crucially, `checkedRows` is maintained in `state` and used by `calculations.js`.
*   **Auto-Save (`data.js` `saveData`)**: Reads from the DOM (for `licenses` data) and the `state` object (for `checkedRows` and `receiptsGoal`) to persist the current view to `localStorage` periodically or after significant actions.
*   **File Save (`eventHandlers.js` `handleSaveToFile`)**: Reads from the DOM and `state` to create the export JSON.
*   **File Load (`data.js` `validateAndImport`)**: Populates the `state` object and rebuilds the DOM from the imported file data.
*   **UI Updates**: Driven by `updateUIAndSummaries`, which reads from the DOM, incorporates `state` data for calculations, and writes back to specific display elements in the DOM.

## 5. Key Calculations and Displays

1. **Progress Overview**:
   * Shows the number of confirmed entries vs. the goal (`state.receiptsGoal`).
   * Displays a progress bar indicating the percentage of goal achieved.
   * Allows updating the goal value, which updates `state.receiptsGoal`.

2. **Key Stats**:
   * Displays the total confirmed amount (sum of amounts from entries whose IDs are in `state.checkedRows`).
   * Shows the average amount of confirmed entries.

3. **Total Confirmed (Card)**:
   * A dedicated card displays the total confirmed sum, mirroring the value in Key Stats for prominence.

4. **Monthly Subtotals**:
   * Each month section shows a count of confirmed entries and a subtotal amount for those confirmed entries.

5. **Percentage Calculator (Header)**:
   * A utility widget in the header for quick, ad-hoc percentage calculations, independent of the main application data.

6. **Search Functionality (`#search-input`)**:
   * Allows filtering entries by account name or opportunity ID based on `state.searchTerm`.
   * Updates the display in real-time.
   * Hides month sections that don't contain any matching entries.

7. **Client Notes Popup**:
   * Provides a way to add, view, and edit additional information for each entry via a popup editor.
   * Notes are stored with the client data (as a data attribute on the DOM row) and persist across sessions (via save/load and localStorage).