# Changelog

## 1.2.0 - 2026-08-27

### Changed

- Changed the single-course action to **Fill & Submit Current Course**.
- After filling an individual evaluation page, the extension now clicks the SIS submit button and returns the tab to `https://sis.iutoic-dhaka.edu/evaluation-list`.
- Added a GitHub star link to the popup.
- Updated the README for the new individual-course submit flow.

## 1.1.0 - 2026-08-27

### Fixed

- Fixed **Evaluate All Listed Courses** so it runs inside the SIS evaluation list page instead of trying to read SIS DOM from the popup.
- Added message handling for the bulk evaluation action.
- Added default rating fallback in the page-filling flow.
- Replaced console-only results with popup status messages.
- Removed broad `<all_urls>` host permission and limited the extension to the IUT SIS domain.
- Removed manually supplied `Sec-*` fetch headers from the bulk submission request.

### Changed

- Renamed popup actions to **Fill Current Course** and **Evaluate All Listed Courses**.
- Updated the popup layout with labels, a textarea for feedback, disabled states, focus states, and page-aware action availability.
- Bulk submissions now use the selected rating and feedback from the popup.
- Added content-script support for the SIS evaluation list page.

### Documentation

- Rewrote the README usage instructions for the separate single-course and bulk workflows.
