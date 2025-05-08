# Project Structure and Module Overview

## File Structure

```
.
├── index.html            # Main HTML file for the application UI
├── style.css             # CSS styles for the application
├── style.css.bak         # Backup of CSS styles
├── src/
│   └── js/               # Directory for JavaScript modules
│       ├── main.js       # Entry point, initialization, event delegation, UI update coordinator
│       ├── state.js      # Global application state (checkedRows, goal, transient state)
│       ├── data.js       # Data persistence (localStorage auto-save, file import/export), validation
│       ├── domUtils.js   # DOM manipulation, UI updates (creating/updating elements, modals)
│       ├── eventHandlers.js # Specific event handler functions (add, delete, edit, toggle, file ops)
│       ├── utils.js      # Utility functions (formatting, parsing, ID generation, sample data)
│       └── calculations.js # Pure calculation functions (totals, averages, counts, monthly subtotals)
├── CHANGELOG.md          # Log of notable changes
├── DEV_NOTES.md          # Development notes and observations
├── License-Tracker-Data.md # Detailed documentation about data structure
├── UI_Guide.md           # UI guide document for users/developers
├── System Prompt.md      # System prompt for AI assistant interaction
├── _app_overview.md      # High-level application summary
├── _context_core_logic.md # Core logic and workflow documentation
├── _context_data.md       # Data structure and persistence documentation
├── _context_features.md   # Feature list and responsive design details
├── _context_structure.md  # This file: Project structure and module responsibilities
├── DEBUG DOCS/           # Directory for debugging documents or developer aids
└── PICS/                 # Directory for image assets (e.g., logo)
```

## Key Files and Modules

*   **`index.html`**: Defines the user interface structure, including:
    *   Header section (`.main-header`): Title group (`.title-group`), Logo (`.header-logo`), Quick Percentage Calculator (`.percentage-calculator`).
    *   Header actions row (`.header-actions`): Save to File, Load from File, Add Renewal buttons.
    *   Hidden file input (`#file-input`) and a sync message area (`#sync-message`, currently styled `display: none`).
    *   "Add New Renewal" modal (`#add-renewal-modal`).
    *   Totals summary area (`.totals-summary`) containing:
        *   "Progress Overview" box (`#progress-overview`) with count, goal, progress bar.
        *   "Key Stats" box (`#kpi-stats-section`) with total/average confirmed amounts.
        *   "Total Confirmed" card (`#total-confirmed-whole-card`).
    *   Search bar container (`.search-container`) with input (`#search-input`) for filtering entries.
    *   Main content area (`#main-container`) dynamically populated with month sections.
    *   Edit Modal (`#edit-modal`).
    *   Confirmation Modal (`#confirmation-modal`).
    *   Auto-save indicator (`#auto-save-indicator`).
    *   Logo hover message window (`#logoHoverMessageWindow`).
    *   Links `style.css` and the main JavaScript module (`src/js/main.js`).

*   **`style.css`**: Contains all CSS rules for styling:
    *   Layout (flexbox, grid), responsiveness (media queries at various breakpoints).
    *   Component styles (buttons, modals, tables, forms, summary boxes, search bar).
    *   Visual feedback (highlights, transitions).
    *   CSS variables for theming/consistency.
    *   Table scrolling with visual indicators.
    *   Styles for the hidden `.sync-message` notification.
    *   Styles for the logo hover message window.

*   **`src/js/main.js`**:
    *   Entry point (`DOMContentLoaded` listener).
    *   Imports functions from all other modules.
    *   Initializes the app: calls `loadInitialData`, `updateUIAndSummaries`.
    *   Sets up event listeners (delegation on `#main-container`, direct listeners for header/modal buttons, search input, etc.).
    *   Contains the central `updateUIAndSummaries()` function which orchestrates reading DOM data, calculating stats, and updating UI display elements.
    *   Manages the logo hover informational pop-up.

*   **`src/js/state.js`**:
    *   Exports the global `state` object holding runtime state:
        *   `receiptsGoal`: User-defined target.
        *   `checkedRows`: Array of IDs for confirmed rows.
        *   `editingRowId`: Transient ID of the row being edited.
        *   `lastSaved`: Timestamp of last auto-save.
        *   `searchTerm`: Current search term for filtering entries.
    *   Provides `getStateForSave()` and `replaceState()` (used during file import).
    *   Provides `setSearchTerm()` for updating the search state.
    *   Provides `updateClientNote()` for managing notes associated with entries.

*   **`src/js/data.js`**:
    *   Handles data persistence and validation.
    *   `saveData()`: Reads data from DOM (`getAllClientsFromDOM`) and `state` (`checkedRows`, `receiptsGoal`), saves JSON to `localStorage` (auto-save).
    *   `loadInitialData()`: Loads JSON from `localStorage` on startup, calls `validateAndImport`.
    *   `validateAndImport()`: Parses JSON (from file or `localStorage`), validates structure, clears UI, updates `state`, rebuilds DOM by calling `createNewMonthSection` and `createRowElement` (from `domUtils.js`).

*   **`src/js/calculations.js`**:
    *   Contains pure functions for calculations based on client data arrays and `state.checkedRows`.
    *   `calculateTotalConfirmed()`, `countConfirmedDeals()`, `calculateAverageDealSize()`, `calculateMonthlySubtotals()`, `calculateTotalAmountAllEntries()`, `calculateTotalEntries()`.
    *   Helper functions like `formatCurrency()` and `isConfirmed()`.

*   **`src/js/domUtils.js`**: DOM manipulation and UI update functions.
    *   `createRowElement()`: Creates a `<tr>` for an entry with action buttons.
    *   `createNewMonthSection()`: Creates month section structure.
    *   `updateMonthSection()`: Updates count/subtotal display for a month.
    *   `getAllClientsFromDOM()`: **Crucial function** - Reads all client/entry data from the current DOM state into an array of objects.
    *   `displaySummaryStatistics()`: Updates the dashboard KPI displays.
    *   `displayEntrySummary()`: Updates the total entry counts/amounts display.
    *   `sortClientsByDate()`, `sortMonthSections()`: Sorts rows and sections in the DOM.
    *   `updateRowVisibility()`: Filters rows based on `state.searchTerm`.
    *   Modal handling: `openEditModal()`, `closeEditModal()`, `showConfirmationModal()`, `hideConfirmationModal()`, `showAddRenewalModal()`, `hideAddRenewalModal()`.
    *   `showAddRenewalModal()`: Can pre-populate the Add Entry form with random data from `utils.getSampleFormData()`.
    *   Other UI helpers: `clearForm()`, `createAutoSaveIndicator()`.
    *   Manages the notes popup editor (`showNotesPopup`, `hideNotesPopup`).

*   **`src/js/eventHandlers.js`**:
    *   Contains handler functions triggered by user interactions.
    *   `addLicense()`, `deleteRow()`, `saveEditChanges()`, `toggleChecked()`, `updateReceiptsGoal()`.
    *   File operations: `handleSaveToFile()` (creates JSON from DOM/state and downloads), `handleLoadClick()` (triggers file input), `handleFileLoad()` (reads file, passes content to `validateAndImport`).
    *   Percentage Calculator input handling: `updatePercentageCalculator()`.
    *   Notes icon click handler: `handleNotesIconClick` (which calls `domUtils.showNotesPopup`).
    *   Delegates DOM updates to `domUtils.js` and triggers recalculations via `updateUIAndSummaries()`.
    *   Calls `saveData()` for auto-saving after actions.

*   **`src/js/utils.js`**: Utility functions.
    *   `showMessage()`: (Potentially for the now-hidden `.sync-message`) Displays temporary feedback messages.
    *   `generateId()`: Creates unique IDs.
    *   `formatDate()`, `parseDate()`: Date formatting/parsing.
    *   `getMonthFromDate()`: Extracts month name from date.
    *   `parseAmount()`: Parses currency strings.
    *   `getSampleFormData()`: Generates random, plausible data for an entry, used for testing/demo in `showAddRenewalModal`.
