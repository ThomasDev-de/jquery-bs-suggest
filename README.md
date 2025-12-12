# jquery-selectSuggest

Create a Bootstrap-powered jQuery dropdown for server-side suggestions (typeahead with selectable items). Works with a simple HTTP endpoint returning JSON.

![demo picture](./demo/selectSuggest-Demo.png)

### Table of contents
- [Overview](#overview)
- [Stack and requirements](#stack-and-requirements)
- [Installation (CDN and self-hosted)](#installation-cdn-and-self-hosted)
- [Installation via Composer](#installation-via-composer)
- [Usage](#usage)
  - [html](#html)
  - [javascript](#javascript)
- [Options](#options)
- [Methods](#methods)
- [Events](#events)
- [Required response for suggestion](#required-response-for-suggestion)
- [Backend example](#backend-example)
- [Examples for multiple display](#examples-for-multiple-display)
- [Scripts](#scripts)
- [Environment variables](#environment-variables)
- [Run the demo locally](#run-the-demo-locally)
- [Tests](#tests)
- [Project structure](#project-structure)
- [License](#license)
- [Changelog](#changelog)

### Overview
`jquery-selectSuggest` enhances a text input to fetch and display suggestions from your backend and lets users pick one or many items. It ships as a single jQuery plugin with no custom CSS — it reuses Bootstrap utilities and components.

### Stack and requirements
- Language: JavaScript (jQuery plugin)
- UI framework: Bootstrap
  - Recommended: Bootstrap 5.x
  - Note: Bootstrap 4 may work, but is not actively verified here. TODO: confirm Bootstrap 4 compatibility.
- jQuery: developed and tested with 3.6.x (earlier versions not verified)
- Optional: Bootstrap Icons (for the small remove "x" inside the widget)
- Demo backend: PHP 8.0+ (only required for the example in `demo/`)

### Installation (CDN and self-hosted)
No additional CSS is required; Bootstrap classes are used.

CDN example (Bootstrap 5 + jQuery + optional Bootstrap Icons):
```html
<!-- Bootstrap 5 CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
<!-- Optional: Bootstrap Icons -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">

<!-- jQuery (3.6+) -->
<script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<!-- Bootstrap 5 JS (depends on Popper, included) -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

<!-- Plugin (self-hosted build) -->
<script src="/dist/jquery.bsSelectSuggest.min.js"></script>
```

CDN for the plugin itself:
- TODO: Publish the plugin to a public CDN (e.g., jsDelivr/unpkg via npm or jsDelivr GitHub). Once available, reference it here instead of `/dist/...`.

Self-hosted (no CDN):
```html
<link rel="stylesheet" href="/path/to/bootstrap.min.css">
<script src="/path/to/jquery.min.js"></script>
<script src="/path/to/bootstrap.bundle.min.js"></script>
<script src="/dist/jquery.bsSelectSuggest.min.js"></script>
```

### Installation via Composer
Composer is not required to use the plugin in the browser. The JavaScript you need lives in `dist/`. In this repository, Composer is primarily used for the PHP demo to fetch Bootstrap and jQuery into `vendor/` (see “Run the demo locally”).

If you still want to manage this plugin in a PHP project via Composer, you have two options:

1) Packagist (when available)
- TODO: Publish the package to Packagist.
- Expected package name (per `composer.json`): `webcito/jquery-select-suggest`.
- Once published, install with:
```bash
composer require webcito/jquery-select-suggest
```
- After installation, copy or symlink the browser assets from `vendor/webcito/jquery-select-suggest/dist/` into your public web directory and include them in your HTML:
```html
<script src="/public/path/to/vendor/webcito/jquery-select-suggest/dist/jquery.bsSelectSuggest.min.js"></script>
```

2) VCS repository (use this Git repo directly)
- Add a VCS repository entry to your project’s `composer.json` and require the package by name:
```json
{
  "repositories": [
    {
      "type": "vcs",
      "url": "https://github.com/REPO_OWNER/jquery-bs-suggest"
    }
  ],
  "require": {
    "webcito/jquery-select-suggest": "^1.1"
  }
}
```
Replace `https://github.com/REPO_OWNER/jquery-bs-suggest` with the actual Git repository URL of this project.
- Then run:
```bash
composer update webcito/jquery-select-suggest
```
- As with Packagist, include the built file from `vendor/webcito/jquery-select-suggest/dist/` in your HTML.

Notes
- Composer does not automatically wire front-end assets. You must publish/copy/symlink the files in `dist/` to a web-accessible location (or reference them directly from your server’s vendor path if appropriate).
- If you do not want Composer at all, simply copy `dist/jquery.bsSelectSuggest.min.js` into your project and include it as shown in Installation above.

### Usage
##### html
Place the input field where you want the dropdown to appear.
```html
<input type="text"
       id="exampleInput"
       data-bs-toggle="suggest"
       data-bs-target="path/to/actions.php"
>
```
##### javascript
```js
$('[data-bs-toggle="suggest"]').suggest(options);
```
Quick start example (full page):
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <title>selectSuggest demo</title>
  </head>
  <body class="p-3">
    <input type="text" id="exampleInput" data-bs-toggle="suggest" data-bs-target="/demo/actions.php">

    <script src="https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="/dist/jquery.bsSelectSuggest.min.js"></script>
    <script>
      $(function(){
        $('#exampleInput').suggest({ limit: 10, multiple: false });
      });
    </script>
  </body>
  </html>
```
### Options

Minimal, clear options grouped by purpose.
```js
let options = {
  // Behavior
  limit: 10,                 // max number of records per request
  loadDataOnShow: true,      // load first page on open
  typingInterval: 400,       // debounce between keyup and request
  multiple: false,           // allow multiple selection
  selected: null,            // preselection on init; single: scalar, multiple: array of ids

  // Button
  btnWidth: 'fit-content',   // CSS width value for the trigger button
  btnClass: 'btn btn-outline-secondary',

  // UI texts (translations) — compact schema since 1.1.1
  translations: {
    search: 'Search',
    placeholder: 'Please choose..',            // alias: emptyText/btnEmptyText (deprecated)
    waiting: 'Waiting for typing',
    typing: 'typing..',
    loading: 'Loading..',
    clear: 'Clear',
    close: 'Close'
  },

  // Icons (HTML strings)
  icons: {
    remove: '<i class="bi bi-x"></i>',
    clear:  '<i class="bi bi-trash"></i>',
    close:  '<i class="bi bi-x-lg"></i>',
    // New in 1.1.1: dropdown selection indicators (no colored backgrounds)
    checked: '<i class="bi bi-check2"></i>',
    unchecked: '<i class="bi bi-circle"></i>'
  },

  // Data shaping
  queryParams: function(params){ return params; },

  // Rendering (suggestion list)
  formatItem: function(item){
    // Default renderer (you can override). For rich content the server may provide item.formatted.
    const sub = item.subtext ? `<div class="small opacity-75 mt-1">${item.subtext}</div>` : '';
    return `<div class="w-100 rounded-2 px-2 py-1"><div class="fw-semibold">${item.text}</div>${sub}</div>`;
  },

  // Header action labels next to icons (off by default)
  showHeaderActionText: false
}
```
Notes:
- Legacy names are still accepted and mapped internally to the new schema:
  - `emptyText`/`btnEmptyText` → `translations.placeholder`
  - `searchPlaceholderText` → `translations.search`
  - `waitingForTypingText` → `translations.waiting`
  - `typingText` → `translations.typing`
  - `loadingText` → `translations.loading`
  - `headerClearText` → `translations.clear`
  - `headerCloseText` → `translations.close`
- In `multiple: true` mode, the hidden input value is an array. For form submissions, use a field name with brackets, e.g. `name="country_id[]"` to receive an array server‑side.

Preselection with `selected`:
- If `selected` is defined and not null/empty, the plugin will immediately resolve those ids via the backend and set the selection on init (no `change` event is fired for this initial hydrate).
- Single select: pass a scalar (string/number). Example: `selected: 1`.
- Multiple select: pass an array of ids (strings/numbers). Example: `selected: [1, 3]`.

Rendering model:
- Suggestion list items use `formatItem(item)` (or the server‑provided `formatted` HTML when present) to render rich content.
- Button content:
  - Single select (`multiple: false`): renders rich HTML too. Preference order: `item.formatted` (when provided) → `options.formatItem(item)` (when provided) → the built‑in `formatItem(item)`. No inline remove control in single mode.
  - Multiple select (`multiple: true`): shows neutral, border‑only chips for each selected item, with an inline remove control per item. Chips are text‑only; they do not use `formatItem`.
- The built‑in default `formatItem` renders a modern, clean chip/tile with optional subtext (using only Bootstrap 5 utility classes). Override `formatItem` to control the suggestion list appearance; in single mode this will also affect the button when no `formatted` field is provided by the server.

Styling and theme compatibility:
- The dropdown uses only Bootstrap utility classes; no custom CSS and no styling options are required. It respects light/dark themes and different button variants.
- Selected items in the dropdown menu no longer rely on colored backgrounds; instead, a trailing icon indicates state (`icons.checked`/`icons.unchecked`).

Multiple button layout:
- `showMultipleAsList` (boolean): Controls how selected items are laid out inside the button when `multiple: true`.
  - `true` (default): vertical stack (`d-flex flex-column align-items-start`).
  - `false`: floating/wrapping layout (`d-flex flex-wrap align-items-center gap-1`). The plugin also relaxes some block utilities (e.g. converts `w-100` to `w-auto`) for a tighter inline look.

Dropdown header actions (to avoid ambiguous "x"):
- The header shows Clear and Close actions by default (icons only). You can customize labels via `translations.clear` and `translations.close`, and toggle labels via `showHeaderActionText`.
  - Behavior:
  - Clear resets only the current selection and keeps the current search and results list intact (dropdown stays open).
  - Close hides the dropdown.
  - Keyboard: Enter/Space on these buttons trigger the respective action.
  - Backward compatibility: the previous `.js-webcito-reset` control maps to Clear.

Removal from selection (multiple mode):
- Each selected item shown in the button includes a small remove control ("x"). The inline remove is only present in `multiple: true` and is hidden when the widget is disabled.
- Clicking it removes that item from the selection, updates the hidden input array, re-renders the button, syncs the active state in the dropdown, and triggers `change.bs.suggest` with `([ids], [items])`.
- For best visuals, include Bootstrap Icons:
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  ```

Deprecated (backward compatibility):
- `multipleBadgeClass`, `formatBadge` are deprecated and ignored — use `formatItem`.
- Removed/cleaned options: `menuClass`, `density`, `menuMaxHeight`, `showCheckmark`, `checkIconHtml`, `highlightQuery`, `headerClass`, `searchInputClass`, `itemClass`, `activeItemClass`, `headerActionMode`.
  - If `debug: true`, the plugin logs a warning when any of these are provided. Use `icons` for icon customization, `translations` for texts, and `formatItem` for list content.
 
### Methods
```js
$('selector')
    .suggest('val', value) // set a value
    .suggest('refresh')  // build the dropdown new
    .suggest('destroy')  // destroy the dropdown
    .suggest('updateOptions', newOptions)  // update options
    .suggest('setDisabled', true|false);  // toggle disable class
```
### Events
```js
$('selector')
    .on('change', function(e, a, b){
        // Single select: a = id, b = text
        // Multiple select: a = array of ids, b = array of full item objects
        console.log('change', a, b);
    })
    .on('error', function(e, message){
        console.log('error', message);
    })
```
### Required response for suggestion
The parameters `q` and `limit` are sent to the server via `GET`.
`q` is in this case the search string and `limit` the maximum number of records to be determined.
As response the plugin expects an `array` with `items` and the `total` number of records.  
An item consists of the attributes `id` and `text`.
Optionally you can provide:
- `subtext` (string) — a secondary line that the default renderer shows smaller below the main text (suggestion list only).
- `formatted` (string, HTML) — if present and non-empty, the plugin will render this HTML directly in the suggestion list, bypassing `formatItem`. In single select mode the button also prefers `formatted`; in multiple mode the button uses text‑only chips and ignores `formatted`.
```json
{
  "items": [
    { "id": 1, "text": "Germany", "subtext": "EU, Schengen" },
    { "id": 2, "text": "Spain" },
    { "id": 3, "text": "Italy", "formatted": "<div class=\"w-100 px-2 py-1\"><div class=\"fw-semibold\">Italy</div><div class=\"small opacity-75 mt-1\">Population ~60M</div></div>" }
  ],
  "total": 75
}
```
When the method `val` is called, only the parameter `value` is sent to the server.  
For single select the server should return a single item object.  
For multiple select the server will send `value[]` as an array of IDs (jQuery serializes arrays like this) and expects an array in `items`.
The optional fields `subtext` and `formatted` are supported here as well — if `formatted` is provided, it is used directly for the suggestion list. In single select mode, the button also prefers `formatted`/`formatItem`; in multiple mode the button uses text‑only chips.
```json
{ "id": 1, "text": "Germany", "formatted": "<strong>Germany</strong>" }
```
```json
{ "items": [ {"id": 1, "text": "Germany"}, {"id": 3, "text": "Italy", "formatted": "<em>Italy</em>"} ] }
```

### backend example
A complete example can be found in the demo folder.
```php
<?php
/**
 * Note: PHP8.0 or higher is required for this script.
 */
header('Content-Type: application/json');

try {
    // Fetch a test data set
    /** @var stdClass[] $countries */
    $countries = json_decode(file_get_contents('countries.json'), false, 512, JSON_THROW_ON_ERROR);

    // Try to find the query parameter value (supports both value and value[])
    $value = filter_input(INPUT_GET, 'value');
    $valueArray = filter_input(INPUT_GET, 'value', FILTER_DEFAULT, FILTER_REQUIRE_ARRAY);

    /** @var null|stdClass|array $return */
    $return = null;

    // Was a single value found?
    $fetchSingleData = isset($value) && $value !== '' && ! is_array($valueArray);

    // if yes
    if ($fetchSingleData)
    {
        // Get the record using the value parameter
        $intVal = (int) $value;
        $data = array_values(array_filter($countries, static function($country) use ($intVal){
            return $country->id === $intVal;
        }));
        $return = $data[0] ?? null;
    }
    // if no
    else
    {
        // Get parameter q and limit (and optionally an array of IDs for multiple)
        $limit = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT);
        $q = filter_input(INPUT_GET, 'q');
        $search = empty($q)? false : strtolower($q);

        // If q was not passed or is empty, do not return any results either.
        // Otherwise, search for matches of the search string.
        $data = array_slice(
            array:array_values(array_filter($countries, static function($country) use ($search){
                return $search === false || str_contains(strtolower($country->text), $search);
            })),
            offset: 0,
            length: $limit
        );

        // If value[] (multiple mode) was passed, resolve by ids
        if (is_array($valueArray)) {
            $ids = array_map('intval', $valueArray);
            $data = array_values(array_filter($countries, static function($country) use ($ids){
                return in_array($country->id, $ids, true);
            }));
        }

        // Put the result in the response
        $return['items'] = $data;
        $return['total'] = count($countries);
    }
    // Return as JSON
    http_response_code(200);
    exit(json_encode($return, JSON_THROW_ON_ERROR));
} catch (JsonException $e) {
    http_response_code(500);
    exit(json_encode(['error' => $e->getMessage()], JSON_THROW_ON_ERROR));
}


```

### Examples for multiple display
Using modern chips/tiles (default rendering):
```js
$('#example').suggest({
  multiple: true
  // default formatItem produces a subtle chip/tile per item
});
```

Using custom layout via `formatItem` (applies to the suggestion list and also to the single‑select button when no `formatted` is provided by the server):
```js
$('#example').suggest({
  multiple: true,
  formatItem(item){
    // If server provides `formatted`, the plugin uses it automatically.
    // This fallback runs only when `formatted` is not provided.
    const sub = item.subtext ? `<div class="small text-muted mt-1">${item.subtext}</div>` : '';
    return `<div class="w-100 px-2 py-1">${item.text}${sub}</div>`;
  }
});
```

### Scripts
- This repository ships prebuilt files in `dist/`.
- No build step or package.json scripts are provided. TODO: add a build pipeline if source files are added in the future.

Package manager notes:
- The repo contains a `composer.json` used only for the PHP demo to fetch Bootstrap and jQuery assets under `vendor/`. It is NOT required to use the plugin in a browser project.

### Environment variables
- None required by the plugin.
- The PHP demo in `demo/` does not use environment variables.

### Run the demo locally
There are two ways to try the demo in `demo/`:

1) Use the included Composer setup (fetches Bootstrap and jQuery into `vendor/` as referenced by the demo HTML):
```
composer install
php -S 127.0.0.1:8000 -t demo
# then open http://127.0.0.1:8000 in your browser
```

2) Or open the demo with CDN assets by modifying the `<link>`/`<script>` tags in `demo/index.html` to use the CDN URLs shown in the Installation section.

### Project structure
- `dist/jquery.bsSelectSuggest.js` — unminified plugin
- `dist/jquery.bsSelectSuggest.min.js` — minified plugin
- `demo/` — HTML + PHP demo and sample data
- `CHANGELOG.md` — changes per version
- `LICENSE` — MIT license
- `composer.json` — optional PHP dependencies for the demo; not required for browser use

### Tests
- No automated tests are included. TODO: add basic integration tests (e.g., Cypress) and unit tests for client logic if a build system is introduced.

### License
This project is licensed under the MIT License — see `LICENSE` for details.

### Changelog

See `CHANGELOG.md` for a detailed list of changes. Current version: 1.1.1 (2025-12-12).
