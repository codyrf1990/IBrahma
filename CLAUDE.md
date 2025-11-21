# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iBramah Opportunity Tracker is a single-page web application for managing sales opportunities, license renewals, and tracking progress against sales goals. It's a client-side only application using vanilla JavaScript ES6 modules, HTML5, and CSS3.

## Development Commands

This is a static web application with no build process. Development is straightforward:

- **Run locally**: Open `index.html` in a web browser, or use a local server:
  ```bash
  python3 -m http.server 8000
  # Then navigate to http://localhost:8000
  ```

- **Testing**: No automated test suite exists. Test manually by loading the application and verifying functionality.

- **Linting**: No linter is configured. Follow existing code style and conventions.

## Architecture & Structure

### Data Flow

The application follows a **state-driven architecture** with a central state object:

1. **State (`src/js/state.js`)**: Single source of truth containing:
   - `clients[]` - All renewal/opportunity records
   - `activeYear` - Currently selected year for filtering
   - `receiptsGoal` - User-defined goal for confirmed deals
   - `searchTerm` - Current search filter
   - `checkedRows[]` - IDs of confirmed/checked renewals
   - `sortPreferences` - Field and direction for table sorting

2. **Data persistence (`src/js/data.js`)**: Handles:
   - Auto-save to localStorage every 30 seconds
   - Manual save/load via JSON file export/import
   - Initial data loading on app startup

3. **UI updates (`src/js/main.js`)**: Central `updateUIAndSummaries()` function:
   - Reads from `state.clients` (NOT the DOM)
   - Filters by active year
   - Calculates statistics and monthly subtotals
   - Updates all summary displays and progress bars
   - Renders/updates month sections with filtered data

### Module Organization

- **`main.js`**: Application entry point, initialization, event listener setup, and the central `updateUIAndSummaries()` function
- **`state.js`**: State object and state manipulation functions
- **`data.js`**: Data persistence (localStorage and file I/O)
- **`domUtils.js`**: DOM manipulation utilities, modal management, rendering
- **`eventHandlers.js`**: Event handler functions for user interactions
- **`calculations.js`**: All calculation logic (totals, averages, subtotals)
- **`utils.js`**: General utility functions (date formatting, messages)
- **`yearTabs.js`**: Year tab management and filtering

### Key Design Patterns

**State as Source of Truth**: Always use `state.clients` for data operations, not `getAllClientsFromDOM()`. The DOM is a view layer that reflects state.

**Event Delegation**: Dynamic elements (renewal rows) use event delegation from `#main-container` rather than individual event listeners.

**Modal Pattern**: All forms and confirmations use modal overlays. Key modals:
- `#add-renewal-modal` - Add new renewal
- `#edit-modal` - Edit existing renewal
- `#confirmation-modal` - Generic confirmation dialog
- `#custom-help-modal-overlay` - Help documentation
- `#app-suggestion-modal-overlay` - User feedback

**Year Filtering**: Data is filtered by `state.activeYear` before rendering. The `switchYear()` function handles year changes and triggers full UI refresh.

## Data Model

Each client/renewal record has this structure:
```javascript
{
  id: string,           // Unique identifier (UUID or timestamp-based)
  name: string,         // Account name
  renewalDate: string,  // YYYY-MM-DD format
  sentDate: string,     // YYYY-MM-DD format
  closeDate: string,    // YYYY-MM-DD format (used for monthly grouping)
  amount: number,       // USD amount
  opportunityId: string,// External opportunity ID
  notes: string,        // User notes
  checked: boolean      // Confirmed/completed status
}
```

## Critical Implementation Details

### Adding/Editing Data

When adding or editing renewals:
1. Update `state.clients` array
2. Call `saveData()` to persist to localStorage
3. Call `updateUIAndSummaries()` to refresh the UI
4. Never manipulate the DOM directly without updating state first

### Monthly Grouping

Renewals are grouped by month using the `closeDate` field (YYYY-MM). Month sections have `data-month-year` attributes for filtering and matching.

### Search/Filter Logic

Search filters by account name or opportunity ID (case-insensitive). The `updateRowVisibility()` function in `domUtils.js` handles showing/hiding rows based on `state.searchTerm`.

### Auto-save Behavior

- Auto-saves to localStorage every 30 seconds
- Shows `#auto-save-indicator` briefly after each save
- The `.sync-message` element is currently hidden via CSS (`display: none !important`) per user request

### Commander Card

The "Commander Card" (`#commander-card`) is the main action hub with sections:
- **System**: Save, Load, Add Renewal, Help
- **AI Chats**: Integration points for AI assistance
- **Utilities**: App suggestions and other tools

## Common Gotchas

1. **State vs DOM**: Always update state first, then call `updateUIAndSummaries()`. Don't read from DOM for data operations.

2. **Year filtering**: Remember that `state.activeYear` filters what's displayed. When debugging missing data, check if it's filtered by year.

3. **Date format**: All dates must be in `YYYY-MM-DD` format for proper sorting and grouping.

4. **Notes feature**: Notes are stored in `client.notes` and also as `data-notes` attribute on row elements for the popup editor.

5. **Modal cleanup**: When closing modals, ensure iframe sources are cleared (`about:blank`) to prevent resource leaks.

## File Paths

Important directories:
- `src/js/` - All JavaScript modules
- `src/assets/Images/` - Image assets (logos, icons)
- `docs/` - Context documentation for the project
- `index.html` - Single page application entry point
- `style.css` - All application styles (no preprocessor)
