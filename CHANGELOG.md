### Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog, and the versioning follows SemVer.

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
