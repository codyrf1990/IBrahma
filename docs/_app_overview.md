# iBramah - Opportunity Tracker: App Overview

## 1. Application Purpose and Current State

**iBramah - Opportunity Tracker** is a modern web application for managing and tracking sales opportunities, license renewals, and related sales data. It provides sales professionals with a centralized dashboard to record, update, and analyze renewal activity, track progress against goals, and access productivity and AI tools.

The application is fully functional, supporting robust data entry, editing, deletion, persistent storage, statistics, and a suite of utility features. The UI is responsive and optimized for usability, with clear separation of concerns and modular JavaScript for maintainability.

## 2. Key Capabilities

### Core Data Management
- **Add New Renewals:** Enter account name, renewal date, sent date, close date, amount (USD), and opportunity ID via a modal form.
- **View Renewals:** Renewals are grouped by month and displayed in a dynamic main container.
- **Edit Renewals:** Modify any field of an existing entry via an edit modal.
- **Delete Renewals:** Remove entries with confirmation.
- **Search/Filter:** Instantly filter renewals by account name or opportunity ID.

### Data Persistence & Synchronization
- **Save to File:** Export renewal data and settings as a JSON file.
- **Load from File:** Import previously saved data from a JSON file.
- **Auto-Save:** Changes are automatically persisted to localStorage, with a visible last-saved indicator.
- **Sync Message:** Visual feedback for save/load actions.

### Progress Tracking & KPIs
- **Progress Overview:** Track confirmed receipts against a user-defined goal with a progress bar and stats.
- **Key Stats:** Display total entered, average confirmed, and total confirmed values.

### Utility & Quick Access Features
- **Commander Card:** Central hub for quick actions: save/load, add renewal, settings, user profile, help, AI chat, and utilities.
- **AI Chats:** Launch "SolidCAM Chat Std" or open "SolidCAM Chat Pro" in a draggable sidebar for advanced assistance.
- **Utilities:** Access email templates, an advanced calculator, and a scratchpad for notes.
- **Quick Percentage Calculator:** Instantly compute 5%, 10%, and 15% of any amount.

### User Interface & Experience
- **Responsive Design:** Mobile-friendly layout and scaling.
- **Modal Dialogs:** For all forms and confirmations.
- **Header:** App title, tagline, logo, and calculator.
- **Visual Feedback:** Progress bars, auto-save, toasts, and sync messages.
- **Iconography:** Font Awesome icons throughout.
- **Special Message Window:** Hover-activated announcement window.
- **Chat Pro Sidebar:** Draggable, resizable, and embeddable AI chat.

## 4. Technology Stack
- **Frontend:** HTML, CSS, JavaScript (ES Modules)
- **Libraries:** Font Awesome (icons)
- **Data Format:** JSON for persistence
- **Architecture:** Modular JS (main.js, data.js, state.js, eventHandlers.js, domUtils.js, calculations.js)

This overview reflects the current application state as of 2025-05-14, based on the latest codebase and UI structure.