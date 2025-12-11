# jquery-selectSuggest

Create a Bootstrap dropdown for server suggestion.

### Table of contents
- [jquery-selectSuggest](#jquery-selectsuggest)
    + [Requirements](#requirements)
    + [Installation](#installation)
    + [Usage](#usage)
        * [html](#html)
        * [javascript](#javascript)
    + [Options](#options)
    + [Methods](#methods)
    + [Events](#events)
    + [Required response for suggestion](#required-response-for-suggestion)
    + [backend example](#backend-example)
    + [Changelog](#changelog)

![demo picture](./demo/selectSuggest-Demo.png)

### Requirements
- Boostrap >= 5.0
- jQuery 3.6 -> I can't name the minimum jQuery version, I developed it on jQuery 3.6.
 - Optional: Bootstrap Icons (for the small "x" remove icons inside the widget)
### Installation
Simply include the following script at the end of the body tag.
```html
<script src="/dist/jquery.bsSelectSuggest.js"></script>
```
No further CSS needed, the current bootstrap classes are used.

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
### Options

The following options are currently implemented.
```js
let options = {
    "limit": 10, // the maximum number of records
    "loadDataOnShow": true, // Shows the first entries based on limit
    "typingInterval": 400, // The milliseconds to wait until a request starts
    "multiple": false, // allow selecting multiple items
    "btnWidth": 'fit-content', // Corresponds to the CSS property width
    "btnClass": "btn btn-outline-secondary", // dropdown button class
    "btnEmptyText": "Please choose..", // placeholder for no selection (alias: emptyText)
    "searchPlaceholderText": "Search", // placeholder for search input
    "waitingForTypingText": "Waiting for typing", // Status
    "typingText": "typing..", // Status
    "loadingText": "Loading..", // Status
    "queryParams": function(params){return params} // add params to query
}
```
Notes:
- Legacy option name `emptyText` is still accepted and maps to `btnEmptyText`.
- In `multiple: true` mode, the hidden input value is an array. For form submissions, use a field name with brackets, e.g. `name="country_id[]"` to receive an array server‑side.

Rendering model:
- Both the dropdown options and the button content use the same rendering function `formatItem(item)`.
- The built‑in default `formatItem` renders a modern, clean chip/tile with optional subtext (using only Bootstrap 5 utility classes). Override `formatItem` to fully control the HTML (e.g., plain text, list tiles, icons, subtext, etc.).

Multiple button layout:
- `showMultipleAsList` (boolean): Controls how selected items are laid out inside the button when `multiple: true`.
  - `true` (default): vertical stack (`d-flex flex-column align-items-start`).
  - `false`: floating/wrapping layout (`d-flex flex-wrap align-items-center gap-1`). The plugin also relaxes some block utilities (e.g. converts `w-100` to `w-auto`) for a tighter inline look.

Dropdown header actions (to avoid ambiguous "x"):
- You can control whether the header shows a Clear and/or Close action.
- Options:
  - `headerActionMode`: `'clear' | 'close' | 'both' | 'none'` (default: `'clear'`)
  - `headerClearIconClass`: icon class for Clear (default: `'bi bi-trash'`)
  - `headerCloseIconClass`: icon class for Close (default: `'bi bi-x-lg'`)
  - `headerClearText`: accessible label/text for Clear (default: `'Clear'`)
  - `headerCloseText`: accessible label/text for Close (default: `'Close'`)
  - `showHeaderActionText`: show text label next to icons (default: `false`)
- Behavior:
  - Clear resets current selection and search results, keeps the dropdown open.
  - Close hides the dropdown.
  - Keyboard: Enter/Space on these buttons trigger the respective action.
  - Backward compatibility: the previous `.js-webcito-reset` control maps to Clear.
  - Default is icon-only (no text label) to avoid multilingual UI. If you prefer labels, set `showHeaderActionText: true` and customize `headerClearText`/`headerCloseText`.

Removal from selection (multiple mode):
- Each selected item shown in the button includes a small remove control ("x").
- Clicking it removes that item from the selection, updates the hidden input array, re-renders the button, syncs the active state in the dropdown, and triggers `change.bs.suggest` with `([ids], [items])`.
- For best visuals, include Bootstrap Icons:
  ```html
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
  ```

Deprecated (backward compatibility):
- `multipleBadgeClass`, `formatBadge` are deprecated and ignored. Use `formatItem` to control appearance. In `debug: true` the plugin logs a deprecation warning if these are passed.
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
- `subtext` (string) — a secondary line that the default renderer shows smaller below the main text.
- `formatted` (string, HTML) — if present and non-empty, the plugin will render this HTML directly (in both dropdown and button), bypassing `formatItem`.
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
The optional fields `subtext` and `formatted` are supported here as well — if `formatted` is provided, it is used directly for rendering.
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

Using custom layout via `formatItem` (same for dropdown and button):
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

### Changelog

See `CHANGELOG.md` for a detailed list of changes. Current version: 1.1.0 (2025-12-11).
