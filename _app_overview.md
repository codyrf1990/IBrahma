# Application Overview

## Purpose and Current State

The **iBramah Opportunity Tracker** (internally referred to as License Tracker) is a web-based tool designed to track software subscription renewals or sales opportunities. It allows users to manage a list of entries, including details like account name, relevant dates (renewal, sent, close), amount, and an opportunity ID. Users can mark entries as 'confirmed' (checked) and track progress towards a configurable goal.

The application is primarily client-side, built with vanilla JavaScript (ES6 Modules), HTML, and CSS. It does not rely on external UI frameworks. Data management is handled in the browser, with persistence options including file-based JSON export/import and browser `localStorage` for auto-saving session data.

Key capabilities include:
- Adding, editing, and deleting renewal/opportunity entries.
- Marking entries as confirmed via checkboxes.
- Grouping entries by month based on the close date.
- Calculating and displaying summary statistics (total confirmed amount, average amount, entry counts, progress towards goal).
- File-based data persistence (Save to JSON, Load from JSON).
- Auto-saving to `localStorage` for session persistence.
- Responsive design for usability across various screen sizes.
- A quick percentage calculator widget integrated into the header.
- Search functionality to filter entries by name or opportunity ID.
- A notes feature for adding and viewing comments on individual entries.
- A user-configurable goal for tracking progress.
- A notification system for actions like "Renewal added successfully" (currently hidden by default via CSS).

## Project Structure

*   **Root Directory:** `/c%3A/Users/CodyFraser/OneDrive%20-%20SolidCAM/Documents/SFbuddy/Confirmed%20Renewals%20Tracking/License%20Tracker`
*   **Source Directory:** `src/js/` containing JavaScript modules.
*   **UI Files:** `index.html` (main structure), `style.css` (styling).
*   **Assets:** `PICS/` (for images like logos).
*   **Context/Documentation Files:** `_app_overview.md`, `_context_structure.md`, `_context_data.md`, `_context_core_logic.md`, `_context_features.md`, `CHANGELOG.md`, `DEV_NOTES.md`, `UI_Guide.md`, `License-Tracker-Data.md`, `System Prompt.md`.
*   **Other Files/Directories:** `DEBUG DOCS/`, `style.css.bak`.

## Technology Stack

*   **Language:** JavaScript (ES6 Modules)
*   **Frameworks/Libraries:** None (Vanilla JS)
*   **Styling:** CSS3
*   **Build Tool:** None identified (direct browser execution)
*   **Data Storage:** Browser `localStorage` (for auto-save) and file-based JSON export/import.

## Application Entry Point & Core Modules

*   **Entry Point:** `index.html` loads `src/js/main.js` as a module.
*   **Core Modules (`src/js/`)** (summary, details in `_context_structure.md` and `_context_core_logic.md`):
    *   `main.js`: Initializes the application, sets up primary event listeners, and orchestrates UI updates.
    *   `state.js`: Manages global application state (e.g., `checkedRows`, `receiptsGoal`).
    *   `data.js`: Handles data loading, saving (localStorage and file operations), and validation.
    *   `domUtils.js`: Provides utility functions for DOM manipulation, UI updates, and managing UI components like modals and search.
    *   `eventHandlers.js`: Contains logic for user interactions (add, edit, delete, checkbox toggles, goal updates, etc.).
    *   `utils.js`: General utility functions (date/currency formatting, ID generation).
    *   `calculations.js`: Pure functions for calculating summary statistics from the data.

## Context Files Summary

*   **`_app_overview.md`**: This file. Summarizes the application's purpose, state, stack, and module structure.
*   **`_context_structure.md`**: Details the file/folder structure, HTML layout, and JS module responsibilities.
*   **`_context_data.md`**: Describes data models (runtime and persistent JSON), `localStorage` usage, and data flow.
*   **`_context_core_logic.md`**: Explains initialization, core workflows for user actions, data persistence, and UI update logic.
*   **`_context_features.md`**: Lists key features, their status, and relevant user stories.
*   **`CHANGELOG.md`**: Tracks notable changes and updates.
*   **`DEV_NOTES.md`**: Contains development-specific notes, observations, and potential future improvements.
*   **`UI_Guide.md`**: Detailed guide for the user interface components, layout, and usage.
*   **`License-Tracker-Data.md`**: (Potentially redundant or more specific version of `_context_data.md`) - describes data structures.
*   **`System Prompt.md`**: Contains the system prompt for the AI assistant.