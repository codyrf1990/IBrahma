# Core Logic and Control Flow (iBramah - Opportunity Tracker)

This document outlines the main business logic, algorithms, and control flow of the iBramah Opportunity Tracker application, primarily inferred from `index.html` and the expected behavior of `src/js/main.js`.

## 1. Application Initialization (`main.js` - `DOMContentLoaded`)

*   **Load Initial Data:** On page load, the application likely attempts to load existing data. This could be from `localStorage` (for auto-saved sessions) or a default state if no saved data is found.
*   **Render UI:** Dynamically generates month sections and populates them with renewal entries based on the loaded data.
*   **Calculate and Display Summaries:** Computes and displays initial summary statistics (e.g., total confirmed, progress overview, KPIs).
*   **Attach Event Listeners:** Sets up event listeners for all interactive elements:
    *   Buttons in the Commander Card (Save, Load, Add, Settings, Profile, Help, AI Chats, Utilities).
    *   Buttons in the Add New Renewal modal (Add, Cancel).
    *   Buttons in the Edit Renewal modal (Save, Cancel, Close).
    *   Search input field.
    *   Update Goal button for receipts.
    *   Controls for the Quick Percentage Calculator.
    *   Dynamic elements like delete/edit buttons on renewal rows (likely using event delegation).
    *   Close buttons for modals and sidebars.
    *   Drag handle for the Chat Pro sidebar.

## 2. Core Workflows

### 2.1. Adding a New Renewal

1.  **Trigger:** User clicks the "Add Renewal" icon (`#icon-add-renewal`) in the Commander Card.
2.  **Action:** The "Add New Renewal" modal (`#add-renewal-modal`) is displayed.
3.  **User Input:** User fills in the form fields (Account Name, Renewal Date, Sent Date, Close Date, Amount, Opportunity ID).
4.  **Submission:** User clicks the "Add Renewal" button within the modal.
5.  **Logic (`main.js`):
    *   Retrieves and validates form data.
    *   Creates a new renewal object.
    *   Adds the new object to the internal data structure (e.g., an array of renewals).
    *   Updates the UI: Adds a new row to the appropriate month section in `#main-container`. If a new month section is needed, it's created.
    *   Recalculates and updates all summary displays (Progress Overview, KPI Stats, Total Confirmed).
    *   Hides the modal.
    *   Displays a success message.
    *   Triggers auto-save (if implemented).

### 2.2. Editing an Existing Renewal

1.  **Trigger:** User clicks an "Edit" button associated with a specific renewal entry (dynamically generated).
2.  **Action:** The "Edit License" modal (`#edit-modal`) is displayed, pre-filled with the data of the selected renewal.
The `edit-row-id` hidden input is populated.
3.  **User Input:** User modifies the form fields.
4.  **Submission:** User clicks the "Save Changes" button within the modal.
5.  **Logic (`main.js`):
    *   Retrieves the `edit-row-id` and updated form data.
    *   Validates the data.
    *   Finds the corresponding renewal object in the internal data structure and updates it.
    *   Updates the specific row in the UI in `#main-container`.
    *   Recalculates and updates all summary displays.
    *   Hides the modal.
    *   Displays a success message.
    *   Triggers auto-save.

### 2.3. Deleting a Renewal

1.  **Trigger:** User clicks a "Delete" button associated with a specific renewal entry (dynamically generated).
2.  **Action:** A confirmation modal (`#confirmation-modal`) is displayed.
3.  **User Confirmation:** User clicks "Confirm".
4.  **Logic (`main.js`):
    *   Removes the renewal object from the internal data structure.
    *   Removes the corresponding row from the UI in `#main-container`.
    *   If a month section becomes empty, it might be removed.
    *   Recalculates and updates all summary displays.
    *   Hides the confirmation modal.
    *   Displays a success message.
    *   Triggers auto-save.

### 2.4. Saving Data to File

1.  **Trigger:** User clicks the "Save to File" icon (`#icon-save-to-file`) in the Commander Card.
2.  **Logic (`main.js`):
    *   Retrieves the current renewal data from the internal data structure.
    *   Converts the data to a JSON string.
    *   Prompts the user to download the JSON file (e.g., using a dynamically created `<a>` tag with `download` attribute).
    *   Displays a success message.

### 2.5. Loading Data from File

1.  **Trigger:** User clicks the "Load from File" icon (`#icon-load-from-file`) in the Commander Card.
2.  **Action:** The hidden file input (`#file-input`) is triggered.
3.  **User Selection:** User selects a JSON file.
4.  **Logic (`main.js`):
    *   Reads the content of the selected file.
    *   Parses the JSON data.
    *   Validates the data structure.
    *   Replaces the current internal data structure with the loaded data.
    *   Re-renders the entire UI in `#main-container` with the new data.
    *   Recalculates and updates all summary displays.
    *   Displays a success/error message via `#sync-message`.
    *   Triggers auto-save with the new data.

### 2.6. Searching Renewals

1.  **Trigger:** User types into the search input (`#search-input`).
2.  **Logic (`main.js` - likely on `input` event):
    *   Gets the search term.
    *   Iterates through all renewal entries.
    *   Compares the search term (case-insensitive) against Account Name and Opportunity ID of each entry.
    *   Shows/hides renewal rows in the UI based on the match.
    *   May update summary statistics if they are context-dependent on visible items (though typically summaries reflect all data).

### 2.7. Updating Receipts Goal

1.  **Trigger:** User changes the value in `#receipts-goal-input` and clicks `#update-goal-btn`.
2.  **Logic (`main.js`):
    *   Reads the new goal value.
    *   Validates it (e.g., must be a positive number).
    *   Updates the internal state for the goal.
    *   Re-renders the `#progress-overview` section (text and progress bar) with the new goal.
    *   Triggers auto-save.

### 2.8. Quick Percentage Calculator

1.  **Trigger:** User enters an amount in `#calculator-amount`.
2.  **Logic (`main.js` - likely on `input` event):
    *   Reads the amount.
    *   Calculates 5%, 10%, and 15% of the amount.
    *   Displays these results in `#result-container-5`, `#result-container-10`, `#result-container-15`.

### 2.9. Interacting with Commander Card Utilities

*   **AI Chats (`#btn-chat-std`, `#btn-chat-pro`):**
    *   `#btn-chat-std`: Likely opens a new tab/window or a generic modal pointing to a URL for "SolidCAM Chat Std".
    *   `#btn-chat-pro`: Shows and loads content into the `#chatProSidebar` iframe (`#chatProSidebarIframe`). A close button (`#closeChatProSidebarBtn`) and drag handle (`#chatProSidebarDragHandle`) manage its visibility and position.
*   **Utilities (Email, Calc, Notes - `#icon-email-templates`, `#icon-adv-calculator`, `#icon-scratchpad`):**
    *   Likely open the `#generic-content-modal` and load relevant content/tools into its iframe (`#generic-modal-iframe`). The modal has a title (`#generic-modal-title`) and a close button (`#generic-modal-close-btn`).
*   **System (Settings, Profile, Help - `#icon-system-settings`, `#icon-user-profile`, `#icon-system-help`):**
    *   These might also use the `#generic-content-modal` or trigger other specific UI changes/modals not fully detailed in `index.html` structure alone.

## 3. Data Flow & State Management (High-Level)

*   **Primary Data Store:** An internal JavaScript array/object holding all renewal entries.
*   **UI Rendering:** `main.js` reads from this internal store to generate and update the HTML in `#main-container` and summary sections.
*   **User Interactions:** Modify the internal data store.
*   **Synchronization:** After modification, UI is re-rendered/updated, and summaries are recalculated.
*   **Persistence:**
    *   **Auto-Save:** Changes to the internal data store (and possibly settings like `receiptsGoal`) are periodically or immediately saved to `localStorage`.
    *   **Manual Save/Load:** User-initiated saving to/loading from JSON files directly interacts with the internal data store, overwriting or populating it, followed by a full UI refresh.

## 4. Key Algorithms (Conceptual)

*   **Monthly Grouping:** When adding/loading data, renewals are grouped by their "Close Date" month and year to create/populate month sections in the UI.
*   **Summary Calculations:** Summing amounts of confirmed renewals, counting entries, calculating averages based on the current dataset.
*   **Search Filtering:** String matching (likely case-insensitive `includes()`) on specified fields.
*   **Sorting:** Renewal entries within month sections are likely sorted by date (e.g., close date). Month sections themselves are sorted chronologically.

## 5. Error Handling and User Feedback

*   **Validation:** Input validation for forms (add/edit renewal, goal input, calculator amount).
*   **User Messages:** Success/error/confirmation messages are displayed (e.g., via `#sync-message`, generic modal, or a dedicated notification system not explicitly detailed but common).
*   **Modal States:** Modals (`#add-renewal-modal`, `#edit-modal`, `#confirmation-modal`, `#generic-content-modal`) manage distinct phases of user interaction.
*   **Visual Indicators:** `#auto-save-indicator`, progress bars, KPI value updates (`Calculating...` to actual values).

This document provides a conceptual overview of the core logic. The actual implementation details reside in `src/js/main.js` and its potential helper modules.