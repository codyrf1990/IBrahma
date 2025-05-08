# Application Features

## Core Functionality

*   **Add Entries**: Add new renewal or opportunity entries via a modal form.
    *   Fields: Account Name, Renewal Date, Sent Date, Close Date, Amount (USD), Opportunity ID.
    *   Validation: Requires Account Name and Close Date.
    *   The Add Entry form can be pre-populated with random, plausible data for faster testing/demo purposes (`utils.getSampleFormData()`).
*   **Edit Entries**: Modify existing entries via an edit modal.
    *   Pre-populates form with current data.
    *   Handles month changes if Close Date is updated.
*   **Delete Entries**: Remove entries with confirmation.
*   **Confirm Entries**: Mark entries as confirmed using checkboxes.
    *   Updates visual state (row styling) and internal state (`state.checkedRows`).
    *   Impacts summary calculations and progress.
*   **Monthly Grouping**: Automatically groups entries into sections based on the month of their Close Date.
    *   Sections are created dynamically and sorted chronologically.
    *   Each section displays a count of confirmed entries and a subtotal amount for those confirmed entries.
*   **Data Persistence**: All entered data is auto-saved to browser `localStorage`. Data can also be manually exported to a JSON file and imported from a JSON file.
*   **Summary Statistics**: Calculates and displays key metrics:
    *   **Progress Overview**: Tracks confirmed entries against a user-defined goal (count and percentage bar).
    *   **Key Stats**: Shows "Total Entered" amount (sum of all entries, with cents) and "Average Confirmed" amount.
    *   **Total Confirmed (Card)**: A dedicated card displays the total sum of confirmed entry amounts.
*   **Search Functionality**: Filter entries by account name or opportunity ID.
    *   Real-time filtering as the user types.
    *   Hides non-matching entries and empty month sections.
    *   The search input field (`#search-input`) and its container (`.search-container`) have had their spacing (margins) adjusted for better layout.
*   **Entry Notes**: Add detailed notes to each entry.
    *   Notes are stored with entry data and persist across sessions.
    *   Quick view with tooltips on hover over the notes icon, and full edit capability with a popup editor.

## User Interface Features

*   **Modals**: Uses modal dialogs for adding entries, editing entries, and confirming deletions.
*   **Dynamic UI Updates**: The interface updates automatically after actions (add, edit, delete, check) via the `updateUIAndSummaries` function.
*   **Sorting**: 
    *   Rows within each month are sorted by Close Date.
    *   Month sections are sorted chronologically.
*   **Feedback Messages / Notifications**: Logic for displaying action feedback (e.g., "Renewal added successfully" via `.sync-message`) exists. This notification element has been styled to appear in the bottom-left corner but is currently set to `display: none !important;` in `style.css`, effectively hiding it from the user view.
*   **Auto-Save Indicator**: Displays the time of the last auto-save in the bottom-right corner.
*   **Quick Percentage Calculator**: A widget in the header area to quickly calculate 5%, 10%, and 15% of an entered amount, independent of main application data.
*   **Tooltips**: Display additional information on hover, such as note previews.

## Responsive Design

The application is designed to adapt to various screen sizes, providing a usable experience on desktops, tablets, and mobile devices.

*   **Breakpoints**: Uses CSS media queries (e.g., at 900px, 700px, 600px, 480px, 400px) to adjust layout and styling.
*   **Dashboard/Summary Layout**: Summary cards (Progress, Key Stats, Total Confirmed) adjust their layout on narrower screens.
*   **Tables**: Implement horizontal scrolling on narrow screens for the main data table, with visual scroll indicators. Column widths adjust, and less critical columns (e.g., Opportunity ID, Sent Date) are hidden on the smallest screens to improve readability.
*   **Modals**: Adjust width and form layout for smaller screens.
*   **Controls**: Buttons and font sizes adapt for touch-friendliness and readability.
*   **Accessibility Considerations**: Includes visually hidden labels for form inputs, role attributes, and efforts for adequate touch target sizes and spacing.

## Informational Pop-up (Easter Egg)

Hovering over the application logo area (`.title-group`) for a few seconds displays a special message window with a quote about craftsmanship and innovation. This is implemented in JavaScript and styled with CSS.

### Future or Potential Features (Not Yet Implemented / Ideas)

*   More advanced filtering options (e.g., by date ranges, by status excluding confirmed).
*   Customizable KPls or summary metrics.
*   User accounts or cloud synchronization (would require backend changes).
*   Direct integration with CRM or sales platforms.
*   Batch operations (e.g., delete multiple selected entries).
*   More sophisticated sorting options (e.g., by amount, by name).