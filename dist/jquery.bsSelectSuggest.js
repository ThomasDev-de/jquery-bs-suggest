// noinspection DuplicatedCode,JSUnresolvedReference

/** global $ */
(function ($) {

    function generateId() {
        return "webcito_suggestion_" + getGUID();
    }

    /**
     * Generates and returns an HTML template string for a customizable dropdown component.
     *
     * @param {Object} $input - A jQuery object containing configuration settings for the template.
     * @return {string} The generated HTML template string based on the provided settings.
     */
    function getTemplate($input) {
        const disabledClass = $input.prop('disabled') ? 'disabled' : '';
        let settings = $input.data('settings');
        return `
<div class="dropdown">
    <button class="${settings.btnClass} ${disabledClass} d-flex align-items-center" data-toggle="dropdown" data-bs-toggle="dropdown" aria-expanded="false" style="width:${settings.btnWidth}">
        <div class="js-selected-text">${settings.emptyText}</div>
    </button>
    <div class="dropdown-menu p-0 mt-1" style="min-width: 250px">
        <div class="w-100">
            <div class="p-2 d-flex flex-nowrap align-items-center justify-content-between border-bottom">
                <input autocomplete="false" type="search" class="form-control form-control-sm flex-fill" placeholder="${settings.searchPlaceholderText}">
                <button role="button" class="btn btn-light bg-transparent ms-2 js-webcito-reset">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div class="js-suggest-results" style="max-height: 400px; overflow-y: auto;"></div>
            <div class="p-2 p-1 fw-light fst-italic d-flex align-items-center">
                <small class="suggest-status-text">${settings.waitingForTypingText}</small>
            </div>
        </div>
    </div>
</div>`;
    }

    /**
     * Finds the closest ancestor element of the provided select element
     * that has an ID starting with "webcito_suggestion_".
     *
     * @param {object} $input - The select element for which to find the closest matching ancestor.
     * @returns {object|null} - The closest ancestor element with an ID starting with "webcito_suggestion_",
     * or null if no such element is found.
     */
    function getWrapper($input) {
        return $input.closest('[id^="webcito_suggestion_"]');
    }

    /**
     * Builds a custom dropdown by wrapping the provided select element.
     *
     * @param {object} $input - The jQuery object representing the select element to be wrapped.
     * @return {object} - The jQuery object representing the newly created dropdown wrapper.
     */
    function buildDropdown($input) {

        let w = getWrapper($input);
        if (w.length === 1) {
            return w;
        }

        const id = generateId();
        const wrap = $('<div>', {
            id: id
        }).insertAfter($input);


        $input.appendTo(wrap);
        const template = getTemplate($input);
        $(template).prependTo(wrap);
        if (wrap.find('.js-selected-text').text() === "") {
            setDropdownText($input, null);
        }
        return wrap;

    }

    /**
     * Refreshes the given selectable element by reapplying its settings.
     *
     * @param {Object} $input - The selectable element to be refreshed, which should contain a 'settings' data property.
     * @return {void}
     */
    function refresh($input) {
        const settings = $input.data('settings');
        destroy($input, false);
        $input.suggest(settings);
    }

    /**
     * Destroys the suggested feature on the given select element, restoring its original state.
     *
     * @param {object} $input - The jQuery object representing the select element to destroy the suggested feature on.
     * @param {boolean} show - A boolean value indicating whether to show the select element after destruction.
     * @return {void} - This function does not return any value.
     */
    function destroy($input, show) {
        let valBefore = $input.val();
        const inputTypeBefore = $input.data('typeBefore');
        let wrapper = getWrapper($input);

        $input.val(valBefore);
        $input.insertBefore(wrapper);
        wrapper.remove();

        $input.removeClass('js-suggest');
        $input.removeData('settings');
        $input.removeData('selected');
        $input.removeData('initSuggest');

        if (show) {
            $input.attr('type', inputTypeBefore);
        }
    }

    /**
     * Updates the text of a dropdown element.
     *
     * @param {object} $input - jQuery object representing the input element.
     * @param {object|null} item - The HTML content to set as the dropdown text.
     * @return {void}
     */
    function setDropdownText($input, item = null) {

        const wrapper = getWrapper($input);
        const settings = $input.data('settings');
        if (settings.debug) {
            console.log('setDropdownText', item, wrapper, settings);
        }

        let html = '';
        if (item !== null) {
            if (typeof settings.formatItem === 'function') {
                html = settings.formatItem(item);
            } else {
                html = formatItem(item);
            }
        }
        const formatted = item === null ?
            '<div class="d-flex flex-column align-items-start">' + settings.emptyText + '</div>'
            : '<div class="d-flex flex-column align-items-start">' + html + '</div>';

        wrapper.find('.js-selected-text').html(formatted);
    }

    /**
     * Generates a globally unique identifier (GUID) string.
     *
     * @return {string} A random GUID string.
     */
    function getGUID() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    /**
     * Resets the selected element's state by clearing its value, search box content, and suggestion list.
     *
     * @param {object} $input - The jQuery object representing the select element to be reset.
     * @return {void}
     */
    function reset($input) {
        const settings = $input.data('settings');
        const wrapper = getWrapper($input);
        const searchBox = wrapper.find('[type="search"]');
        const list = wrapper.find('.js-suggest-results');

        $input.val(null);
        searchBox.val(null);
        list.empty();
        setStatus($input, settings.waitingForTypingText);
    }

    /**
     * Updates the status text of a given select element.
     *
     * @param {object} $input - The select element whose status needs to be updated.
     * @param {string} text - The text to be set as the status.
     * @return {void}
     */
    function setStatus($input, text) {
        const wrapper = getWrapper($input);
        const statusBox = wrapper.find('.suggest-status-text');
        statusBox.html(text);
    }

    /**
     * Retrieves the settings associated with a given selection.
     *
     * @param {object} $input - The selected element from which to retrieve the settings.
     * @return {object} The settings object, or an empty object if no settings are found.
     */
    function getSettings($input) {
        return $input.data('settings') || {};
    }

    /**
     * Sets the disabled status of a dropdown menu.
     *
     * @param {object} $input - The jQuery object representing the dropdown selector.
     * @param {boolean} status - A boolean indicating whether to disable (true) or enable (false) the dropdown.
     * @return {void} This function does not return a value.
     */
    function setDisabled($input, status) {
        const dropDown = getWrapper($input);
        const btn = dropDown.find('[data-bs-toggle="dropdown"],[data-toggle="dropdown"]');
        if (status) {
            btn.addClass('disabled');
            $input.prop('disabled', true);
        } else {
            btn.removeClass('disabled');
            $input.prop('disabled', false);
        }
        trigger($input, 'toggleDisabled.bs.suggest', [status]);
    }

    /**
     *
     * Triggers the specified event on the given input element.
     *
     * @param {object} $input - The select element to trigger the event on.
     * @param {string} eventName - The name of the event to trigger.
     * @param {array} addParams - Additional trigger parameters.
     */
    function trigger($input, eventName, addParams = []) {
        let params = addParams;

        if (eventName !== 'any.bs.select') {
            // Temporär das Event unterdrücken, um Rekursion zu verhindern
            if (!$input.data('suppressEvent')) {
                $input.data('suppressEvent', true);

                // `any.bs.select` Event auslösen
                $input.trigger('any.bs.select');

                // Das spezifische Ereignis auslösen
                $input.trigger(eventName, params);

                // Unterdrückung für das nächste Event rückgängig machen
                setTimeout(() => {
                    $input.removeData('suppressEvent');
                }, 0);
            }
        } else {
            $input.trigger(eventName, params);
        }
    }

    function clear($input) {
        const settings = getSettings($input);
        const wrapper = getWrapper($input);
        const searchBox = wrapper.find('[type="search"]');
        const list = wrapper.find('.js-suggest-results');

        if (settings.debug) {
            console.log('function', 'clear');
        }
        const valueBefore = $input.val();
        $input.val(null);
        searchBox.val(null);
        list.empty();
        setDropdownText($input, null);
        setStatus($input, settings.waitingForTypingText);
        trigger($input, 'change.bs.suggest', [valueBefore, null]);
    }

    /**
     * Attaches event listeners for a dropdown suggestion component.
     *
     * @param {object} $input - The jQuery object representing the input.
     * @return {void} This function does not return a value.
     */
    function events($input) {
        const wrapper = getWrapper($input);

        const searchBox = wrapper.find('[type="search"]');
        const settings = getSettings($input);
        let typingTimer = $input.data('typingTimer') || null;

        const list = wrapper.find('.js-suggest-results');

        searchBox.on('keyup', function () {
            if (settings.debug) {
                console.log('keyup');
            }
            if (typingTimer !== null) {
                clearTimeout(typingTimer);
            }

            typingTimer = setTimeout(function () {
                setStatus($input, settings.loadingText);
                getData($input).then(() => {

                });
            }, settings.typingInterval);
            $input.data('typingTimer', typingTimer);
        });

        searchBox.on('keydown', function () {
            if (settings.debug) {
                console.log('keydown');
            }
            if (typingTimer !== null) {
                clearTimeout(typingTimer);
            }
            $input.data('typingTimer', typingTimer);
            setStatus($input, settings.typingText);
        });

        wrapper
            .on('click', '.dropdown-item', function (e) {
                e.preventDefault();
                if (settings.debug) {
                    console.log('click', 'a.dropdown-item');
                }
                let a = $(e.currentTarget);
                let item = a.data('item');
                let value = item.id;
                // Setzen des Wertes und des Textes
                if ($input.val() !== value) {
                    $input.val(value);
                    setDropdownText($input, item);

                    trigger($input, 'change.bs.suggest', [item.id, item.text]);
                } else {
                    if (settings.debug) {
                        console.log("Wert hat sich nicht geändert, Event nicht ausgelöst.");
                    }
                }
            })
            .on('click', '.js-webcito-reset', function (e) {
                e.preventDefault();
                if (settings.debug) {
                    console.log('click', '.js-webcito-reset');
                }
                clear($input);
            })
            .on('hidden.bs.dropdown', '.dropdown', function () {
                if (settings.debug) {
                    console.log('hidden.bs.dropdown', '.dropdown');
                }
                list.empty();
                searchBox.val(null);
                setStatus($input, settings.waitingForTypingText);
            })
            .on('shown.bs.dropdown', '.dropdown', function () {
                if (settings.debug) {
                    console.log('shown.bs.dropdown', '.dropdown');
                }
                searchBox.focus();
            })
            .on('show.bs.dropdown', '.dropdown', function () {
                if (settings.debug) {
                    console.log('shown.bs.dropdown', '.dropdown');
                }

                if (settings.loadDataOnShow) {
                    getData($input, true).then(() => {
                    });
                }
            });
    }

    /**
     * Checks whether the provided value is considered empty.
     *
     * @param {any} value - The value to be checked for emptiness.
     * @return {boolean} - Returns true if the value is null, undefined, an empty array, or an empty string
     * (including strings with only spaces).
     * Returns false otherwise.
     */
    function isValueEmpty(value) {
        if (value === null || value === undefined) {
            return true; // Null or undefined
        }
        if (Array.isArray(value)) {
            return value.length === 0; // Empty array
        }
        if (typeof value === 'string') {
            return value.trim().length === 0; // Empty string (including only spaces)
        }
        return false; // All other values are considered non-empty (including numbers)
    }

    /**
     * Builds and groups items for the suggestion dropdown.
     *
     * @param {object} $input - The jQuery object representing the input element.
     * @param {Array} items - Array of items to be displayed, each having `id`, `text`, and optionally `group`.
     * @param {number} total - Total number of items found.
     */
    function buildItems($input, items, total) {
        const wrapper = getWrapper($input);
        const list = wrapper.find('.js-suggest-results').empty();
        const countItems = items.length;

        if (!countItems) {
            console.log('suggest: no items found');

        } else {

            // Group items by `group`
            const groupedItems = items.reduce((acc, item) => {
                const group = item.group ?? '_no_group';
                acc[group] = acc[group] || [];
                acc[group].push(item);
                return acc;
            }, {});

            // Iterate over grouped items and build the list
            Object.keys(groupedItems)
                .filter(group => group !== '_no_group')
                .forEach(group => {
                    // Add group header
                    $('<div>', {
                        class: 'dropdown-header ps-0 py-1 pl-0 border-top border-bottom text-right text-end',
                        text: group
                    }).appendTo(list);

                    // Add items in the group
                    groupedItems[group].forEach(item => {
                        createTemplateItem($input, item, list);
                    });
                });

            // Add ungrouped items under "Ungrouped" header
            if (groupedItems._no_group) {
                const hasOtherGroups = Object.keys(groupedItems).length > 1;

                if (hasOtherGroups) {
                    $('<hr>', {
                        class: 'dropdown-divider',
                    }).appendTo(list);
                }

                groupedItems._no_group.forEach(item => {
                    createTemplateItem($input, item, list);
                });
            }
        }
        setStatus($input, countItems !== total ? `showing ${countItems} / ${total} results` : `results: ${countItems}`);
    }

    /**
     * Creates a template item and appends it to the specified list.
     *
     * @param {Object} $input - A jQuery object representing the input element.
     * @param {Object} item - The item object to be used for creating the template.
     * @param {Object} list - A jQuery object representing the list element to which the template item will be appended.
     * @return {void}
     */
    function createTemplateItem($input, item, list) {
        const div = $('<div>', {
            html: getItemHtml($input, item, true)
        }).appendTo(list);

        div.find('.dropdown-item').data('item', item);
    }

    /**
     * Generates the HTML for a given item based on the provided settings and flags.
     *
     * @param {Object} $input - The input object used to get the settings.
     * @param {Object} item - The item to be formatted into HTML.
     * @param {boolean} [asDropdownItem=false] - Flag to determine if the item should be styled as a dropdown item.
     * @return {string} The generated HTML string for the given item.
     */
    function getItemHtml($input, item, asDropdownItem = false) {
        const settings = getSettings($input);
        let html = '';
        if (typeof settings.formatItem === 'function') {
            html = settings.formatItem(item);
        } else {
            html = formatItem(item);
        }
        const commonClasses = 'd-flex flex-column align-items-start';
        if (asDropdownItem) {
            return `<a class="dropdown-item px-2 ${commonClasses}" href="#">${html}</a>`;
        }
        return `<div class="${commonClasses}">${html}</div>`;
    }

    /**
     * Fetches data based on the provided input parameters and updates the UI accordingly.
     *
     * @param {object} $input - The jQuery object representing the input element.
     * @param {boolean} [searchModus=true] - Determines whether to perform a search based on the input value.
     * @param {string|undefined|null} val - The value to be used for the non-search mode request.
     * @param {boolean} [triggerChange=false] - Determines whether to trigger a change event after updating the input value.
     * @return {Promise<void>} A promise that resolves when the data fetching and UI update are complete.
     */
    async function getData($input, searchModus = true, val = null, triggerChange = false) {
        const settings = getSettings($input);
        const wrapper = getWrapper($input);
        const searchBox = wrapper.find('[type="search"]');

        // Abbrechen des bestehenden XMLHttpRequest, falls vorhanden.
        let xhr = $input.data('xhr') || null;
        if (xhr && xhr.abort) {
            xhr.abort();
            xhr = null;
        }

        const searchValue = isValueEmpty(searchBox.val()) ? null : searchBox.val().trim();

        const data = searchModus ? {q: searchValue, limit: settings.limit} : {value: val};
        const query = settings.queryParams(data);

        try {
            xhr = $.get($input.data('bsTarget'), query);
            $input.data('xhr', xhr);

            const response = await xhr;

            if (response.error) {
                trigger($input, 'error.bs.suggest', [response.error]);
                return;
            }

            if (searchModus) {
                const items = response.items || [];
                buildItems($input, items, response.total);
            } else {
                $input.val(response.id);
                setDropdownText($input, response);
                if (triggerChange) {
                    trigger($input, 'change.bs.suggest', [response.id, response.text]);
                }
            }
        } catch (error) {
            trigger($input, 'error.bs.suggest', [error.message]);
        } finally {
            $input.data('xhr', null);  // Reset the xhr data
        }
    }

    function formatItem(item) {
        console.log('format-item default');
        let subtext = '';
        if (item.hasOwnProperty('subtext') && !isValueEmpty(item.subtext)) {
            subtext = '<small class="text-muted">' + item.subtext + '</small>';
        }
        return `<div>${item.text}</div>${subtext}`;
    }

    $.fn.suggest = function (options, params, params2) {

        if (!$(this).length) {
            return $(this); // cancel
        }

        if ($(this).length > 1) {
            return $(this).each(function () {
                return $(this).suggest(options, params, params2); // return an instance of your own in each case
            });
        }

        const DEFAULTS = {
            debug: false,
            limit: 20,
            loadDataOnShow: true,
            typingInterval: 400,
            multiple: false,
            valueSeparator: ',',
            btnWidth: 'fit-content',
            btnClass: 'btn btn-outline-secondary',
            searchPlaceholderText: "Search",
            emptyText: 'Please choose..',
            waitingForTypingText: 'Waiting for typing',
            typingText: 'typing..',
            loadingText: 'Loading..',
            queryParams: function (params) {
                return params;
            },
            formatItem: null
        };

        const $input = $(this); // The single instance
        const isOptionsObject = typeof options === "object";
        const isCallMethod = typeof options === "string";

        // init
        if (!$input.data('initSuggest')) {

            $input.data('initSuggest', true);

            if ($input.attr('type') !== 'hidden') {
                const inputTypeBefore = $input.attr('type');
                $input.attr('type', 'hidden');
                $input.data('typeBefore', inputTypeBefore);
            }


            $input.addClass('js-suggest');

            if (isOptionsObject || !$input.data('settings')) {
                let o = {};
                if (isOptionsObject) {
                    o = options;
                } else if ($input.data('settings')) {
                    o = $input.data('settings');
                }

                const settings = $.extend({}, DEFAULTS, o);

                $input.data('settings', settings);
                $input.data('selected', $input.val().split(settings.valueSeparator));
                if (settings.debug) {
                    console.log('init', settings);
                }
            }

            buildDropdown($input);

            events($input);

            const value = isValueEmpty($input.val()) ? null : $input.val().trim();
            if (value !== null) {
                getData($input, false, value).then(() => {
                });
            }
        }

        // call methods
        if (isCallMethod) {
            switch (options) {
                case 'val': {
                    const settings = getSettings($input);
                    if (settings.debug) {
                        console.log('method', 'val', params, $input);
                    }
                    reset($input);
                    getData($input, false, params, params2 ?? false).then(() => {
                    });
                }
                    break;
                case 'destroy': {
                    const settings = getSettings($input);
                    if (settings.debug) {
                        console.log('method', 'destroy', $input);
                    }
                    destroy($input, true);
                }
                    break;
                case 'refresh': {
                    const settings = getSettings($input);
                    if (settings.debug) {
                        console.log('method', 'refresh', $input);
                    }
                    refresh($input);
                }
                    break;
                case 'setDisabled': {
                    const settings = getSettings($input);
                    if (settings.debug) {
                        console.log('method', 'setDisabled', params, $input);
                    }
                    setDisabled($input, params);
                    refresh($input);
                }
                    break;
                case 'updateOptions': {
                    const settings = getSettings($input);
                    if (settings.debug) {
                        console.log('method', 'updateOptions', params, $input);
                    }
                    $input.data('settings', $.extend({}, DEFAULTS, settings, params || {}));
                    refresh($input);
                }
                    break;
                case 'setBtnClass': {
                    const settings = getSettings($input);
                    if (settings.debug) {
                        console.log('method', 'setBtnClass', params, $input);
                    }
                    settings.btnClass = params;
                    $input.data('settings', settings);
                    refresh($input);
                }
                    break;
                case 'clear': {
                    const settings = getSettings($input);
                    if (settings.debug) {
                        console.log('method', 'clear', params, $input);
                    }
                    clear($input);
                }
                    break;
            }
        }

        // return the reference for chaining
        return $input;
    };
}(jQuery));
