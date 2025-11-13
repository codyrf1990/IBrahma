# Project File and Component Structure (iBramah - Opportunity Tracker)

This document outlines the project's file and folder structure, and the HTML component hierarchy as defined in `index.html`. This summary is current as of 2025-05-14.

## 1. File/Folder Structure (Current Workspace)

```
License Tracker/
├── .github/
│   └── workflows/         # GitHub Actions CI/CD workflows (if any)
├── docs/                  # Documentation and context files
│   ├── _app_overview.md
│   ├── _context_core_logic.md
│   ├── _context_data.md
│   ├── _context_features.md
│   ├── _context_structure.md
│   ├── DEV_NOTES.md
│   ├── UI_Guide.md
│   └── ... (other md files)
├── src/
│   ├── assets/
│   │   └── Images/        # Application images (logos, favicons)
│   │       ├── SolidCAM.png
│   │       └── scfav.png
│   └── js/
│       └── main.js        # Main JavaScript file (module)
├── CHANGELOG.md           # Log of changes to the application
├── index.html             # Main HTML file (application entry point)
├── LICENSE                # Project license file
├── README.md              # Project overview and setup instructions
└── style.css              # Main CSS file for styling
```

## 2. HTML Component Hierarchy (`index.html`)

Below is a breakdown of the main structural and functional components within `index.html`:

```html
<body>
    <div id="license-app">
        <!-- 1. Main Header -->
        <header class="main-header">
            <div class="title-group" id="appLogoArea">
                <h1 class="app-title">iBramah</h1>
                <p class="app-tagline">Opportunity Tracker</p>
            </div>
            <img src="src/assets/Images/SolidCAM.png" alt="SolidCAM Logo" class="header-logo">
            <div class="percentage-calculator summary-box"> <!-- Quick % Calc -->
                <h4>Quick % Calc</h4>
                <div class="calculator-content">
                    <div class="calc-input-row">
                        <label for="calculator-amount">Amount:</label>
                        <input type="number" id="calculator-amount">
                    </div>
                    <div class="calculator-results">
                        <div id="result-container-5"></div>
                        <div id="result-container-10"></div>
                        <div id="result-container-15"></div>
                    </div>
                </div>
            </div>
        </header>

        <!-- 2. Commander Card (Quick Actions) -->
        <div id="commander-card" class="card">
            <div id="commander-system-section">
                <h3>System</h3>
                <!-- Icons: Save, Load, Add, Settings, Profile, Help -->
            </div>
            <div id="commander-chats-section">
                <h3>AI Chats</h3>
                <button id="btn-chat-std">SolidCAM Chat Std</button>
                <button id="btn-chat-pro">SolidCAM Chat Pro</button>
            </div>
            <div id="commander-utils-section">
                <h3>Utilities</h3>
                <!-- Icons: Email, Calc, Notes -->
            </div>
        </div>

        <!-- Hidden file input for loading data -->
        <input type="file" id="file-input" accept=".json" style="display: none;">
        <span class="sync-message" id="sync-message"></span>

        <!-- 3. Add New Renewal Modal -->
        <div id="add-renewal-modal" class="modal-overlay">
            <div class="modal-content">
                <div class="add-section" id="add-section">
                    <h3>Add New Renewal</h3>
                    <!-- Form Grid: account-name, renewal-date, sent-date, close-date, amount, opportunity-id -->
                    <div class="button-row">
                        <button class="cancel-btn">Cancel</button>
                        <button class="add-btn">Add Renewal</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. Totals & Summary Area -->
        <div class="totals-summary">
            <!-- 4.1. Progress Overview -->
            <div id="progress-overview" class="summary-box">
                <h3>Progress Overview</h3>
                <p id="receipts-info"></p>
                <div class="progress-bar-container">
                    <div class="progress-bar">
                        <div class="progress-fill" id="receipts-progress"></div>
                    </div>
                </div>
                <div class="control-group goal-group">
                    <span id="receipts-percentage"></span>
                    <input type="number" id="receipts-goal-input">
                    <button id="update-goal-btn">Update Goal</button>
                </div>
                <hr>
            </div>

            <!-- 4.2. Key Stats Section -->
            <div id="kpi-stats-section" class="summary-box summary-box-empty">
                <h4>Key Stats</h4>
                <div class="kpi-list">
                    <p>Total Entered: <span id="kpi-total-confirmed"></span></p>
                    <p>Average Confirmed: <span id="kpi-avg-amount"></span></p>
                </div>
            </div>

            <!-- 4.3. Total Confirmed Value Card -->
            <div id="total-confirmed-whole-card" class="summary-box entry-summary">
                <h3>Total Confirmed</h3>
                <p id="total-confirmed-whole-value"></p>
            </div>
        </div>

        <!-- 5. Search Bar -->
        <div class="search-container">
          <label for="search-input" class="visually-hidden">Search Renewals:</label>
          <input type="search" id="search-input" placeholder="Search by Name or Opp ID...">
        </div>

        <!-- 6. Main Container (for dynamic month sections) -->
        <div class="container" id="main-container">
            <!-- Month sections dynamically loaded by script.js -->
            <!-- Placeholder for legacy totals (hidden) -->
            <div id="legacy-totals-placeholder" style="display: none;">...</div>
            <!-- Completion message (hidden by default) -->
            <div class="completion-status" id="completion-message" style="display: none;">...</div>
        </div>

        <!-- 7. Edit Renewal Modal -->
        <div class="modal-overlay" id="edit-modal" style="display: none;">
            <div class="modal">
                <div class="modal-header">...</div>
                <div class="modal-form">
                    <!-- Form Fields: edit-name, edit-renewal-date, edit-sent-date, edit-date, edit-amount, edit-opportunity-id -->
                    <input type="hidden" id="edit-row-id">
                </div>
                <div class="modal-actions">...</div>
            </div>
        </div>

        <!-- 8. Confirmation Modal -->
        <div id="confirmation-modal" class="modal-overlay" style="display: none;">
            <div class="modal">
                <!-- Header, Content (modal-message), Footer (cancel/confirm buttons) -->
            </div>
        </div>

        <!-- Auto-save indicator -->
        <div id="auto-save-indicator">Changes saved</div>
    </div> <!-- End of #license-app -->

    <!-- 9. Logo Hover Message Window -->
    <div id="logoHoverMessageWindow" class="fancy-message-window" style="display: none;">
        <!-- Content and close button -->
    </div>
    <div id="fancyMessageOverlay" style="display:none;"></div>

    <!-- 10. Generic Content Modal -->
    <div id="generic-content-modal" class="modal-overlay">
        <div class="modal-content">
            <button id="generic-modal-close-btn">&times;</button>
            <h3 id="generic-modal-title"></h3>
            <div id="generic-modal-body">
                <iframe id="generic-modal-iframe" src="about:blank"></iframe>
            </div>
        </div>
    </div>

    <!-- 11. Chat Pro Sidebar -->
    <div id="chatProSidebar" class="chat-sidebar">
        <div id="chatProSidebarDragHandle"></div>
        <div class="chat-sidebar-header">
            <h3>SolidCAM AI Chat</h3>
            <button id="closeChatProSidebarBtn">&times;</button>
        </div>
        <iframe id="chatProSidebarIframe" src="about:blank"></iframe>
    </div>

    <script type="module" src="src/js/main.js"></script>
</body>
```

## 3. Key JavaScript Modules & CSS

*   **`src/js/main.js`**: This is the main entry point for all client-side JavaScript logic. It handles:
    *   Application initialization.
    *   Event handling for all user interactions.
    *   DOM manipulation (creating, updating, deleting renewal entries and month sections).
    *   Data management (adding, editing, deleting renewals internally).
    *   Interactions with `localStorage` and file system for data persistence.
    *   Updating summary statistics and KPIs.
    *   Managing modals and sidebars.
*   **`style.css`**: Contains all CSS rules for styling the application, including layout, typography, colors, and responsiveness.

This structure provides a single-page application (SPA) feel, where `index.html` provides the static layout and `main.js` dynamically manages content and interactions.
