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
        // Build header action buttons according to settings
        const actionMode = settings.headerActionMode; // 'clear' | 'close' | 'both' | 'none'
        const showText = !!settings.showHeaderActionText;
        const clearIcon = `<i class="${settings.headerClearIconClass}"></i>`;
        const closeIcon = `<i class="${settings.headerCloseIconClass}"></i>`;
        const clearLabel = settings.headerClearText || 'Clear';
        const closeLabel = settings.headerCloseText || 'Close';
        const btnBaseCls = 'btn btn-light bg-transparent ms-2';
        const buildClearBtn = () => `
                <button role="button" type="button" class="${btnBaseCls} js-webcito-clear" title="${clearLabel}" aria-label="${clearLabel}">
                    ${clearIcon}${showText ? ` <span class="ms-1">${clearLabel}</span>` : ''}
                </button>`;
        const buildCloseBtn = () => `
                <button role="button" type="button" class="${btnBaseCls} js-webcito-close" title="${closeLabel}" aria-label="${closeLabel}">
                    ${closeIcon}${showText ? ` <span class="ms-1">${closeLabel}</span>` : ''}
                </button>`;
        let headerActionsHtml = '';
        if (actionMode === 'clear') headerActionsHtml = buildClearBtn();
        else if (actionMode === 'close') headerActionsHtml = buildCloseBtn();
        else if (actionMode === 'both') headerActionsHtml = buildClearBtn() + buildCloseBtn();
        // 'none' => no action buttons
        return `
<div class="dropdown">
    <button type="button" class="js-suggest-btn ${settings.btnClass} ${disabledClass} d-flex align-items-center" aria-expanded="false" style="width:${settings.btnWidth}">
        <div class="js-selected-text overflow-hidden">${settings.btnEmptyText}</div>
    </button>
    <div class="dropdown-menu p-0 mt-1" style="min-width: 250px">
        <div class="w-100">
            <div class="p-2 d-flex flex-nowrap align-items-center justify-content-between border-bottom">
                <input autocomplete="false" type="search" class="form-control form-control-sm flex-fill" placeholder="${settings.searchPlaceholderText}">
                ${headerActionsHtml}
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

        // Unbind any document-level outside-click handlers for this instance
        try {
            const wrapId = wrapper && wrapper.attr('id');
            if (wrapId) {
                $(document).off('.suggestOutside-' + wrapId);
            }
        } catch (e) {
            // no-op
        }

        $input.val(valBefore);
        $input.insertBefore(wrapper);
        wrapper.remove();

        $input.removeClass('js-suggest');
        $input.removeData('settings');
        $input.removeData('selected');
        $input.removeData('selectedItems');
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

        // Multiple selection: render selected items using the same formatting as options (formatItem)
        if (settings.multiple) {
            const selectedItems = ($input.data('selectedItems') || []).filter(it => it && !isValueEmpty(it.id));
            const isList = !!settings.showMultipleAsList; // true => vertical list, false => floating/wrapping
            const containerClass = isList
                ? 'd-flex flex-column align-items-start'
                : 'd-flex flex-wrap align-items-start gap-2';

            if (!selectedItems.length) {
                wrapper.find('.js-selected-text').html(`<div class="${containerClass}">${settings.btnEmptyText}</div>`);
                return;
            }

            // Build item HTML. For floating mode we try to make items inline-friendly by
            // relaxing some block/w-100 defaults when possible. Additionally, add a small
            // remove button per selected item, positioned as a corner control on the item.
            const itemsHtml = selectedItems.map(it => {
                const idStr = String(it.id);
                let inner = getItemHtml($input, it, false);
                if (!isList) {
                    // Make the inner wrapper inline-friendly
                    inner = inner.replace(
                        /class="([^"]*)\bd-flex\s+flex-column\s+align-items-start([^"]*)"/,
                        'class="$1d-inline-flex align-items-center$2"'
                    );
                    inner = inner.replace(/\bw-100\b/g, 'w-auto');
                }
                // Wrap each item with a relative container and position the remove control in the top-right corner
                const itemWrapperClass = isList
                    ? 'suggest-selected-item position-relative d-block w-100'
                    : 'suggest-selected-item position-relative d-inline-block me-1 mb-1';
                // Use a non-button control to avoid nested button -> dropdown toggle conflicts
                // Position the remove icon INSIDE the item (top-right corner) to avoid clipping by the button border
                // and keep it readable. We also add tiny margins to detach it from edges.
                const removeBtnClass = 'js-suggest-remove position-absolute top-0 end-0 translate-middle-y mt-1 me-1 bg-light border rounded-circle d-inline-flex align-items-center justify-content-center text-secondary shadow-sm';
                // Use Bootstrap Icons by request (bi-x)
                const removeIcon = '<i class="bi bi-x"></i>';
                return `
<div class="${itemWrapperClass}" data-id="${idStr}">
  <div class="suggest-selected-content pe-3">${inner}</div>
  <span role="button" tabindex="0" class="${removeBtnClass}" data-id="${idStr}" aria-label="Remove" style="width:1.25rem;height:1.25rem">${removeIcon}</span>
</div>`;
            }).join('');

            wrapper.find('.js-selected-text').html(`<div class="${containerClass}">${itemsHtml}</div>`);
            return;
        }

        // Single selection behavior (backward compatible)
        let html = '';
        if (!isValueEmpty(item)) {
            // Prefer server-provided HTML if available
            const hasFormatted = item && typeof item.formatted === 'string' && item.formatted.trim().length > 0;
            if (hasFormatted) {
                html = item.formatted;
            } else if (typeof settings.formatItem === 'function') {
                html = settings.formatItem(item);
            } else {
                html = formatItem(item);
            }
        }
        const formatted = isValueEmpty(item) ?
            '<div class="d-flex flex-column align-items-start">' + settings.btnEmptyText + '</div>'
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

        $input.val(settings.multiple ? [] : null);
        $input.data('selected', []);
        $input.data('selectedItems', []);
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
        const btn = dropDown.find('.js-suggest-btn,[data-bs-toggle="dropdown"],[data-toggle="dropdown"]');
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
        $input.val(settings.multiple ? [] : null);
        $input.data('selected', []);
        $input.data('selectedItems', []);
        searchBox.val(null);
        list.empty();
        setDropdownText($input, null);
        setStatus($input, settings.waitingForTypingText);
        if (settings.multiple) {
            trigger($input, 'change.bs.suggest', [[], []]);
        } else {
            trigger($input, 'change.bs.suggest', [valueBefore, null]);
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

        // Create or get a Bootstrap Dropdown instance and control it manually
        let dropdownInst = null;
        const btnEl = wrapper.find('.js-suggest-btn').get(0);
        if (btnEl && typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
            try {
                dropdownInst = bootstrap.Dropdown.getOrCreateInstance(btnEl, {
                    autoClose: settings.multiple ? 'outside' : true
                });
                // keep a reference if needed later
                $input.data('dropdownInst', dropdownInst);
            } catch (e) {
                if (settings.debug) {
                    console.warn('Dropdown instance failed to init', e);
                }
            }
        }

        // Robust outside-click close fallback (in case Bootstrap's autoClose is bypassed)
        try {
            const wrapId = wrapper.attr('id');
            const ns = '.suggestOutside-' + wrapId;
            const menu = wrapper.find('.dropdown-menu');
            $(document)
                .off(ns)
                .on('click' + ns, function (e) {
                    // Ignore clicks inside the widget
                    if (wrapper.is(e.target) || wrapper.has(e.target).length) return;
                    // If open, hide it
                    if (menu.hasClass('show')) {
                        const inst = $input.data('dropdownInst');
                        if (inst && typeof inst.hide === 'function') {
                            inst.hide();
                        } else {
                            menu.removeClass('show');
                        }
                    }
                });
        } catch (e) {
            // no-op
        }

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
            // Manual toggle: only toggle when clicking the main button and NOT the remove control
            .on('click', '.js-suggest-btn', function (e) {
                const btn = $(this);
                if (btn.hasClass('disabled') || $input.prop('disabled')) {
                    e.preventDefault();
                    return;
                }
                if ($(e.target).closest('.js-suggest-remove').length) {
                    // click on remove control inside the button – do nothing here
                    e.preventDefault();
                    return;
                }
                e.preventDefault();
                const menu = wrapper.find('.dropdown-menu');
                try {
                    const inst = $input.data('dropdownInst');
                    if (inst && typeof inst.toggle === 'function') {
                        inst.toggle();
                    } else if (typeof bootstrap !== 'undefined' && bootstrap.Dropdown) {
                        // fallback create-on-demand
                        const tmp = bootstrap.Dropdown.getOrCreateInstance(this, {autoClose: settings.multiple ? 'outside' : true});
                        tmp.toggle();
                        $input.data('dropdownInst', tmp);
                    } else {
                        // last resort: toggle class (limited)
                        menu.toggleClass('show');
                    }
                } catch (err) {
                    if (settings.debug) {
                        console.warn('toggle failed', err);
                    }
                }
            })
            // Header actions: clear/close (and legacy .js-webcito-reset mapped to clear)
            .on('click keydown', '.js-webcito-clear, .js-webcito-reset', function (e) {
                const isKey = e.type === 'keydown';
                if (isKey) {
                    const key = e.key || e.code;
                    if (!(key === 'Enter' || key === ' ' || key === 'Spacebar')) return;
                }
                e.preventDefault();
                e.stopImmediatePropagation();
                clear($input); // keep dropdown open
            })
            .on('click keydown', '.js-webcito-close', function (e) {
                const isKey = e.type === 'keydown';
                if (isKey) {
                    const key = e.key || e.code;
                    if (!(key === 'Enter' || key === ' ' || key === 'Spacebar')) return;
                }
                e.preventDefault();
                e.stopImmediatePropagation();
                try {
                    const inst = $input.data('dropdownInst');
                    if (inst && typeof inst.hide === 'function') {
                        inst.hide();
                    } else {
                        getWrapper($input).find('.dropdown-menu').removeClass('show');
                    }
                } catch (err) { /* no-op */ }
            })
            .on('click', '.dropdown-item', function (e) {
                e.preventDefault();
                if (settings.debug) {
                    console.log('click', 'a.dropdown-item');
                }
                let a = $(e.currentTarget);
                let item = a.data('item');
                let value = item.id;
                // Multiple selection mode: toggle without closing dropdown
                if (settings.multiple) {
                    let selectedIds = ($input.data('selected') || []).slice();
                    let selectedItems = ($input.data('selectedItems') || []).slice();
                    const idx = selectedIds.indexOf(String(value));
                    if (idx > -1) {
                        selectedIds.splice(idx, 1);
                        selectedItems = selectedItems.filter(it => String(it.id) !== String(value));
                        a.removeClass('active');
                    } else {
                        selectedIds.push(String(value));
                        selectedIds = Array.from(new Set(selectedIds));
                        // Update or add item details
                        const existingIdx = selectedItems.findIndex(it => String(it.id) === String(value));
                        if (existingIdx > -1) {
                            selectedItems[existingIdx] = item;
                        } else {
                            selectedItems.push(item);
                        }
                        a.addClass('active');
                    }
                    $input.data('selected', selectedIds);
                    $input.data('selectedItems', selectedItems);
                    const before = $input.val();
                    $input.val(selectedIds);
                    setDropdownText($input, null);
                    if (String(before) !== String(selectedIds)) {
                        trigger($input, 'change.bs.suggest', [selectedIds, selectedItems]);
                    }
                    return; // keep dropdown open
                }
                // Single selection mode
                // Always reflect active state in the list
                const listEl = getWrapper($input).find('.js-suggest-results');
                listEl.find('.dropdown-item.active').removeClass('active');
                a.addClass('active');

                const beforeVal = $input.val();
                if (beforeVal !== value) {
                    $input.val(value);
                    setDropdownText($input, item);
                    trigger($input, 'change.bs.suggest', [item.id, item.text]);
                } else {
                    // Even if the value didn't change, keep the UI in sync
                    setDropdownText($input, item);
                    if (settings.debug) {
                        console.log('Wert hat sich nicht geändert — UI aktualisiert, Dropdown wird geschlossen.');
                    }
                }

                // Close the dropdown after selection in single mode
                try {
                    const inst = $input.data('dropdownInst');
                    if (inst && typeof inst.hide === 'function') {
                        inst.hide();
                    } else {
                        getWrapper($input).find('.dropdown-menu').removeClass('show');
                    }
                } catch (err) {
                    // no-op
                }
            })
            // Block early events on the remove control so the dropdown toggle never sees them
            .on('pointerdown mousedown mouseup touchstart touchend', '.js-suggest-remove', function (e) {
                if (!settings.multiple) {
                    return;
                }
                e.preventDefault();
                e.stopImmediatePropagation(); // ensure nothing else handles it
            })
            // Keyboard support: remove on Enter/Space without opening dropdown
            .on('keydown', '.js-suggest-remove', function (e) {
                if (!settings.multiple) {
                    return;
                }
                const key = e.key || e.code;
                if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    // simulate click removal below
                    $(this).trigger('click');
                }
            })
            .on('click', '.js-suggest-remove', function (e) {
                // Remove a selected item directly from the button (multiple mode only)
                if (!settings.multiple) {
                    return;
                }
                e.preventDefault();
                e.stopImmediatePropagation(); // do not toggle dropdown
                const btn = $(e.currentTarget);
                const id = String(btn.data('id'));
                let selectedIds = ($input.data('selected') || []).slice();
                let selectedItems = ($input.data('selectedItems') || []).slice();
                const idx = selectedIds.indexOf(id);
                if (idx > -1) {
                    selectedIds.splice(idx, 1);
                }
                selectedItems = selectedItems.filter(it => String(it.id) !== id);
                const before = $input.val();
                $input.data('selected', selectedIds);
                $input.data('selectedItems', selectedItems);
                $input.val(selectedIds);
                setDropdownText($input, null);
                // Also update active state in the dropdown list if it is open
                const list = getWrapper($input).find('.js-suggest-results');
                list.find('.dropdown-item.active').each(function(){
                    const a = $(this);
                    const it = a.data('item');
                    if (it && String(it.id) === id) {
                        a.removeClass('active');
                    }
                });
                if (String(before) !== String(selectedIds)) {
                    trigger($input, 'change.bs.suggest', [selectedIds, selectedItems]);
                }
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

        const a = div.find('.dropdown-item');
        a.data('item', item);
        // Mark selected items as active in multiple mode
        const settings = getSettings($input);
        if (settings.multiple) {
            const selectedIds = ($input.data('selected') || []).map(String);
            if (selectedIds.includes(String(item.id))) {
                a.addClass('active');
            }
        } else if (String($input.val()) === String(item.id)) {
            a.addClass('active');
        }
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
        let html;
        // Prefer server-provided HTML if available
        const hasFormatted = item && typeof item.formatted === 'string' && item.formatted.trim().length > 0;
        if (hasFormatted) {
            html = item.formatted;
        } else if (typeof settings.formatItem === 'function') {
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
     * @param {string|string[]|undefined|null} val - The value to be used for the non-search mode request.
     * @param {boolean} [triggerChange=false] - Determines whether to trigger a change event after updating the input value.
     * @return {Promise<void>} A promise that resolves when the data fetching and UI update are complete.
     */
    async function getData($input, searchModus = true, val = null, triggerChange = false) {
        const settings = getSettings($input);
        const wrapper = getWrapper($input);
        const searchBox = wrapper.find('[type="search"]');

        if(! searchModus && val === null) {
            wrapper.find('.js-suggest-results').empty();
            setDropdownText($input, null);
            return;
        }

        // Abbrechen des bestehenden XMLHttpRequest, falls vorhanden.
        let xhr = $input.data('xhr') || null;
        if (xhr && xhr.abort) {
            xhr.abort();
            xhr = null;
        }

        const searchValue = isValueEmpty(searchBox.val()) ? null : searchBox.val().trim();

        // Normalize value for non-search mode (programmatic set)
        let valueForQuery = val;
        if (!searchModus) {
            if (Array.isArray(val)) {
                // In multiple mode send the array (serialized as value[]=..), single mode reduce to single scalar
                valueForQuery = settings.multiple ? val : (val[0] ?? null);
            } else if (val != null) {
                valueForQuery = String(val);
            }
        }

        const data = searchModus ? {q: searchValue, limit: settings.limit} : {value: valueForQuery};
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
                if (settings.multiple) {
                    // Expect response.items as array; fallback to single item
                    let items = [];
                    if (Array.isArray(response.items)) {
                        items = response.items;
                    } else if (response.id !== undefined) {
                        items = [response];
                    }
                    const ids = items.map(it => String(it.id));
                    $input.data('selected', ids);
                    $input.data('selectedItems', items);
                    const before = $input.val();
                    $input.val(ids);
                    setDropdownText($input, null);
                    if (triggerChange && String(before) !== String(ids)) {
                        trigger($input, 'change.bs.suggest', [ids, items]);
                    }
                } else {
                    $input.val(response.id);
                    setDropdownText($input, response);
                    if (triggerChange) {
                        trigger($input, 'change.bs.suggest', [response.id, response.text]);
                    }
                }
            }
        } catch (error) {
            trigger($input, 'error.bs.suggest', [error.message]);
        } finally {
            $input.data('xhr', null);  // Reset the xhr data
        }
    }

    function formatItem(item) {
        // Modern, clean default rendering without forcing a light background.
        // Important: Avoid fixed light backgrounds in dropdown so that
        // .dropdown-item.active (Bootstrap) can provide proper contrast.
        const text = String(item.text ?? item.id ?? '');
        const hasSub = Object.prototype.hasOwnProperty.call(item, 'subtext') && !isValueEmpty(item.subtext);
        // Use opacity instead of text-muted to keep good contrast on dark/active backgrounds
        const sub = hasSub ? `<div class="small opacity-75 mt-1">${item.subtext}</div>` : '';
        // Only Bootstrap 5 utilities, no custom CSS
        return `
<div class="w-100 rounded-2 px-2 py-1">
  <div class="fw-semibold">${text}</div>
  ${sub}
</div>`;
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
            showMultipleAsList:false,
            btnWidth: 'fit-content',
            btnClass: 'btn btn-outline-secondary',
            searchPlaceholderText: "Search",
            btnEmptyText: 'Please choose..',
            waitingForTypingText: 'Waiting for typing',
            typingText: 'typing..',
            loadingText: 'Loading..',
            queryParams: function (params) {
                return params;
            },
            // Provide a nicely formatted default renderer used by both dropdown and button
            formatItem: formatItem,
            // Header action configuration (to avoid ambiguous "x")
            headerActionMode: 'clear', // 'clear' | 'close' | 'both' | 'none'
            headerClearIconClass: 'bi bi-trash',
            headerCloseIconClass: 'bi bi-x-lg',
            headerClearText: 'Clear',
            headerCloseText: 'Close',
            showHeaderActionText: false
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

                // Backward compatibility: support legacy option name `emptyText`
                if (o && typeof o.emptyText !== 'undefined' && typeof settings.btnEmptyText === 'string') {
                    settings.btnEmptyText = o.emptyText;
                }

                // Deprecation notices for truly unsupported options
                if (settings.debug && o) {
                    if (Object.prototype.hasOwnProperty.call(o, 'multipleBadgeClass') ||
                        Object.prototype.hasOwnProperty.call(o, 'formatBadge')) {
                        console.warn('jquery.bsSelectSuggest: Options multipleBadgeClass and formatBadge are deprecated and ignored. Use formatItem to control rendering.');
                    }
                }

                $input.data('settings', settings);
                if (settings.multiple) {
                    const raw = $input.val();
                    let selected = [];
                    if (!isValueEmpty(raw)) {
                        if (Array.isArray(raw)) {
                            selected = raw.map(String);
                        } else if (typeof raw === 'string') {
                            // Fallback: split common separators
                            selected = raw.split(/[;,\s]+/).filter(v => !isValueEmpty(v));
                        }
                    }
                    $input.data('selected', selected);
                    $input.data('selectedItems', []);
                    // Reflect array into the hidden input for consistency
                    $input.val(selected);
                }
                if (settings.debug) {
                    console.log('init', settings);
                }
            }

            buildDropdown($input);

            events($input);

            const currentVal = $input.val();
            const value = isValueEmpty(currentVal) ? null : (Array.isArray(currentVal) ? currentVal : String(currentVal).trim());
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
                    // Normalize to array for multiple; keep single as-is
                    let p = params;
                    if (getSettings($input).multiple) {
                        if (Array.isArray(params)) {
                            p = params.map(String);
                        } else if (params == null || params === '') {
                            p = [];
                        } else if (typeof params === 'string') {
                            p = params.split(/[;,\s]+/).filter(v => !isValueEmpty(v));
                        } else {
                            p = [String(params)];
                        }
                    }
                    getData($input, false, p, params2 ?? false).then(() => {
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
