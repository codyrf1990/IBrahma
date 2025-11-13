# Data Models, Schemas, and Flow (iBramah - Opportunity Tracker)

This document describes the data models, schemas for persistent storage, and the overall data flow within the iBramah Opportunity Tracker application as of 2025-05-14.

## 1. Core Data Model: Renewal/Opportunity Entry

Each renewal or opportunity is represented as an object with the following properties (as used in state.js, data.js, eventHandlers.js):

*   `id`: (String) Unique identifier (auto-generated, e.g., UUID or timestamp-based).
*   `name`: (String) Account or client name.
*   `renewalDate`: (String) Renewal date (YYYY-MM-DD).
*   `sentDate`: (String) Date renewal was sent (YYYY-MM-DD).
*   `closeDate`: (String) Close date (YYYY-MM-DD). Used for grouping by month.
*   `amount`: (Number) Value of the opportunity/renewal (USD).
*   `opportunityId`: (String) Opportunity ID (e.g., from CRM).
*   `isChecked`: (Boolean) Whether the renewal is confirmed (used for KPIs/progress).
*   `notes`: (String) Optional notes/comments.

**Example Renewal Object:**
```json
{
  "id": "unique-entry-id-123",
  "name": "Acme Corp",
  "renewalDate": "2024-09-15",
  "sentDate": "2024-07-01",
  "closeDate": "2024-08-30",
  "amount": 1250.75,
  "opportunityId": "OPP-00123",
  "isChecked": false,
  "notes": "Follow up scheduled for Aug 15th."
}
```

## 2. Application State

The application state is managed in `state.js` and used throughout the modular JS files. Key state fields include:

*   `clients`: (Array) List of all renewal/opportunity objects.
*   `receiptsGoal`: (Number) User-defined goal for confirmed receipts.
*   `checkedRows`: (Array) IDs of renewals marked as confirmed.
*   `searchTerm`: (String) Current search/filter value.
*   `editingRowId`: (String|null) ID of the entry being edited (transient).
*   `lastSaved`: (Date|null) Timestamp of last save (not persisted to file).

## 3. Persistent Storage

### JSON File (Manual Save/Load)
- **Schema:** When saving, the app exports a JSON object with the current state (array of renewal objects, receiptsGoal, checkedRows, searchTerm).
    ```json
    {
      "clients": [
        // ... array of renewal objects ...
      ],
      "receiptsGoal": 55,
      "checkedRows": ["id1", "id2"],
      "searchTerm": "Acme"
    }
    ```
- **Save:** User clicks "Save to File"; state is stringified and downloaded as JSON.
- **Load:** User clicks "Load from File"; JSON is parsed, validated, and replaces state. UI is updated.

### localStorage (Auto-Save)
- **Purpose:** Auto-saves state after any change (add/edit/delete/update goal/check).
- **Data Stored:** Stringified state object (same schema as above).
- **Triggers:** After any data mutation, state is saved to localStorage. On app load, state is restored from localStorage if present.

## 4. Data Flow

1. **Initialization:**
    - App loads data from localStorage (if available); else, starts with default state.
    - UI is rendered from state.
2. **User Actions (Add/Edit/Delete):**
    - User interacts with modals/forms.
    - Data is validated and state is updated; UI re-renders; auto-save triggers.
3. **Save/Load:**
    - Manual save/load uses JSON file with full state.
        *   The UI is updated to reflect the change (new row added, existing row modified/removed, month sections potentially updated).
        *   Summary statistics (KPIs, progress) are recalculated and re-displayed.
        *   The new state (updated `renewals` array) is saved to `localStorage` (auto-save).

3.  **User Updates Goal:**
    *   User changes `#receipts-goal-input` and clicks "Update Goal".
    *   The internal `receiptsGoal` state variable is updated.
    *   The progress overview UI elements are updated.
    *   The new `receiptsGoal` is saved to `localStorage`.

4.  **User Saves to File:**
    *   The current internal `renewals` array and `receiptsGoal` are packaged into a JSON structure.
    *   This JSON is offered to the user as a downloadable file.

5.  **User Loads from File:**
    *   User selects a JSON file.
    *   The file is read and parsed.
    *   Data (e.g., `renewals` array, `receiptsGoal`) from the file overwrites the current internal application state.
    *   The entire UI for renewal entries and summaries is re-rendered based on this new state.
    *   The newly loaded state is saved to `localStorage` (to ensure consistency if the user refreshes).

6.  **Search:**
    *   User types in `#search-input`.
    *   The internal `searchTerm` state is updated.
    *   The displayed renewal rows are filtered based on the `searchTerm` by comparing against `accountName` and `opportunityId`. This is a UI-only change and does not modify the underlying `renewals` array.

## 5. Data Displayed in UI Sections

*   **`#main-container`:** Displays individual renewal entries, dynamically organized into month sections based on `closeDate`.
*   **`#progress-overview`:**
    *   `#receipts-info`: Text like "X of Y Receipts Received" (derived from count of `isChecked=true` items vs. `receiptsGoal`).
    *   `#receipts-progress`: Progress bar fill width (percentage of goal achieved).
    *   `#receipts-percentage`: Text percentage of goal.
    *   `#receipts-goal-input`: Editable `receiptsGoal` value.
*   **`#kpi-stats-section`:**
    *   `#kpi-total-confirmed`: Sum of `amount` for entries where `isChecked=true`.
    *   `#kpi-avg-amount`: Average `amount` for entries where `isChecked=true`.
*   **`#total-confirmed-whole-card` (`#total-confirmed-whole-value`):** Total sum of `amount` for entries where `isChecked=true` (likely mirrors `#kpi-total-confirmed`).
*   **Quick % Calculator (`.percentage-calculator`):** Ad-hoc calculations, data is transient and local to the calculator, not part of the main app data model.

This outlines the expected data structures and flow. The actual implementation in `src/js/main.js` will contain the definitive logic. This summary is current as of 2025-05-14.