# SolidCAM Sub Tracker UI Guide

This document provides a breakdown of the visual layout and components of the SolidCAM Subscription Tracker application. It maps UI elements to their corresponding HTML structure, CSS rules, and controlling JavaScript functions.

## 1. Overall Layout

The application interface is structured as follows:

1.  **Header Section:** Contains the application title and buttons for data export/import and adding test data.
2.  **Add New Renewal Section:** A form for inputting details of new subscription renewals.
3.  **Receipts Progress Section:** Displays progress towards receipt confirmation goals and remaining items.
4.  **Totals Summary Section:** Shows buttons to toggle the view and displays the total value of confirmed renewals.
5.  **Main Content Area:** Dynamically displays subscription renewals grouped by month in sortable tables.
6.  **Edit Modal:** A pop-up form for editing existing renewal entries (initially hidden).
7.  **Auto-Save Indicator:** A small status message indicating the last save time (appears briefly).

## 2. Component Breakdown

---

### Header Section (`.sync-section`)

*   **Description:** The top-most section displaying the app title and controls for data synchronization and testing.
*   **HTML Location:** `<div class="sync-section">` in `index.html`.
*   **CSS Styling:** `.sync-section` (general layout), `h2` (title styling), `.sync-button` (button styles), `.sync-message` (status message styling). Defined in `style.css`.
*   **JS Control:**
    *   `saveToObsidian()` (in `data.js`, called by Export button `onclick`).
    *   `loadFromObsidian()` (in `data.js`, called by Import button `onclick`).
    *   `addRandomTestData()` (in `eventHandlers.js`, called by Add Test Data button `onclick`).
    *   `showMessage()` (in `utils.js`, updates `#sync-message`).
    *   `main.js` attaches listeners and handles global setup.

**Sub-components:**

*   **Title (`h2`):** "SolidCAM Sub Tracker".
    *   HTML: `<h2>SolidCAM Sub Tracker</h2>` within `.sync-section`.
    *   CSS: `h2` rules in `style.css`.
*   **Export Button (`button` with `onclick="saveToObsidian"`):** Exports current data.
    *   HTML: `<button class="sync-button" onclick="saveToObsidian()">Export Data...</button>`
    *   CSS: `.sync-button`, `.info-badge`.
    *   JS: `data.js::saveToObsidian`.
*   **Import Button (`button` with `onclick="loadFromObsidian"`):** Imports data.
    *   HTML: `<button class="sync-button" onclick="loadFromObsidian()">Import Data...</button>`
    *   CSS: `.sync-button`, `.info-badge`.
    *   JS: `data.js::loadFromObsidian`.
*   **Add Test Data Button (`#add-test-data-btn`):** Adds a random entry for testing.
    *   HTML: `<button class="sync-button test-data-button" id="add-test-data-btn" onclick="addRandomTestData()">Add Test Data...</button>`
    *   CSS: `.sync-button`, `.test-data-button`, `.info-badge`.
    *   JS: `eventHandlers.js::addRandomTestData`.
*   **Sync Message Area (`#sync-message`):** Displays status messages (e.g., save confirmation, errors).
    *   HTML: `<span class="sync-message" id="sync-message"></span>`
    *   CSS: `.sync-message`.
    *   JS: `utils.js::showMessage`.

---

### Add New Renewal Section (`.add-section`)

*   **Description:** A form used to input and submit details for a new subscription renewal.
*   **HTML Location:** `<div class="add-section" id="add-section">` in `index.html`.
*   **CSS Styling:** `.add-section` (container), `.form-grid` (layout), `.form-field` (field container), `label`, `input`, `.button-row`, `.cancel-btn`, `.add-btn`. Defined in `style.css`.
*   **JS Control:**
    *   `addLicense()` (in `eventHandlers.js`, called by Add Renewal button `onclick`).
    *   `clearForm()` (in `domUtils.js`, called by Cancel button `onclick`).
    *   Input validation might occur within `addLicense`.

**Sub-components:**

*   **Overall Form Structure (`.form-grid`):** Grid layout for input fields.
    *   HTML: `<div class="form-grid">` containing `.form-field` divs.
    *   CSS: `.form-grid`, `.form-field`.
*   **Input Fields:** Labels and corresponding text/date/number inputs.
    *   Account Name: `label[for="account-name"]`, `input#account-name`
    *   Close Date: `label[for="close-date"]`, `input#close-date`
    *   Renewal Date: `label[for="renewal-date"]`, `input#renewal-date`
    *   Amount: `label[for="amount"]`, `input#amount`
    *   Opportunity ID: `label[for="opportunity-id"]`, `input#opportunity-id`
    *   HTML: Within `.form-field` divs inside `.form-grid`.
    *   CSS: `label`, `input`.
*   **Cancel Button (`button.cancel-btn`):** Clears the form fields.
    *   HTML: `<button class="cancel-btn" onclick="clearForm()">Cancel</button>`
    *   CSS: `.cancel-btn`, `.button-row`.
    *   JS: `domUtils.js::clearForm`.
*   **Add Renewal Button (`button.add-btn` with `onclick="addLicense"`):** Submits the form data to add a new renewal entry.
    *   HTML: `<button class="add-btn" onclick="addLicense()">Add Renewal</button>`
    *   CSS: `.add-btn`, `.button-row`.
    *   JS: `eventHandlers.js::addLicense`.

---

### Receipts Progress Section (`.receipts-progress`)

*   **Description:** Contains two cards displaying progress related to confirmed receipts and the total pool of potential renewals. Allows updating goal/pool values.
*   **HTML Location:** `<div class="receipts-progress">` in `index.html`.
*   **CSS Styling:** `.receipts-progress` (grid layout), `.receipts-card`, `.pool-card` (card styling), `h3`, `#receipts-info`, `#pool-info`, `#remaining-info`, `.progress-bar`, `.progress-fill`, `.progress-text`, `input`, `button`. Defined in `style.css`.
*   **JS Control:**
    *   `updateTotals()` (in `domUtils.js`) updates the displayed numbers and progress bar.
    *   `updateReceiptsGoal()` (in `eventHandlers.js`, attached in `main.js`) handles clicks on the "Update Goal" button.
    *   `updateTotalPool()` (in `eventHandlers.js`, attached in `main.js`) handles clicks on the "Update Pool" button.
    *   `state.js` holds `receiptsGoal` and `totalPool` values.

**Sub-components:**

*   **Confirmed Receipts Card (`.receipts-card`):**
    *   Description: Shows the count of confirmed receipts against a goal, with a visual progress bar.
    *   HTML: `<div class="receipts-card">...</div>`
    *   CSS: `.receipts-card`, `h3`, `#receipts-info`, `.progress-bar`, `.progress-fill`, `.progress-text`, `#receipts-percentage`, `#receipts-goal-input`, `#update-goal-btn`.
    *   JS: Updated by `domUtils.js::updateTotals`. Goal updated via `eventHandlers.js::updateReceiptsGoal`.
*   **Remaining to Confirm Card (`.pool-card`):**
    *   Description: Shows the total pool size and the number remaining to be confirmed.
    *   HTML: `<div class="pool-card">...</div>`
    *   CSS: `.pool-card`, `h3`, `#pool-info`, `#remaining-info`, `#total-pool-input`, `#update-pool-btn`.
    *   JS: Updated by `domUtils.js::updateTotals`. Pool updated via `eventHandlers.js::updateTotalPool`.

---

### Totals Summary Section (`.totals-summary`)

*   **Description:** Displays key performance indicators (KPIs) and summary data. This section typically includes:
    *   A **Progress Overview** card showing confirmed entries against a goal.
    *   A **Key Stats** card showing "Total Entered" amount (sum of all opportunities, with cents) and "Average Confirmed" amount.
    *   A **Total Confirmed (Whole Value)** card displaying the sum of all confirmed opportunity amounts, formatted as a whole dollar currency.
*   **HTML Location:** `<div class="totals-summary">` in `index.html`. This div contains child divs for each KPI card, such as `#progress-overview`, `#kpi-stats-section`, and `#total-confirmed-whole-card`.
*   **CSS Styling:** `.totals-summary` (flex layout for the container), `.summary-box` (common styling for cards within), `.entry-summary` (specific styling for the rightmost card if needed), `.kpi-value` (styling for value text). Defined in `style.css`.
*   **JS Control:**
    *   `domUtils.js::displaySummaryStatistics(stats)` is primarily responsible for updating the values within these cards. It receives a `stats` object from `calculations.js`.
    *   `calculations.js::formatCurrency()` is used for formatting monetary values, with an option to show/hide cents.

**Sub-components (Illustrative for the changed card):**

*   **Key Stats Card (`#kpi-stats-section`):**
    *   Description: Shows total entered amount and average confirmed amount.
    *   HTML: `<div id="kpi-stats-section" class="summary-box"><h4>Key Stats</h4><div class="kpi-list"><p>Total Entered: <span id="kpi-total-confirmed" class="kpi-value">...</span></p><p>Average Confirmed: <span id="kpi-avg-amount" class="kpi-value">...</span></p></div></div>`
    *   JS: Values updated by `domUtils.js::displaySummaryStatistics` using `stats.totalEnteredAmount` and `stats.averageDealSize`.

*   **Total Confirmed (Whole Value) Card (`#total-confirmed-whole-card`):**
    *   Description: Shows the total sum of confirmed opportunity amounts as a whole number.
    *   HTML: `<div id="total-confirmed-whole-card" class="summary-box entry-summary"><h3>Total Confirmed</h3><p id="total-confirmed-whole-value" class="kpi-value">$0</p></div>`
    *   CSS: Styled by `.summary-box`, `.entry-summary`, and `.kpi-value`.
    *   JS: Value updated by `domUtils.js::displaySummaryStatistics` using `stats.totalConfirmed` and `formatCurrency(amount, { showCents: false })`.

---

### Main Content Area (`#main-container`)

*   **Description:** The primary area where renewal data is displayed, dynamically organized into sections for each month.
*   **HTML Location:** `<div class="container" id="main-container">` in `index.html`. Month sections (`div.month-section`) are added dynamically.
*   **CSS Styling:** `.container` (main area styling), `.month-section` (section block), `.month-header` (header), `.client-table` (table layout), `thead`, `th` (headers - `.th-checkbox`, `.th-name`, etc.), `tbody`, `tr.client-row` (row styling, hover effects), `td` (cell styling - `.td-checkbox`, `.td-name`, etc.), `.subtotal-row` (subtotal display). Defined in `style.css`.
*   **JS Control:**
    *   `domUtils.js::createNewMonthSection` creates the HTML for a month section when the first entry for that month is added.
    *   `eventHandlers.js::addLicense` triggers month section creation if needed.
    *   `domUtils.js::updateMonthSection` updates counts and subtotals.
    *   `domUtils.js::updateTotals` shows/hides rows and sections based on the current view (`all` or `confirmed`).
    *   `domUtils.js::sortClientsByDate` sorts rows within each month.
    *   `domUtils.js::sortMonthSections` sorts the month sections chronologically.
    *   `main.js` sets up event delegation on `.container` for handling clicks/changes on dynamic rows (checkbox, edit, delete).
    *   `eventHandlers.js::toggleChecked`, `eventHandlers.js::deleteRow`, `domUtils.js::openEditModal` are called via event delegation.

**Sub-components (Dynamic Structure):**

*   **Month Section (`.month-section`):** Container for a single month's renewals.
    *   Description: Groups renewals by close date month. Includes header, table, and subtotal. Created dynamically.
    *   HTML: `<div class="month-section" id="<month>-section">...</div>` (e.g., `id="january-section"`). Created by `domUtils.js::createNewMonthSection`.
    *   CSS: `.month-section`.
    *   JS: Managed by various `domUtils.js` functions. Sorted by `domUtils.js::sortMonthSections`.
*   **Month Header (`.month-header`):** Displays the Month, Year, and subscription count.
    *   HTML: `<div class="month-header"><span>Month Year</span><span id="<month>-count">...</span></div>`. Content set by `domUtils.js::createNewMonthSection` and `domUtils.js::updateMonthSection`.
    *   CSS: `.month-header`.
*   **Client Table (`table.client-table`):** Table displaying renewals for the month.
    *   HTML: `<table class="client-table">...</table>`. Structure defined in `domUtils.js::createNewMonthSection`.
    *   CSS: `.client-table`.
    *   **Table Header (`thead`/`th`):** Defines columns.
        *   HTML: `<thead><tr><th class="th-checkbox"></th><th class="th-name">...</th>...</tr></thead>`.
        *   CSS: `th`, `.th-checkbox`, `.th-name`, `.th-close-date`, `.th-renewal-date`, `.th-amount`, `.th-opp-id`, `.th-actions`.
    *   **Table Body (`tbody`):** Contains the client rows for the month.
        *   HTML: `<tbody id="<month>-clients-body">...</tbody>`. Rows added by `eventHandlers.js::addLicense` and `data.js` on load.
        *   CSS: `tbody`.
    *   **Client Row (`tr.client-row`):** Represents a single renewal entry.
        *   HTML: `<tr class="client-row" id="<rowId>" data-opportunity-id="...">...</tr>`. Dynamically created in `eventHandlers.js::addLicense`.
        *   CSS: `.client-row`, `.client-row:hover`, `.client-row.checked`.
        *   JS: Handled via event delegation in `main.js`. ID generated by `utils.js::generateId`.
        *   **Cells (`td`):**
            *   Checkbox: `td.td-checkbox` > `.checkbox-wrapper` > `input.custom-checkbox`
            *   Name: `td.td-name`
            *   Close Date: `td.td-close-date`
            *   Renewal Date: `td.td-renewal-date`
            *   Amount: `td.td-amount`
            *   Opportunity ID: `td.td-opp-id`
            *   Actions: `td.td-actions` > `button.edit-icon`, `button.delete-icon`
            *   CSS: `.td-checkbox`, `.checkbox-wrapper`, `.custom-checkbox`, `.td-name`, `.td-close-date`, `.td-renewal-date`, `.td-amount`, `.td-opp-id`, `.td-actions`, `.edit-icon`, `.delete-icon`.
*   **Subtotal Row (`.subtotal-row`):** Displays the sum of amounts for the month.
    *   HTML: `<div class="subtotal-row" id="<month>-subtotal">Subtotal: USD ...</div>`.
    *   CSS: `.subtotal-row`.
    *   JS: Updated by `domUtils.js::updateMonthSection`.

---

### Edit Modal (`.modal-overlay`/`.modal`)

*   **Description:** A pop-up dialog that appears when editing an existing renewal entry. It contains a form pre-filled with the entry's data.
*   **HTML Location:** `<div class="modal-overlay" id="edit-modal">` (contains `<div class="modal">`). Display toggled via `style.display`. Located near the end of `index.html`.
*   **CSS Styling:** `.modal-overlay` (full screen background), `.modal` (dialog box), `.modal-header`, `.modal-close`, `.modal-form`, `.form-field` (reused), `label`, `input`, `.modal-actions`, `.cancel-btn`, `.add-btn`. Defined in `style.css`.
*   **JS Control:**
    *   `domUtils.js::openEditModal` opens the modal, populates fields, and sets `state.editingRowId`. Called via event delegation or potentially direct button click.
    *   `domUtils.js::closeEditModal` hides the modal and clears `state.editingRowId`. Called by Cancel button and Close (X) button `onclick`.
    *   `eventHandlers.js::saveEditChanges` reads data from the modal form, updates the corresponding row in the main table, handles potential month changes, updates totals, and closes the modal. Called by Save Changes button `onclick`.

**Sub-components:**

*   **Modal Header/Close Button (`h3`, `.modal-close`):** Title ("Edit License") and the 'X' button to close.
    *   HTML: `<div class="modal-header"><h3>Edit License</h3><button class="modal-close" onclick="closeEditModal()">×</button></div>`
    *   CSS: `.modal-header`, `h3`, `.modal-close`.
    *   JS: Close button calls `domUtils.js::closeEditModal`.
*   **Modal Form Fields:** Input fields for editing data.
    *   Account Name: `label[for="edit-name"]`, `input#edit-name` (Note: Mismatch in provided HTML/JS - HTML uses `edit-name`, JS uses `edit-account-name`. Assuming JS is correct: `edit-account-name`)
    *   Close Date: `label[for="edit-date"]`, `input#edit-date` (JS uses `edit-close-date`)
    *   Renewal Date: `label[for="edit-renewal-date"]`, `input#edit-renewal-date`
    *   Amount: `label[for="edit-amount"]`, `input#edit-amount`
    *   Opportunity ID: `label[for="edit-opportunity-id"]`, `input#edit-opportunity-id`
    *   Hidden ID: `input#edit-row-id` (Used to store which row is being edited, value set by `openEditModal`).
    *   HTML: Within `.modal-form` containing `.form-field` divs.
    *   CSS: `.modal-form`, `.form-field`, `label`, `input`.
    *   JS: Populated by `domUtils.js::openEditModal`, read by `eventHandlers.js::saveEditChanges`.
*   **Modal Cancel Button (`button.cancel-btn` with `onclick="closeEditModal"`):** Closes the modal without saving.
    *   HTML: `<button class="cancel-btn" onclick="closeEditModal()">Cancel</button>` in `.modal-actions`.
    *   CSS: `.cancel-btn`, `.modal-actions`.
    *   JS: Calls `domUtils.js::closeEditModal`.
*   **Modal Save Changes Button (`button.add-btn` with `onclick="saveEditChanges"`):** Saves the edited data back to the main table row.
    *   HTML: `<button class="add-btn" onclick="saveEditChanges()">Save Changes</button>` in `.modal-actions`.
    *   CSS: `.add-btn`, `.modal-actions`.
    *   JS: Calls `eventHandlers.js::saveEditChanges`.

---

### Auto-Save Indicator (`#auto-save-indicator`)

*   **Description:** A small, temporary text element usually positioned at the bottom or corner of the screen, indicating when data has been successfully auto-saved to local storage.
*   **HTML Location:** `<div id="auto-save-indicator">Changes saved</div>` at the end of `index.html` (inside `#license-app`).
*   **CSS Styling:** `#auto-save-indicator` (positioning, text style, fade effects). Defined in `style.css`.
*   **JS Control:**
    *   `data.js::saveData` updates the text content and style of this element upon successful save or error.
    *   `domUtils.js::createAutoSaveIndicator` might create the element if it doesn't exist on load (though it's present in the HTML).
    *   `main.js` calls `saveData` periodically via `setInterval`. 