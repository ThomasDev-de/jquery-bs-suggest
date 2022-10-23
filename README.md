# jquery-selectSuggest

Creates a simple bootstrap dropdown for large datasets from the server.
### Requirements
- PHP >= 8.0
- Boostrap >= 5.0
- jQuery 3.6
### Installation
Simply include the following script at the end of the body tag
```html
<script src="jquery.bsSelectSuggest.js"></script>
```
### Usage
##### html
```html
<input required type="hidden"
       data-bs-toggle="suggest"
       data-bs-target="path/to/actions.php"
>
```
##### javascript
```js
$('[data-bs-toggle="suggest"]').each(function(i, input){
    $(input).suggest(options);
});
```
### Options
```json
{
    "dark": false,
    "style": "primary",
    "emptyText": "Bitte wählen.."
}
```

# Documentation incomplete!