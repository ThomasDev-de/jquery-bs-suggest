### Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and the versioning follows SemVer.

#### [1.1.1] - 2025-12-12

- Options API cleanup and consistency:
  - Removed `headerActionMode`. The header now always shows Clear and Close actions (icons by default). Labels are customizable via `translations.headerClearText`/`translations.headerCloseText`; `showHeaderActionText` controls whether labels are shown next to icons.
  - Introduced `translations` object to centralize all UI texts:
    - `btnEmptyText`, `searchPlaceholderText`, `waitingForTypingText`, `typingText`, `loadingText`, `headerClearText`, `headerCloseText`.
  - Kept `icons` map (`{ remove, clear, close, checked, unchecked }`) for all icon customizations.
  - Backward compatibility: legacy flat text options (`btnEmptyText`, `emptyText`, `searchPlaceholderText`, `waitingForTypingText`, `typingText`, `loadingText`, `headerClearText`, `headerCloseText`) are mapped into `translations`. When `debug: true`, removed options (incl. `headerActionMode` and previous styling hooks) log warnings.
- Internal refactor:
  - All status texts and placeholders now use `translations` internally.
  - Simplified template generation and removed branching tied to `headerActionMode`.
- Demo and docs:
  - Demo updated to use `translations` and remove `headerActionMode`.
  - README updated: documented `translations`, removed styling/visual options and `headerActionMode`, updated examples, and version badge.

Additional changes included in 1.1.1:
- Translations schema simplified and renamed to a compact form:
  - New keys: `translations = { search, placeholder, waiting, typing, loading, clear, close }`.
  - Backward compatibility: legacy keys are mapped automatically (`emptyText`/`btnEmptyText` → `placeholder`, `searchPlaceholderText` → `search`, etc.).
- Clear behavior: Header "Clear" only clears the current selection and keeps the current search query and results visible (dropdown stays open).
- Dropdown selection visuals: no colored backgrounds; selection indicated via trailing icons only.
  - New icon hooks: `icons.checked`, `icons.unchecked` (defaults provided; can be customized).
  - Defensive: do not rely on Bootstrap's `.active` class for coloring.
- UI polish: removed remaining blue background flash on click by rendering items with neutral classes and stripping `.active`.
- API/behavior fix: `updateOptions({ selected: ... })` now applies the provided selection instead of restoring the previous one.
- Multiple mode: selected chips inside the button are rendered in alphabetical order by their visible text (fallback to `id`).

#### [1.1.0] - 2025-12-11

- Added multiple selection UX improvements:
  - Selected items can be removed directly in the button via a small “x” control (uses Bootstrap Icons `bi-x`).
  - Layout control for multiple selection via `showMultipleAsList`:
    - `true` (default): vertical stack
    - `false`: floating/wrapping layout (`flex-wrap`) inside the button
- Unified rendering pipeline:
  - Both dropdown items and the button content use the same formatter (`formatItem`).
  - Server-provided `formatted` HTML (if present) is used with precedence over `formatItem` (applies to dropdown and button, single and multiple).
- Header actions reworked (ambiguous “x” removed):
  - Configurable actions via `headerActionMode: 'clear' | 'close' | 'both' | 'none'`.
  - Default Clear icon switched to trash (`bi bi-trash`).
  - Icon-only by default (`showHeaderActionText: false`).
- Behavior fixes and accessibility:
  - Removing items via the small “x” no longer opens the dropdown; pointer and keyboard events are suppressed correctly.
  - Outside click reliably closes the dropdown even with manual toggle control.
  - Single-select: selecting an item immediately updates `.active` and closes the dropdown.
- Data handling:
  - Multiple mode stores and submits values as arrays (e.g., `value[]`); the hidden input value is an array.
  - Option `emptyText` renamed to `btnEmptyText` (legacy alias still accepted).
- Demo and docs:
  - Demo updated to include Bootstrap Icons and showcase header trash icon and multiple selection layout.
  - README revised to document new options, unified rendering, and server `formatted` precedence.

#### [1.0.x]

- Initial public iterations with server-backed suggestions, grouping, basic multiple selection and methods (`val`, `refresh`, `destroy`, `updateOptions`, `setDisabled`).

[1.1.0]: https://github.com/webcito/jquery-select-suggest/compare/v1.0.17...v1.1.0
[1.1.1]: https://github.com/webcito/jquery-select-suggest/compare/v1.1.0...v1.1.1
