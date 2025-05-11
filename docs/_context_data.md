# Data Models, Schemas, and Flow (iBramah - Opportunity Tracker)

This document describes the data models, schemas for persistent storage, and the overall data flow within the iBramah Opportunity Tracker application, based on `index.html` and typical web application practices.

## 1. Core Data Model: Renewal/Opportunity Entry

Each renewal or opportunity is represented as an object with the following properties. This structure is used for entries in the main data list and for the forms in the Add/Edit modals.

*   `id`: (String) A unique identifier for the entry (likely auto-generated, e.g., UUID or timestamp-based).
*   `accountName`: (String) The name of the account or client.
*   `renewalDate`: (String) The date of renewal (YYYY-MM-DD format from `<input type="date">`).
*   `sentDate`: (String) The date the renewal was sent (YYYY-MM-DD format).
*   `closeDate`: (String) The date the opportunity is expected to close or did close (YYYY-MM-DD format). This is crucial for monthly grouping.
*   `amount`: (Number) The monetary value of the opportunity/renewal (USD).
*   `opportunityId`: (String) The specific ID for the opportunity (e.g., from a CRM).
*   `isChecked`: (Boolean, not directly in forms but implied for tracking confirmed deals for progress/KPIs) Indicates if a renewal is confirmed.
*   `notes`: (String, optional) Any additional notes or comments related to the entry.

**Example Renewal Object:**
```json
{
  "id": "unique-entry-id-123",
  "accountName": "Acme Corp",
  "renewalDate": "2024-09-15",
  "sentDate": "2024-07-01",
  "closeDate": "2024-08-30",
  "amount": 1250.75,
  "opportunityId": "OPP-00123",
  "isChecked": false,
  "notes": "Follow up scheduled for Aug 15th."
}
```

## 2. Application State (Conceptual)

While not explicitly defined in `index.html`, `main.js` would manage an application state, likely including:

*   `renewals`: (Array of Renewal Objects) The primary list of all renewal entries.
*   `receiptsGoal`: (Number) The user-defined goal for the number of receipts/confirmed deals (e.g., 55).
*   `searchTerm`: (String) The current value in the search input field.
*   `editingEntryId`: (String/null) The ID of the entry currently being edited, if any.

## 3. Persistent Storage

### 3.1. JSON File (User-Initiated Save/Load)

*   **Schema:** When data is saved to a file, it's likely a JSON object containing the application state, primarily the array of renewal objects and potentially other settings like the `receiptsGoal`.
    ```json
    {
      "renewals": [
        // ... array of renewal objects as defined in section 1 ...
      ],
      "receiptsGoal": 55,
      "version": "1.0" // Optional: for future schema migrations
    }
    ```
*   **Interaction:**
    *   **Save (`#icon-save-to-file`):** The current `renewals` array and `receiptsGoal` are stringified into JSON and offered as a download.
    *   **Load (`#icon-load-from-file` & `#file-input`):** A user-selected JSON file is read, parsed. The `renewals` array and `receiptsGoal` from the file replace the current application state. The UI is then re-rendered.

### 3.2. Browser `localStorage` (Auto-Save/Session Persistence - Conceptual)

*   **Purpose:** To automatically save the current state of renewals and settings (like `receiptsGoal`) so users don't lose data if they close the browser tab or navigate away accidentally.
*   **Data Stored:** Similar to the JSON file structure, likely storing the stringified `renewals` array and `receiptsGoal` under specific keys (e.g., `ibramah_renewals_data`, `ibramah_receipts_goal`).
*   **Triggers:**
    *   **Save:** After adding, editing, deleting a renewal, or updating the goal.
    *   **Load:** On application initialization, data is loaded from `localStorage` if available.

## 4. Data Flow

1.  **Initialization:**
    *   App starts -> Attempts to load data from `localStorage`.
    *   If `localStorage` data exists and is valid, it populates the internal `renewals` array and `receiptsGoal`.
    *   If not, app starts with an empty/default state.
    *   The UI is rendered based on this initial state.

2.  **User Adds/Edits/Deletes Renewal:**
    *   User interacts with a modal form.
    *   On submission (Add/Save Changes) or confirmation (Delete):
        *   Input data is validated.
        *   The internal `renewals` array is modified (add, update, or remove an entry).
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

This outlines the expected data structures and flow. The actual implementation in `src/js/main.js` will contain the definitive logic.