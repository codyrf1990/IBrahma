# Core Logic and Control Flow (iBramah - Opportunity Tracker)

This document outlines the main business logic, algorithms, and control flow of the iBramah Opportunity Tracker application, reflecting the modular JavaScript and UI as of 2025-05-14.

## 1. Application Initialization
- On DOMContentLoaded, the app loads data from localStorage (if available) or initializes with default state.
- UI is dynamically rendered: month sections and renewals are generated from state.
- Summary statistics (totals, KPIs, progress) are calculated and displayed.
- Event listeners are attached for all interactive elements: Commander Card actions, modal buttons, search, goal updating, calculator, and dynamic row actions.

## 2. Core Workflows

### Adding a New Renewal
- User clicks "Add Renewal" (Commander Card).
- Modal opens; user enters details.
- On submit: data is validated, renewal is added to state, UI updates, summaries recalc, modal closes, success message, auto-save triggers.

### Editing a Renewal
- User clicks "Edit" on a renewal row.
- Edit modal opens, pre-filled.
- On save: data validated, state updated, UI row updated, summaries recalc, modal closes, success message, auto-save.

### Deleting a Renewal
- User clicks "Delete" on a renewal row.
- Confirmation modal opens.
- On confirm: renewal removed from state, UI updates, summaries recalc, modal closes, success message, auto-save.

### Saving & Loading Data
- **Save to File:** User triggers save; state is stringified and downloaded as JSON.
- **Load from File:** User selects file; JSON is parsed, validated, replaces state, UI re-renders, summaries recalc.
- **Auto-Save:** Any data mutation triggers localStorage save and updates the indicator.

### Progress & KPI Tracking
- Progress bar and stats update in real time as renewals are confirmed or goal is changed.
- User can update the goal; state and UI reflect changes instantly.

### Utilities & AI Integration
- Commander Card provides quick access to utilities (calculator, notes, email templates) and AI chat (Std/Pro).
- "SolidCAM Chat Pro" opens in a draggable sidebar; settings and API key management handled via modal.

### Search & Filtering
- Search input filters renewals in real time by account name or opportunity ID.
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

This document provides a conceptual overview of the core logic. The actual implementation details reside in `src/js/main.js` and its potential helper modules. This summary is current as of 2025-05-14.