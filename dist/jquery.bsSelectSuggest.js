// noinspection DuplicatedCode,JSUnresolvedReference

/** global $ */
(function ($) {
    const debug = false;

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
        const template = `
<div class="dropdown">
    <button class="${settings.btnClass} ${disabledClass} d-flex align-items-center" data-toggle="dropdown" data-bs-toggle="dropdown" aria-expanded="false" style="width:${settings.btnWidth}">
        <span class="js-selected-text">${settings.emptyText}</span>
    </button>
    <div class="dropdown-menu p-0 mt-1" style="min-width: 250px">
        <div class="w-100">
            <div class="p-2 d-flex flex-nowrap align-items-center justify-content-between border-bottom">
                <input autocomplete="false" type="search" class="form-control form-control-sm flex-fill" placeholder="${settings.searchPlaceholderText}">
                <button role="button" class="btn btn-light bg-transparent ms-2 js-webcito-reset">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
            <div class="p-2 js-suggest-results"></div>
            <div class="p-2 p-1 fw-light fst-italic d-flex align-items-center">
                <small class="suggest-status-text">${settings.waitingForTypingText}</small>
            </div>
        </div>
    </div>
</div>`;
        if (debug) {
            console.log(template);
        }
        return template;
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
     * @return {jQuery} - The jQuery object representing the newly created dropdown wrapper.
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
        $input.hide();
        $input.appendTo(wrap);
        const template = getTemplate($input);
        $(template).prependTo(wrap);
        // setTimeout(function () {
        if (wrap.find('.js-selected-text').text() === "") {
            setDropdownText($input, null);
        }
        // }, 40);
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
        let wrapper = getWrapper($input);
        $input.insertBefore(wrapper);
        wrapper.remove();
        $input.val(valBefore);
        $input.removeClass('js-suggest');
        $input.removeData('settings');
        $input.removeData('selected');
        $input.removeData('initSuggest');
        if (show) {
            $input.show();
        }
    }

    /**
     * Updates the text of a dropdown element.
     *
     * @param {object} $input - jQuery object representing the input element.
     * @param {string|null} html - The HTML content to set as the dropdown text.
     * @return {void}
     */
    function setDropdownText($input, html = null) {

        const wrapper = getWrapper($input);
        const settings = $input.data('settings');
        if (debug) {
            console.log('setDropdownText', html, wrapper, settings);
        }

        wrapper.find('.js-selected-text').html('<span class="d-inline text-start">' + (html || settings.emptyText) + '</span>');
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
     * @param {jQuery} $input - The jQuery object representing the dropdown selector.
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
            if (debug) {
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
            if (debug) {
                console.log('keydown');
            }
            let settings = getSettings($input);
            if (typingTimer !== null) {
                clearTimeout(typingTimer);
            }
            $input.data('typingTimer', typingTimer);
            setStatus($input, settings.typingText);
        });

        wrapper
            .on('click', 'a.dropdown-item', function (e) {
                e.preventDefault();
                if (debug) {
                    console.log('click', 'a.dropdown-item');
                }
                let a = $(e.currentTarget);
                let item = a.data('item');
                let value = item.id;
                // Setzen des Wertes und des Textes
                if ($input.val() !== value) {
                    $input.val(value);
                    setDropdownText($input, a.html());

                    trigger($input, 'change.bs.suggest', [item.id, item.text]);
                } else {
                    if (debug) {
                        console.log("Wert hat sich nicht geändert, Event nicht ausgelöst.");
                    }
                }
            })
            .on('click', '.js-webcito-reset', function (e) {
                e.preventDefault();
                if (debug) {
                    console.log('click', '.js-webcito-reset');
                }
                // reset(select);
                $input.val(null);
                searchBox.val(null);
                list.empty();
                setDropdownText($input, null);
                let settings = $input.data('settings');
                setStatus($input, settings.waitingForTypingText);
                trigger($input, 'change.bs.suggest', [null, null]);
            })
            .on('hidden.bs.dropdown', '.dropdown', function () {
                if (debug) {
                    console.log('hidden.bs.dropdown', '.dropdown');
                }
                list.empty();
                searchBox.val(null);
                let settings = getSettings($input);
                setStatus($input, settings.waitingForTypingText);
            })
            .on('shown.bs.dropdown', '.dropdown', function () {
                if (debug) {
                    console.log('shown.bs.dropdown', '.dropdown');
                }
                searchBox.focus();
            })
            .on('show.bs.dropdown', '.dropdown', function () {
                if (debug) {
                    console.log('shown.bs.dropdown', '.dropdown');
                }
                let settings = getSettings($input);
                if (settings.loadDataOnShow) {
                    getData($input).then(() => {
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
        const list = wrapper.find('.js-suggest-results');

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
                if (!items.length) {
                    console.log('suggest: no items');
                }
                list.empty();
                items.forEach(item => {
                    const div = $('<div>', {
                        html: `<a class="dropdown-item px-1" href="#">${item.text}</a>`,
                    }).appendTo(list);
                    div.find('a').data('item', item);
                });
                setStatus($input, items.length !== response.total ? `showing ${items.length} / ${response.total} results` : `results: ${items.length}`);
            } else {
                $input.val(response.id);
                setDropdownText($input, response.text);
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
            limit: 5,
            loadDataOnShow: true,
            typingInterval: 400,
            multiple: false,
            valueSeparator: ',',
            darkMenu: false,
            btnWidth: 'fit-content',
            btnClass: 'btn btn-outline-secondary',
            searchPlaceholderText: "Search",
            emptyText: 'Please choose..',
            waitingForTypingText: 'Waiting for typing',
            typingText: 'typing..',
            loadingText: 'Loading..',
            queryParams: function (params) {
                return params;
            }
        };

        const $input = $(this); // The single instance
        const isOptionsSet = typeof options === "object" || typeof options === "undefined";
        const isCallMethod = typeof options === "string";

        // init
        if ($input.data('initSuggest') !== true) {

            $input.data('initSuggest', true);
            $input.addClass('js-suggest');

            if (isOptionsSet || !$input.data('settings')) {
                const settings = $.extend({}, DEFAULTS, options || {});
                $input.data('settings', settings);
                $input.data('selected', $input.val().split(settings.valueSeparator));
                if (debug) {
                    console.log('init', $input, settings);
                }
            }

            buildDropdown($input);

            events($input);

            if ($input.val() !== "") {
                getData($input, false, $input.val()).then(() => {
                });
            }
        }

        // call methods
        if (isCallMethod) {
            switch (options) {
                case 'val':
                    if (debug) {
                        console.log('method', 'val', params, $input);
                    }
                    reset($input);
                    getData($input, false, params, params2 ?? false).then(() => {
                    });
                    break;
                case 'destroy':
                    if (debug) {
                        console.log('method', 'destroy', $input);
                    }
                    destroy($input, true);
                    break;
                case 'refresh':
                    if (debug) {
                        console.log('method', 'refresh', $input);
                    }
                    refresh($input);
                    break;
                case 'setDisabled':
                    if (debug) {
                        console.log('method', 'setDisabled', params, $input);
                    }
                    setDisabled($input, params);
                    refresh($input);
                    break;
                case 'updateoptions':
                    if (debug) {
                        console.log('method', 'updateoptions', params, $input);
                    }
                    const oldSettings = getSettings($input);
                    $input.data('settings', $.extend({}, DEFAULTS, oldSettings, params || {}));
                    refresh($input);
                    break;

            }
        }

        // return the reference for chaining
        return $input;
    };
}(jQuery));
