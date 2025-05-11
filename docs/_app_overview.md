# iBramah - Opportunity Tracker: App Overview

## 1. Application Purpose and Current State

**iBramah - Opportunity Tracker** is a web-based application designed to help users, likely sales professionals, manage and track sales opportunities or license renewals. It provides a centralized interface for recording renewal details, monitoring progress against goals, and accessing utility tools to streamline sales-related workflows.

The application is currently in a functional state, offering features for data entry, persistence, visualization of key metrics, and quick access to common actions and external AI chat tools. It emphasizes a user-friendly interface with clear sections for different functionalities.

## 2. Key Capabilities

### Core Data Management:
*   **Add New Renewals:** Users can add new renewal entries with details such as Account Name, Renewal Date, Sent Date, Close Date, Amount (USD), and Opportunity ID via a dedicated modal form.
*   **View Renewals:** Renewal data is displayed, likely organized by month, in the main container.
*   **Edit Renewals:** Existing entries can be modified through an edit modal, allowing updates to all relevant fields.
*   **Delete Renewals:** (Implied by standard CRUD, though not explicitly detailed in `index.html` structure for this specific function button, likely handled in `main.js`).
*   **Search/Filter:** A search bar allows users to quickly find renewals by Name or Opportunity ID.

### Data Persistence & Synchronization:
*   **Save to File:** Users can save the current state of renewal data to a JSON file.
*   **Load from File:** Users can load previously saved renewal data from a JSON file.
*   **Auto-Save Indicator:** Provides feedback that changes are being saved.
*   **Sync Message:** Displays synchronization status.

### Progress Tracking & KPIs:
*   **Progress Overview:**
    *   Displays the number of receipts received against a configurable goal (e.g., "0 of 55 Receipts Received").
    *   Includes a progress bar visualizing this achievement.
    *   Allows users to update the goal number.
*   **Key Stats Section:**
    *   Shows "Total Entered" amount.
    *   Shows "Average Confirmed" amount.
*   **Total Confirmed Value:** A dedicated card displays the total confirmed monetary value.

### Utility & Quick Access Features:
*   **Commander Card:** A central hub for quick actions:
    *   **System:** Save to File, Load from File, Add Renewal, Settings, User Profile, Help.
    *   **AI Chats:** Buttons to launch "SolidCAM Chat Std" and "SolidCAM Chat Pro" (Pro version opens in a dedicated sidebar).
    *   **Utilities:** Email Templates, Advanced Calculator, Scratchpad (Notes).
*   **Quick Percentage Calculator:** Located in the header, allows users to quickly calculate 5%, 10%, and 15% of a given amount.

### User Interface & Experience:
*   **Responsive Design:** Indicated by `<meta name="viewport" ...>`.
*   **Modal Dialogs:** Used for adding/editing entries, confirmations, and displaying generic content (e.g., iframe content for utilities).
*   **Header:** Contains the app title ("iBramah"), tagline ("Opportunity Tracker"), SolidCAM logo, and the Quick Percentage Calculator.
*   **Visual Feedback:** Progress bars, auto-save indicators, sync messages.
*   **Iconography:** Uses Font Awesome for icons in the Commander Card and elsewhere.
*   **Special Message Window:** A "fancy message window" can display important announcements or messages (e.g., the Henry Maudslay quote).
*   **Chat Pro Sidebar:** A draggable sidebar to embed the "SolidCAM Chat Pro" interface.

## 3. Main Components (from `index.html`)

*   **Main Header (`<header class="main-header">`):** App branding, logo, Quick % Calculator.
*   **Commander Card (`<div id="commander-card">`):** Quick access to system, AI chat, and utility functions.
*   **Add Renewal Modal (`<div id="add-renewal-modal">`):** Form for adding new renewal entries.
*   **Totals Summary Area (`<div class="totals-summary">`):**
    *   `#progress-overview`: Tracks receipts against a goal.
    *   `#kpi-stats-section`: Displays key stats like total entered and average confirmed.
    *   `#total-confirmed-whole-card`: Displays total confirmed value.
*   **Search Container (`<div class="search-container">`):** Input for searching renewals.
*   **Main Container (`<div id="main-container">`):** Where dynamically loaded month sections with renewal data are displayed.
*   **Edit Modal (`<div id="edit-modal">`):** Form for editing existing renewal entries.
*   **Confirmation Modal (`<div id="confirmation-modal">`):** For user confirmations of actions.
*   **Generic Content Modal (`<div id="generic-content-modal">`):** A versatile modal to display various content, including iframes.
*   **Chat Pro Sidebar (`<div id="chatProSidebar">`):** A sidebar for the "SolidCAM Chat Pro" iframe.
*   **Logo Hover Message Window & Overlay:** For displaying special messages.

## 4. Technology Stack (Inferred from `index.html`)

*   **Frontend:** HTML, CSS, JavaScript.
*   **JavaScript Modules:** Indicated by `<script type="module" src="src/js/main.js"></script>`.
*   **Libraries/Frameworks:**
    *   Font Awesome (for icons).
*   **Data Format:** Likely JSON for data persistence (implied by "Save to File" functionality and typical web app practices).

This overview is based on the structure and elements present in `index.html`. The dynamic behavior and detailed logic are primarily managed by `src/js/main.js` and styled by `style.css`.