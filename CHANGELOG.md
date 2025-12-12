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

#### [1.1.2] - 2025-12-12

- Translations schema simplified and renamed for clarity:
  - New keys: `translations = { search, placeholder, waiting, typing, loading, clear, close }`.
  - Backward compatibility: old keys are mapped automatically:
    - `emptyText`/`btnEmptyText` → `placeholder`
    - `searchPlaceholderText` → `search`
    - `waitingForTypingText` → `waiting`
    - `typingText` → `typing`
    - `loadingText` → `loading`
    - `headerClearText` → `clear`
    - `headerCloseText` → `close`
- Behavior: Header "Clear" now only clears the selection and keeps the current search input and result list visible (dropdown stays open).
- Demo updated to the new translations keys.
- Docs updated (README) to reflect the new schema and behavior.

[1.1.2]: https://github.com/webcito/jquery-select-suggest/compare/v1.1.1...v1.1.2

#### [1.1.3] - 2025-12-12

- Dropdown selection visuals simplified and modernized:
  - Removed colored background/text changes for selected items in the dropdown list.
  - Introduced two new icon hooks: `icons.checked` and `icons.unchecked` to indicate selection state.
  - Each dropdown item now shows a trailing icon that toggles between checked/unchecked; `aria-selected` is updated accordingly.
- API:
  - `icons` now supports `{ remove, clear, close, checked, unchecked }`.
  - No breaking changes; defaults are provided when not set.
- Behavior:
  - Clear action continues to clear only the selection and keeps search/results intact; icons update accordingly.
- Docs & Demo:
  - README updated to document new icons and the no-background selection design.
  - Demo initialization shows how to provide `checked`/`unchecked` icons.

[1.1.3]: https://github.com/webcito/jquery-select-suggest/compare/v1.1.2...v1.1.3

#### [1.1.4] - 2025-12-12

- Fix: Removed the remaining blue background flash when clicking items in the dropdown.
  - Anchors now include `bg-transparent text-reset` to neutralize Bootstrap's default :active/hover background without custom CSS.
  - Defensive: strip `.active` from items and rely on a logic-only class `.is-active` plus checked/unchecked icons.
- No API changes.
- Docs: Version bump only.

[1.1.4]: https://github.com/webcito/jquery-select-suggest/compare/v1.1.3...v1.1.4

#### [1.1.5] - 2025-12-12

- Fix: `updateOptions` now respects the provided `selected` option instead of preserving the previous selection.
  - When calling `$('...').suggest('updateOptions', { selected: ... })`, the widget refreshes without restoring the prior value and hydrates the new `selected` via backend resolution (single and multiple).
  - Calling `updateOptions` without `selected` continues to preserve the current selection.
- Internal change: `refresh($input, preserveSelection = true)` added; `updateOptions` passes `preserveSelection = false` only when `params` contains `selected`.

[1.1.5]: https://github.com/webcito/jquery-select-suggest/compare/v1.1.4...v1.1.5
