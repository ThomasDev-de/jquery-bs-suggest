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
        const t = settings.translations || {};
        const showText = !!settings.showHeaderActionText;
        // Backward-compat: headerClearIconClass/headerCloseIconClass map into icons if present
        const icons = settings.icons || {};
        const clearIconHtml = icons.clear || (settings.headerClearIconClass ? `<i class="${settings.headerClearIconClass}"></i>` : '<i class="bi bi-trash"></i>');
        const closeIconHtml = icons.close || (settings.headerCloseIconClass ? `<i class="${settings.headerCloseIconClass}"></i>` : '<i class="bi bi-x-lg"></i>');
        const clearLabel = t.clear || 'Clear';
        const closeLabel = t.close || 'Close';
        const btnBaseCls = 'btn btn-light bg-transparent ms-2';
        const buildClearBtn = () => `
                <button role="button" type="button" class="${btnBaseCls} js-webcito-clear" title="${clearLabel}" aria-label="${clearLabel}">
                    ${clearIconHtml}${showText ? ` <span class="ms-1">${clearLabel}</span>` : ''}
                </button>`;
        const buildCloseBtn = () => `
                <button role="button" type="button" class="${btnBaseCls} js-webcito-close" title="${closeLabel}" aria-label="${closeLabel}">
                    ${closeIconHtml}${showText ? ` <span class="ms-1">${closeLabel}</span>` : ''}
                </button>`;
        // Always show both actions (headerActionMode removed)
        let headerActionsHtml = buildClearBtn() + buildCloseBtn();
        const headerClass = 'p-0 d-flex flex-nowrap align-items-center justify-content-between';
        const searchInputClass = 'form-control ms-2 form-control-sm flex-fill border-0 bg-transparent px-1';
        const listMax = 400;
        return `
<div class="dropdown">
    <button type="button" class="js-suggest-btn ${settings.btnClass} ${disabledClass} d-flex align-items-center" aria-expanded="false" style="width:${settings.btnWidth}">
        <div class="js-selected-text overflow-visible">${t.placeholder || 'Please choose..'}</div>
    </button>
    <div class="dropdown-menu bg-body p-0 mt-1 shadow rounded-3" style="min-width: 250px">
        <div class="w-100">
            <div class="${headerClass}">
                <input autocomplete="false" type="search" class="${searchInputClass}" placeholder="${t.search || 'Search'}">
                ${headerActionsHtml}
            </div>
            <div class="js-suggest-results" style="max-height: ${listMax}px; overflow-y: auto;"></div>
            <div class="p-2 p-1 fw-light fst-italic d-flex align-items-center">
                <small class="suggest-status-text">${t.waiting || 'Waiting for typing'}</small>
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
    function refresh($input, preserveSelection = true) {
        const settings = $input.data('settings');
        // Preserve current selection explicitly before rebuilding (optional)
        const wasMultiple = !!(settings && settings.multiple);
        const preservedIds = preserveSelection && wasMultiple ? ((($input.data('selected')) || []).map(String)) : null;
        const preservedSingle = preserveSelection && !wasMultiple ? $input.val() : null;

        destroy($input, false);
        // Re-init with previous settings
        $input.suggest(settings);

        if (!preserveSelection) {
            // Do not restore previous selection. If new settings contain `selected`,
            // initial hydration will be handled by init logic. Otherwise, leave UI as placeholder.
            return;
        }

        // Restore selection without triggering change
        try {
            if (wasMultiple) {
                if (preservedIds && preservedIds.length) {
                    getData($input, false, preservedIds, false).then(() => {});
                } else {
                    // ensure clean UI
                    setDropdownText($input, null);
                }
            } else {
                if (!isValueEmpty(preservedSingle)) {
                    getData($input, false, String(preservedSingle), false).then(() => {});
                } else {
                    setDropdownText($input, null);
                }
            }
        } catch (e) {
            // no-op; best-effort restore
        }
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

    // Escapes HTML for safe text-only badge rendering inside the button
    function escapeHtml(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Button renderer: neutral chip (border only), text-only, optional inline remove control
    function renderButtonItem(item, options) {
        const opts = options || {};
        const text = !isValueEmpty(item && item.text) ? String(item.text) : String((item && item.id) ?? '');
        const idStr = String(item && item.id != null ? item.id : '');
        const removeIcon = opts.removeIconHtml || '<i class="bi bi-x"></i>';
        const removeHtml = opts.showRemove ? (
            `<span class="js-suggest-remove position-absolute top-0 start-100 translate-middle rounded-circle border-0 text-bg-light p-0"
  style="line-height:1;opacity:.8;"
  data-id="${idStr}" aria-label="Remove">${removeIcon}</span>`
        ) : '';

        return `
  <span class="d-inline-flex gap-2 overflow-visible align-items-center border rounded-3 px-3 py-0 bg-transparent position-relative">
    <span class="text-truncate">${escapeHtml(text)}</span>
    ${removeHtml}
  </span>
`;
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

        // Multiple selection: render selected items as neutral chips inside the button.
        // Note: formatItem applies ONLY to the suggestion list, not to the button.
        if (settings.multiple) {
            const selectedItems = ($input.data('selectedItems') || []).filter(it => it && !isValueEmpty(it.id));
            const isList = !!settings.showMultipleAsList; // true => vertical list, false => floating/wrapping
            const containerClass = isList ? 'd-flex flex-column align-items-center' : 'd-flex flex-wrap align-items-center gap-2 pt-1';

            const isDisabled = wrapper.find('.js-suggest-btn').hasClass('disabled') || $input.prop('disabled');

            if (!selectedItems.length) {
                const t = (settings && settings.translations) ? settings.translations : {};
                wrapper.find('.js-selected-text').html(`<div class="${containerClass}">${t.placeholder || 'Please choose..'}</div>`);
                return;
            }

            // Sort a copy of items alphabetically by visible text to render in a predictable order (UI only)
            const sortedForRender = selectedItems.slice().sort((a, b) => {
                const ta = String(!isValueEmpty(a.text) ? a.text : a.id).toLowerCase();
                const tb = String(!isValueEmpty(b.text) ? b.text : b.id).toLowerCase();
                return ta.localeCompare(tb);
            });

            // Build item HTML using the neutral chip renderer with optional inline remove control.
            const itemsHtml = sortedForRender.map(it => {
                const idStr = String(it.id);
                const inner = renderButtonItem(it, { showRemove: !isDisabled, removeIconHtml: (settings.icons && settings.icons.remove) ? settings.icons.remove : '<i class="bi bi-x"></i>' });
                const itemWrapperClass = isList ? 'suggest-selected-item d-block w-100' : 'suggest-selected-item d-inline-block me-1 mb-1';
                return `<div class="${itemWrapperClass}" data-id="${idStr}">${inner}</div>`;
            }).join('');

            wrapper.find('.js-selected-text').html(`<div class="${containerClass}">${itemsHtml}</div>`);
            return;
        }

        // Single selection: render rich HTML in the button using formatted/formatItem when available
        // No inline remove control in single mode
        const t = (settings && settings.translations) ? settings.translations : {};
        let contentHtml = t.placeholder || 'Please choose..';
        if (!isValueEmpty(item)) {
            const hasFormatted = item && typeof item.formatted === 'string' && item.formatted.trim().length > 0;
            if (hasFormatted) {
                contentHtml = item.formatted;
            } else if (typeof settings.formatItem === 'function') {
                contentHtml = settings.formatItem(item);
            } else {
                contentHtml = formatItem(item);
            }
        }
        const container = '<div class="d-flex align-items-center text-start">' + contentHtml + '</div>';

        wrapper.find('.js-selected-text').html(container);
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
        const t = (settings && settings.translations) ? settings.translations : {};
        const wrapper = getWrapper($input);
        const searchBox = wrapper.find('[type="search"]');
        const list = wrapper.find('.js-suggest-results');

        $input.val(settings.multiple ? [] : null);
        $input.data('selected', []);
        $input.data('selectedItems', []);
        searchBox.val(null);
        list.empty();
        setStatus($input, t.waiting || 'Waiting for typing');
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
        // Re-render chips to reflect visibility of inline remove controls in multiple mode
        try {
            const settings = getSettings($input);
            if (settings.multiple) {
                setDropdownText($input, null);
            }
        } catch (e) { /* no-op */ }
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
        const list = wrapper.find('.js-suggest-results');

        if (settings.debug) {
            console.log('function', 'clear');
        }
        const valueBefore = $input.val();
        // Clear only selection, keep current search query and list intact
        $input.val(settings.multiple ? [] : null);
        $input.data('selected', []);
        $input.data('selectedItems', []);
        setDropdownText($input, null);
        // Remove selection state from list items but keep them visible; also update trailing icons
        list.find('.dropdown-item').each(function(){
            const $a = $(this);
            $a.attr('aria-selected', 'false');
            $a.removeClass('is-active');
            const icons = (settings && settings.icons) || {};
            const uncheckedIcon = icons.unchecked || '<i class="bi bi-circle"></i>';
            $a.find('.js-suggest-check').html(uncheckedIcon);
        });
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
                    if (wrapper.is(e.target) || wrapper.has(e.target).length) {
                        return;
                    }
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
                const t = (settings && settings.translations) ? settings.translations : {};
                setStatus($input, t.loading || 'Loading..');
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
            const t = (settings && settings.translations) ? settings.translations : {};
            setStatus($input, t.typing || 'typing..');
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
                    if (!(key === 'Enter' || key === ' ' || key === 'Spacebar')) {
                        return;
                    }
                }
                e.preventDefault();
                e.stopImmediatePropagation();
                clear($input); // keep dropdown open
            })
            .on('click keydown', '.js-webcito-close', function (e) {
                const isKey = e.type === 'keydown';
                if (isKey) {
                    const key = e.key || e.code;
                    if (!(key === 'Enter' || key === ' ' || key === 'Spacebar')) {
                        return;
                    }
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
                        applySelectionState(a, false, settings);
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
                        applySelectionState(a, true, settings);
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
                listEl.find('.dropdown-item.is-active').each(function(){
                    const $it = $(this);
                    applySelectionState($it, false, settings);
                });
                applySelectionState(a, true, settings);

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
                e.preventDefault();
                e.stopImmediatePropagation(); // ensure nothing else handles it
            })
            // Keyboard support: remove on Enter/Space without opening dropdown
            .on('keydown', '.js-suggest-remove', function (e) {
                const key = e.key || e.code;
                if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    // simulate click removal below
                    $(this).trigger('click');
                }
            })
            .on('click', '.js-suggest-remove', function (e) {
                // Remove a selected item directly from the button
                e.preventDefault();
                e.stopImmediatePropagation(); // do not toggle dropdown
                const btn = $(e.currentTarget);
                const id = String(btn.data('id'));
                if (settings.multiple) {
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
                    list.find('.dropdown-item.is-active').each(function(){
                        const $a = $(this);
                        const it = $a.data('item');
                        if (it && String(it.id) === id) {
                            applySelectionState($a, false, settings);
                        }
                    });
                    if (String(before) !== String(selectedIds)) {
                        trigger($input, 'change.bs.suggest', [selectedIds, selectedItems]);
                    }
                } else {
                    // single: clear selection
                    const valueBefore = $input.val();
                    $input.val(null);
                    setDropdownText($input, null);
                    trigger($input, 'change.bs.suggest', [valueBefore, null]);
                }
            })
            .on('hidden.bs.dropdown', '.dropdown', function () {
                if (settings.debug) {
                    console.log('hidden.bs.dropdown', '.dropdown');
                }
                list.empty();
                searchBox.val(null);
                const t = (settings && settings.translations) ? settings.translations : {};
                setStatus($input, t.waiting || 'Waiting for typing');
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
        // Mark selected items (no background colors; use aria-selected + trailing icon)
        const settings = getSettings($input);
        const idStr = String(item.id);
        const isSelected = settings.multiple ? (($input.data('selected') || []).map(String).includes(idStr)) : (String($input.val()) === idStr);
        applySelectionState(a, isSelected, settings);
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
            // If the user supplied a custom formatter, do not touch/highlight content
            html = settings.formatItem(item);
        } else {
            // Built-in formatting (no query highlighting)
            html = formatItem(item);
        }
        // Build anchor as a horizontal row; inner content remains stacked
        const contentClasses = 'd-flex flex-column align-items-start';
        if (asDropdownItem) {
            const densityClass = 'px-2 py-1';
            // Determine selected state to choose trailing icon
            const settings = getSettings($input);
            const idStr = String(item.id);
            let isSelected = false;
            if (settings.multiple) {
                const selectedIds = ($input.data('selected') || []).map(String);
                isSelected = selectedIds.includes(idStr);
            } else {
                isSelected = String($input.val()) === idStr;
            }
            const icons = settings.icons || {};
            const checkedIcon = icons.checked || '<i class="bi bi-check2"></i>';
            const uncheckedIcon = icons.unchecked || '<i class="bi bi-circle"></i>';
            const trailIcon = isSelected ? checkedIcon : uncheckedIcon;
            const ariaSel = isSelected ? 'true' : 'false';
            // Use bg-transparent to suppress Bootstrap's default active/hover background (no extra CSS)
            return `<a class="dropdown-item bg-transparent text-reset d-flex align-items-center justify-content-between gap-2 ${densityClass}" href="#" role="option" aria-selected="${ariaSel}"><span class="flex-grow-1 ${contentClasses}">${html}</span><span class="mx-2 js-suggest-check">${trailIcon}</span></a>`;
        }
        return `<div class="${contentClasses}">${html}</div>`;
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

    // Helper: apply selection visuals to a dropdown item (no background colors)
    function applySelectionState($a, isSelected, settings) {
        try {
            $a.attr('aria-selected', isSelected ? 'true' : 'false');
            // Ensure we never rely on Bootstrap's .active coloring
            $a.removeClass('active').toggleClass('is-active', !!isSelected);
            const icons = (settings && settings.icons) || {};
            const checkedIcon = icons.checked || '<i class="bi bi-check2"></i>';
            const uncheckedIcon = icons.unchecked || '<i class="bi bi-circle"></i>';
            const trail = $a.find('.js-suggest-check');
            if (trail.length) {
                trail.html(isSelected ? checkedIcon : uncheckedIcon);
            }
        } catch (e) { /* no-op */ }
    }

    function formatItem(item) {
        // Modern, clean default rendering without forcing a light background.
        // Uses only Bootstrap utilities.
        const rawText = String(item.text ?? item.id ?? '');
        const hasSub = Object.prototype.hasOwnProperty.call(item, 'subtext') && !isValueEmpty(item.subtext);
        function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
        const text = esc(rawText);
        // Use opacity instead of text-muted to keep good contrast on dark/active backgrounds
        const sub = hasSub ? `<div class="small opacity-75 mt-1">${esc(item.subtext)}</div>` : '';
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
            // All UI texts live here (new compact schema)
            translations: {
                search: 'Search',
                placeholder: 'Please choose..',
                waiting: 'Waiting for typing',
                typing: 'typing..',
                loading: 'Loading..',
                clear: 'Clear',
                close: 'Close'
            },
            // Icons used by controls inside the widget
            icons: {
                remove: '<i class="bi bi-x"></i>',
                clear: '<i class="bi bi-trash"></i>',
                close: '<i class="bi bi-x-lg"></i>',
                // New: icons for list selection state (dropdown items)
                checked: '<i class="bi bi-check-square-fill"></i>',
                unchecked: '<i class="bi bi-square"></i>'
            },
            // Initial selection: in single mode a scalar (string|number|any), in multiple mode an array of ids
            // When defined and not null/empty, the plugin will resolve it via the backend and preselect it on init
            selected: null,
            queryParams: function (params) {
                return params;
            },
            // Renderer for suggestion list items only (button uses an internal text-only badge renderer)
            formatItem: formatItem,
            // Whether header action buttons should show their text label next to the icon
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

                const settings = $.extend(true, {}, DEFAULTS, o);

                // Backward compatibility: map legacy flat options and old translation keys into new compact schema
                if (o) {
                    const t = settings.translations || (settings.translations = {});
                    // Flat options (very old)
                    if (typeof o.emptyText !== 'undefined' && typeof t.placeholder === 'undefined') { t.placeholder = o.emptyText; }
                    if (typeof o.btnEmptyText !== 'undefined' && typeof t.placeholder === 'undefined') { t.placeholder = o.btnEmptyText; }
                    if (typeof o.searchPlaceholderText !== 'undefined' && typeof t.search === 'undefined') { t.search = o.searchPlaceholderText; }
                    if (typeof o.waitingForTypingText !== 'undefined' && typeof t.waiting === 'undefined') { t.waiting = o.waitingForTypingText; }
                    if (typeof o.typingText !== 'undefined' && typeof t.typing === 'undefined') { t.typing = o.typingText; }
                    if (typeof o.loadingText !== 'undefined' && typeof t.loading === 'undefined') { t.loading = o.loadingText; }
                    if (typeof o.headerClearText !== 'undefined' && typeof t.clear === 'undefined') { t.clear = o.headerClearText; }
                    if (typeof o.headerCloseText !== 'undefined' && typeof t.close === 'undefined') { t.close = o.headerCloseText; }

                    // If user provided translations object with old keys, map them as well
                    if (o.translations && typeof o.translations === 'object') {
                        const ot = o.translations;
                        if (typeof ot.btnEmptyText !== 'undefined' && typeof t.placeholder === 'undefined') { t.placeholder = ot.btnEmptyText; }
                        if (typeof ot.searchPlaceholderText !== 'undefined' && typeof t.search === 'undefined') { t.search = ot.searchPlaceholderText; }
                        if (typeof ot.waitingForTypingText !== 'undefined' && typeof t.waiting === 'undefined') { t.waiting = ot.waitingForTypingText; }
                        if (typeof ot.typingText !== 'undefined' && typeof t.typing === 'undefined') { t.typing = ot.typingText; }
                        if (typeof ot.loadingText !== 'undefined' && typeof t.loading === 'undefined') { t.loading = ot.loadingText; }
                        if (typeof ot.headerClearText !== 'undefined' && typeof t.clear === 'undefined') { t.clear = ot.headerClearText; }
                        if (typeof ot.headerCloseText !== 'undefined' && typeof t.close === 'undefined') { t.close = ot.headerCloseText; }
                    }
                }

                // Deprecation notices for removed/unsupported visual options
                if (settings.debug && o) {
                    if (Object.prototype.hasOwnProperty.call(o, 'multipleBadgeClass') ||
                        Object.prototype.hasOwnProperty.call(o, 'formatBadge')) {
                        console.warn('jquery.bsSelectSuggest: Options multipleBadgeClass and formatBadge are deprecated and ignored. Use formatItem to control rendering.');
                    }
                    const deprecated = ['menuClass','density','menuMaxHeight','showCheckmark','checkIconHtml','highlightQuery','headerClass','searchInputClass','itemClass','activeItemClass','headerActionMode'];
                    deprecated.forEach(function(key){
                        if (Object.prototype.hasOwnProperty.call(o, key)) {
                            console.warn('jquery.bsSelectSuggest: Option "'+key+'" has been removed. Visual tuning is internal now.');
                        }
                    });
                    // Map legacy icon class options into the new icons map for compatibility
                    if (Object.prototype.hasOwnProperty.call(o, 'headerClearIconClass')) {
                        settings.icons = settings.icons || {};
                        settings.icons.clear = `<i class="${o.headerClearIconClass}"></i>`;
                    }
                    if (Object.prototype.hasOwnProperty.call(o, 'headerCloseIconClass')) {
                        settings.icons = settings.icons || {};
                        settings.icons.close = `<i class="${o.headerCloseIconClass}"></i>`;
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

            // Determine initial value to resolve: prefer explicit options.selected when provided
            const settingsInit = getSettings($input);
            let initialValue = null;
            const hasSelectedOption = settingsInit && !isValueEmpty(settingsInit.selected);
            if (hasSelectedOption) {
                if (settingsInit.multiple) {
                    if (Array.isArray(settingsInit.selected)) {
                        initialValue = settingsInit.selected.map(String);
                    } else if (typeof settingsInit.selected === 'string') {
                        initialValue = settingsInit.selected.split(/[;.,\s]+/).filter(v => !isValueEmpty(v));
                    } else {
                        initialValue = [String(settingsInit.selected)];
                    }
                } else {
                    initialValue = String(settingsInit.selected);
                }
            } else {
                const currentVal = $input.val();
                initialValue = isValueEmpty(currentVal) ? null : (Array.isArray(currentVal) ? currentVal : String(currentVal).trim());
            }

            if (!isValueEmpty(initialValue)) {
                // Resolve without triggering change event
                getData($input, false, initialValue, false).then(() => {
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
                    const nextSettings = $.extend(true, {}, DEFAULTS, settings, params || {});
                    $input.data('settings', nextSettings);
                    // If caller provided `selected`, do not preserve previous selection on refresh
                    const hasSelectedProp = params && Object.prototype.hasOwnProperty.call(params, 'selected');
                    const preserve = !hasSelectedProp;
                    refresh($input, preserve);
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
