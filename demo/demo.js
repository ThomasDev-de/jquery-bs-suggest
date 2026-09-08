/* global jQuery, bootstrap */
(function ($) {
    'use strict';

    function escapeHtml(value) {
        return $('<span>').text(String(value ?? '')).html();
    }

    const examples = [
        {
            id: 'single', section: 'selection', title: 'Select a country',
            description: 'The standard form field: search, select, done. The field value contains a single ID.',
            label: 'Shipping country', options: { multiple: false },
            hint: 'Open the dropdown to browse, or search for “Germany”.'
        },
        {
            id: 'multiple', section: 'selection', title: 'Multiple values as chips',
            description: 'A compact selection for multiple markets. Remove individual countries directly from their chips.',
            label: 'Active markets', options: { multiple: true, showMultipleAsList: false, selected: [1, 8, 17] },
            hint: 'IDs are stored as a comma-separated field value.'
        },
        {
            id: 'stacked', section: 'selection', title: 'Multiple values as a list',
            description: 'The same multiple selection in a vertical layout. Useful when labels need more room.',
            label: 'Available shipping destinations', options: { multiple: true, showMultipleAsList: true, selected: [12, 27], multipleSeparator: ';' },
            hint: 'Here, a semicolon separates the IDs: multipleSeparator: ";".'
        },
        {
            id: 'preselected', section: 'selection', title: 'Load an existing selection',
            description: 'For editing an existing record: a known ID is resolved through the backend on initialization.',
            label: 'Company location', options: { selected: 5 },
            hint: 'selected: 5 loads Switzerland. Initial hydration does not trigger a change event.'
        },
        {
            id: 'renderer', section: 'presentation', title: 'Custom rendering',
            description: 'formatItem renders results and the single selection. Here, a simple ID label accompanies the country name.',
            label: 'Target market', options: {
                selected: 1,
                formatItem: function (item) {
                    const text = $('<span>').text(item.text).html();
                    return `<div class="d-flex align-items-center gap-3 py-1"><span class="border rounded px-2 py-1 small text-body-secondary">${Number(item.id)}</span><span class="fw-semibold">${text}</span></div>`;
                }
            },
            hint: 'This endpoint omits the formatted field so that formatItem is used.'
        },
        {
            id: 'grouped', section: 'presentation', title: 'Groups & backend HTML',
            description: 'Continents organize the results. The backend supplies the markup through the formatted field.',
            label: 'International location', endpoint: './examples.php?grouped=1&rich=1',
            options: { limit: 60, selected: 27 },
            hint: 'group defines the heading. formatted takes precedence over formatItem.'
        },
        {
            id: 'translations', section: 'presentation', title: 'Labels & actions',
            description: 'Custom text, labeled actions, and alternative selection icons without additional plugin CSS.',
            label: 'Country selection', options: {
                multiple: false, showHeaderActionText: true,
                translations: {
                    search: 'Search countries', placeholder: 'Select a country', waiting: 'Enter a search term',
                    typing: 'Typing …', loading: 'Loading countries …', clear: 'Clear', close: 'Close',
                    results: function (count, total) { return `${count} of ${total} countries`; }
                },
                icons: { checked: '<i class="bi bi-check-circle-fill"></i>', unchecked: '<i class="bi bi-circle"></i>' }
            },
            hint: 'For full localization, ready-to-use language files are available under dist/locale/.'
        },
        {
            id: 'lazy', section: 'search', title: 'Search as you type',
            description: 'Opening the dropdown sends no request. After typing, the search waits 600 ms and returns up to five results.',
            label: 'Search countries', options: { loadDataOnShow: false, typingInterval: 600, limit: 5 },
            hint: 'Try typing “un”. Enter “zzzz” to see the empty result state.'
        },
        {
            id: 'filtered', section: 'search', title: 'Filter requests',
            description: 'queryParams adds a fixed filter to each request. This field only offers European countries.',
            label: 'European location', options: {
                limit: 8,
                queryParams: function (params) { return { ...params, region: 'Europe' }; }
            },
            hint: '“Australia” returns no results here. The filter also applies when resolving IDs.'
        },
        {
            id: 'native', section: 'integration', title: 'A native form field',
            description: 'A native select multiple submits several values under the same field name.',
            label: 'Export markets', native: true,
            options: { multiple: true, selected: [1, 2] },
            hint: 'Submitting stays on this page. The preview shows the actual form values.'
        },
        {
            id: 'methods', section: 'integration', title: 'Try the API',
            description: 'Set values, change the appearance, disable the widget, or destroy and initialize it again.',
            label: 'Managed selection', options: { multiple: true, selected: [1, 3] },
            hint: 'Changes and method calls appear directly below the buttons.'
        }
    ];
    const sections = [
        { id: 'selection', title: 'Selection', subtitle: 'Single, multiple, and existing values' },
        { id: 'presentation', title: 'Presentation', subtitle: 'Customize content and controls' },
        { id: 'search', title: 'Search & data', subtitle: 'Control requests and results' },
        { id: 'integration', title: 'Forms & API', subtitle: 'Integrate into your application' }
    ];
    const common = { btnWidth: '100%', btnClass: 'btn btn-outline-secondary', limit: 12 };
    const instances = new Map();

    // Keep function-valued options intact in the copyable initialization snippet.
    function source(value, depth = 0) {
        if (typeof value === 'function') return value.toString();
        if (Array.isArray(value)) return JSON.stringify(value);
        if (value && typeof value === 'object') {
            const indent = '  '.repeat(depth + 1);
            return '{\n' + Object.entries(value).map(([key, val]) => indent + key + ': ' + source(val, depth + 1)).join(',\n') + '\n' + '  '.repeat(depth) + '}';
        }
        return JSON.stringify(value);
    }
    function fieldMarkup(example) {
        const id = `demo-${example.id}`;
        const endpoint = example.endpoint || './examples.php';
        return example.native
            ? `<select id="${id}" name="countries[]" multiple class="form-select" data-bs-target="${endpoint}" aria-label="${example.label}"></select>`
            : `<input id="${id}" type="text" name="${example.id}" class="form-control" data-bs-target="${endpoint}" aria-label="${example.label}">`;
    }
    function snippet(example) {
        let result = fieldMarkup(example) + '\n\n' + `$('#demo-${example.id}').suggest(${source({ ...common, ...example.options })});`;
        if (example.native) result = fieldMarkup(example) + '\n\n' + `$.getJSON('./countries.json').done(function (items) {
  const field = $('#demo-native');
  items.forEach(item => {
    field.append(new Option(item.text, item.id));
  });
  field.suggest(${source({ ...common, ...example.options })});
});

// Inside a submit handler with event.preventDefault():
const values = new FormData(event.currentTarget)
  .getAll("countries[]");`;
        if (example.id === 'methods') result += '\n\nconst field = $("#demo-methods");\nfield.suggest("val", [1, 8]);\nfield.suggest("setDisabled", true);\nfield.suggest("setDisabled", false);\nfield.suggest("updateOptions", { btnClass: "btn btn-primary" });\nfield.suggest("refresh");\nfield.suggest("getSelectedText");\nfield.suggest("destroy");\n// Then initialize again with the desired options.';
        return result;
    }
    function renderCard(example, index) {
        const controls = example.id === 'methods' ? `<div class="demo-controls">
            <button type="button" class="btn btn-sm btn-outline-secondary" data-method="value">Set DE + FR</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-method="clear">Clear</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-method="disabled" aria-pressed="false">Disable</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-method="style" aria-pressed="false">Primary style</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-method="refresh">Refresh</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-method="text">Get text</button>
            <button type="button" class="btn btn-sm btn-outline-secondary" data-method="lifecycle">Destroy</button>
            </div><p class="method-log" role="status">Ready. selected: [1, 3]</p>` : '';
        const field = `<label class="field-label" for="demo-${example.id}">${example.label}</label>${fieldMarkup(example)}<p class="field-help">${example.hint}</p>`;
        const preview = example.native ? `<form id="native-form">${field}<div class="demo-controls"><button type="submit" class="btn btn-sm btn-primary">Show form values <i class="bi bi-arrow-right" aria-hidden="true"></i></button></div><pre class="form-result" role="status">Not submitted yet.</pre></form>` : field;
        return `<article class="example-card" id="card-${example.id}" aria-labelledby="title-${example.id}">
            <div class="card-heading"><span class="card-kicker">EXAMPLE ${String(index + 1).padStart(2, '0')}</span><h3 id="title-${example.id}">${example.title}</h3><p class="card-description">${example.description}</p></div>
            <div class="preview">${preview}${controls}<p class="example-error" role="alert" hidden></p></div>
            <div class="value-line"><span>FIELD VALUE</span><output id="value-${example.id}" for="demo-${example.id}">Loading …</output></div>
            <details class="code-panel"><summary>View code</summary><div class="code-content"><button class="copy-code" type="button" aria-label="Copy code for ${example.title}">Copy</button><pre><code>${escapeHtml(snippet(example))}</code></pre></div></details>
        </article>`;
    }
    $('#examples').html(sections.map((section, i) => `<section class="example-section" id="${section.id}" aria-labelledby="heading-${section.id}"><div class="section-heading"><span class="section-number">0${i + 1}</span><h2 id="heading-${section.id}">${section.title}</h2><span class="section-subtitle">${section.subtitle}</span></div><div class="example-grid">${examples.filter(example => example.section === section.id).map(example => renderCard(example, examples.indexOf(example))).join('')}</div></section>`).join(''));

    function syncValues() {
        instances.forEach(({ field, example }) => {
            $(`#value-${example.id}`).text(JSON.stringify(field.val() ?? ''));
        });
    }
    function labelWidget(field, example) {
        const wrapper = field.closest('[id^="webcito_suggestion_"]');
        wrapper.find('.js-suggest-btn').attr('aria-label', example.label);
        wrapper.find('input[type="search"]').attr('aria-label', `${example.label}: search`);
    }
    function initialize(instance, options) {
        instance.field.suggest(options || { ...common, ...instance.example.options });
        labelWidget(instance.field, instance.example);
    }
    examples.forEach(example => {
        const field = $(`#demo-${example.id}`);
        const instance = { field, example };
        instances.set(example.id, instance);
        field.on('change.bs.suggest', function () {
            syncValues();
            $(`#card-${example.id} .example-error`).prop('hidden', true);
            if (example.id === 'methods') $('#card-methods .method-log').text(`change.bs.suggest → ${JSON.stringify(field.val())}`);
        }).on('error.bs.suggest', function () {
            $(`#card-${example.id} .example-error`).text('Could not load data. Please check the PHP server and demo endpoint.').prop('hidden', false);
        });
        if (example.native) {
            $.getJSON('./countries.json').done(function (items) {
                items.forEach(item => field.append(new Option(item.text, item.id)));
                initialize(instance);
            }).fail(function () {
                $('#card-native .example-error').text('Could not load countries for the form.').prop('hidden', false);
            });
        } else {
            initialize(instance);
        }
    });
    syncValues();
    // Initial selected-value hydration intentionally does not emit change.bs.suggest.
    $(document).ajaxComplete(function () { setTimeout(syncValues, 0); });
    $('#native-form').on('submit', function (event) {
        event.preventDefault();
        const values = new FormData(this).getAll('countries[]');
        $(this).find('.form-result').text(JSON.stringify({ 'countries[]': values }, null, 2));
    });

    let disabled = false;
    let primaryStyle = false;
    let destroyed = false;
    $('#card-methods').on('click', '[data-method]', function () {
        const instance = instances.get('methods');
        const field = instance.field;
        const action = this.dataset.method;
        let message = '';
        switch (action) {
            case 'value': field.suggest('val', [1, 8]); message = 'val([1, 8]) requested'; break;
            case 'clear': field.suggest('val', []); message = 'val([])'; break;
            case 'disabled':
                disabled = !disabled;
                field.suggest('setDisabled', disabled);
                $(this).text(disabled ? 'Enable' : 'Disable').attr('aria-pressed', String(disabled));
                message = `setDisabled(${disabled})`; break;
            case 'style':
                primaryStyle = !primaryStyle;
                field.suggest('updateOptions', { btnClass: primaryStyle ? 'btn btn-primary' : common.btnClass });
                $(this).text(primaryStyle ? 'Default style' : 'Primary style').attr('aria-pressed', String(primaryStyle));
                message = 'updateOptions({ btnClass: … })'; break;
            case 'refresh': field.suggest('refresh'); message = 'refresh()'; break;
            case 'text': message = 'getSelectedText() → ' + $('<div>').html(field.suggest('getSelectedText')).text(); break;
            case 'lifecycle':
                if (destroyed) {
                    initialize(instance, { ...common, multiple: true });
                    message = 'suggest(): initialized with the existing field value';
                } else {
                    field.suggest('setDisabled', false);
                    field.suggest('destroy');
                    disabled = false;
                    primaryStyle = false;
                    $('#card-methods [data-method="disabled"]').text('Disable').attr('aria-pressed', 'false');
                    $('#card-methods [data-method="style"]').text('Primary style').attr('aria-pressed', 'false');
                    message = 'destroy(): original input field restored';
                }
                destroyed = !destroyed;
                $(this).text(destroyed ? 'Initialize' : 'Destroy');
                $('#card-methods [data-method]').not(this).prop('disabled', destroyed);
                break;
        }
        labelWidget(field, instance.example);
        $('#card-methods .method-log').text(message);
        syncValues();
    });
    $('#demo-methods').on('input', syncValues);

    $(document).on('click', '.copy-code', async function () {
        const button = this;
        const code = $(button).siblings('pre').text();
        try {
            await navigator.clipboard.writeText(code);
            button.textContent = 'Copied';
        } catch (_) {
            const range = document.createRange();
            range.selectNodeContents($(button).siblings('pre')[0]);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
            button.textContent = 'Ctrl+C / ⌘C';
        }
        setTimeout(() => { button.textContent = 'Copy'; }, 2200);
    });
    // An embedding page may inject a <base> URL. Fragment links must stay in this document.
    $('#example-nav, body > .skip-link').on('click', function (event) {
        const link = $(event.target).closest('a[href^="#"]')[0];
        if (!link) return;
        const target = document.getElementById(link.getAttribute('href').slice(1));
        if (!target) return;
        event.preventDefault();
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
            block: 'start'
        });
    });
    if ('IntersectionObserver' in window) {
        const visible = new Set();
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => entry.isIntersecting ? visible.add(entry.target.id) : visible.delete(entry.target.id));
            const active = sections.find(section => visible.has(section.id));
            if (!active) return;
            $('#example-nav a').removeClass('is-active').removeAttr('aria-current');
            $(`#example-nav a[href="#${active.id}"]`).addClass('is-active').attr('aria-current', 'location');
        }, { rootMargin: '-24px 0px -45% 0px' });
        document.querySelectorAll('.example-section').forEach(section => observer.observe(section));
    }
}(jQuery));
