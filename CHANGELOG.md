# Changelog

All notable changes to the License Tracker application will be documented in this file.

## [Unreleased] - 2025-05-11

### Added
- Context files updated for new InstructorAI session, with latest codebase and feature info. [2025-05-11]
- Context files (`_app_overview.md`, `_context_core_logic.md`, `_context_data.md`, `_context_features.md`, `_context_structure.md`) updated for new InstructorAI session, with latest codebase and feature info. [2025-05-05]
- Add Renewal modal now pre-populates with random data for faster testing.
- Added a hover-activated informational window to the logo area, displaying a message after a 2-second delay.

### Changed
- Adjusted margins for the `.search-container` to fine-tune spacing around the search bar.
- Styled the `.sync-message` notification to be a small toast in the bottom-left corner, then updated its CSS to `display: none !important;` to hide it permanently based on user request.
- Modified dashboard stacking breakpoint from 900px to 700px
- Dashboard cards now remain in horizontal layout until narrower screen widths
- Separated dashboard layout and modal form breakpoints for better UI at mid-sized screens
- Modified the rightmost KPI card in the dashboard to display "Total Confirmed" amount as a whole number (no cents).
- Updated the "Key Stats" card: "Total Confirmed" changed to "Total Entered" and now displays the sum of all entry amounts (with cents).
- Ensured font sizes for the main title ('iBramah') and subtitle ('Opportunity Tracker') are consistent with previous styling.

### Fixed
- Fixed Quick % Calc widget functionality by implementing proper event listener and calculation logic
- Percentage values now correctly update when entering an amount in the calculator input field
- Fixed layout issues in the table's 'Actions' column by wrapping buttons in a Flexbox container for better spacing and alignment.
- Refined alignment and spacing of action buttons in the table using `space-around` justification and added consistent hover/click effects.
- Tables now correctly scroll horizontally on all screen sizes
- Improved mobile scrolling experience with -webkit-overflow-scrolling: touch
- Ensured table containers don't cause page-level horizontal scrolling

## [1.0.4] - 2024-06-18

### Changed
- Modified dashboard stacking breakpoint from 900px to 700px
- Dashboard cards now remain in horizontal layout until narrower screen widths
- Separated dashboard layout and modal form breakpoints for better UI at mid-sized screens

## [1.0.3] - 2024-06-17

### Added
- New 700px breakpoint specifically for table responsiveness
- Visual scroll indicator (gradient) showing when tables can be scrolled horizontally
- Force-enabled table scrolling with !important to ensure it works in all contexts

### Changed
- Tables now use 500px minimum width on screens below 700px (was 600px)
- Improved table container to use display: block for consistent scrolling behavior
- Enhanced table scrolling with position: relative for proper indicator positioning

### Fixed
- Tables now correctly scroll horizontally on all screen sizes
- Improved mobile scrolling experience with -webkit-overflow-scrolling: touch
- Ensured table containers don't cause page-level horizontal scrolling

## [1.0.2] - 2024-06-16

### Added
- New 600px and 400px breakpoints for finer control over responsive design
- Maximum width constraints for table columns to improve readability
- Enhanced touch targets for mobile users (minimum 24px size)
- Accessibility improvements for buttons and interactive elements

### Changed
- Improved table column sizing with both min-width and max-width constraints
- Further optimized table layouts on small screens with better column proportions
- Form layouts and spacing optimized for very small screens (<400px)
- Font sizes now scale appropriately for each screen size
- Action buttons (edit/delete) now have increased spacing on mobile for easier tapping

### Fixed
- Modal action buttons now wrap properly on small screens
- Better handling of long text content in table cells
- Form fields remain accessible on smallest screens with optimized padding
- Touch targets now meet accessibility guidelines on all screen sizes

## [1.0.1] - 2024-06-15

### Added
- New responsive design breakpoints at 900px, 768px, and 480px widths
- Custom scrollbar styling for table overflow on dark mode
- Word-break and text-overflow handling for long content in table cells

### Changed
- Improved table overflow handling with horizontal scrolling
- Dashboard layout now stacks vertically on screens under 900px width
- Optimized column widths for different screen sizes
- Modal dialogs now adapt better to small screens with 95% viewport width limit
- Form layouts switch to single column on narrow screens

### Fixed
- Tables now properly scroll horizontally on small screens instead of breaking layout
- Long content in table cells no longer causes layout issues
- UI remains accessible and functional on mobile devices and narrow windows

## [1.0.0] - 2024-06-01

### Added
- Initial release with core license tracking functionality
- Local storage for data persistence
- Monthly grouping of license entries
- Confirmation status tracking with progress indicators 