// noinspection DuplicatedCode

/** global $ */
(function ($) {
    const debug = false;

    function generateId() {
        return "webcito_suggestion_" + getGUID();
    }

    function getTemplate(select) {
        let settings = select.data('settings');
        let darkClass = settings.darkMenu ? 'dropdown-menu-dark' : '';
        let closeBtnClass = settings.darkMenu ? 'btn-close-white' : '';
        const template = `
            <div class="dropdown">
                  <div class="${settings.btnClass} d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false" style="width:${settings.btnWidth}">
                        <span class="js-selected-text">${settings.emptyText}</span>
                  </div>
                  <div class="dropdown-menu ${darkClass} p-0 mt-1">
                    <div class="card bg-transparent border-0 m-0 w-100">
                        <div class="card-header d-flex flex-nowrap align-items-center justify-content-between">
                            <input autocomplete="false" type="search" class="form-control-sm flex-fill" placeholder="${settings.searchPlaceholderText}">
                            <button role="button" class=" btn-close ${closeBtnClass} ms-2 js-webcito-reset"></button>
                        </div>
                         <div class="card-body p-0">

                        </div>
                        <div class="card-footer bg-secondary text-bg-secondary p-1 fw-light fst-italic d-flex align-items-center">
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

    function getWrapper(select) {
        return select.closest('[id^="webcito_suggestion_"]');
    }

    function buildDropdown(select) {

        let w = getWrapper(select);
        if (w.length === 1) {
            return w;
        }

        const id = generateId();
        const wrap = $('<div>', {
            id: id
        }).insertAfter(select);
        select.hide();
        select.appendTo(wrap);
        const template = getTemplate(select);
        $(template).prependTo(wrap);
        // setTimeout(function () {
        if (wrap.find('.js-selected-text').text() === "") {
            setDropdownText(select, null);
        }
        // }, 40);
        return wrap;

    }

    function refresh(select) {
        const settings = select.data('settings');
        destroy(select, false);
        select.suggest(settings);
    }

    function destroy(select, show) {
        let valBefore = select.val();
        let wrapper = getWrapper(select);
        select.insertBefore(wrapper);
        wrapper.remove();
        select.val(valBefore);
        select.removeClass('js-suggest');
        select.removeData('settings');
        select.removeData('selected');
        select.removeData('initSuggest');
        if (show)
            select.show();
    }

    function setDropdownText(select, html) {

        const wrapper = getWrapper(select);
        const settings = select.data('settings');
        if (debug) {
            console.log('setDropdownText', html, wrapper, settings);
        }
        wrapper.find('.js-selected-text').html('<span class="px-2 py-1 d-inline">' + (html || settings.emptyText) + '</span>');
    }

    function getGUID() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    function reset(select) {
        const settings = select.data('settings');
        const wrapper = getWrapper(select);
        const searchBox = wrapper.find('[type="search"]');
        const list = wrapper.find('.card-body');

        select.val(null);
        searchBox.val(null);
        list.empty();
        setStatus(select, settings.waitingForTypingText);
    }

    function setStatus(select, text) {
        const wrapper = getWrapper(select);
        const statusBox = wrapper.find('.suggest-status-text');
        statusBox.html(text);
    }

    function getSettings(select) {
        return select.data('settings') || {};
    }

    function events(select) {
        const wrapper = getWrapper(select);

        const searchBox = wrapper.find('[type="search"]');
        const settings = getSettings(select);
        let typingTimer = select.data('typingTimer') || null;

        const list = wrapper.find('.card-body');

        searchBox.on('keyup', function () {
            if (debug) {
                console.log('keyup');
            }
            if (typingTimer !== null) {
                clearTimeout(typingTimer);
            }

            typingTimer = setTimeout(function () {
                setStatus(select, settings.loadingText);
                getData(select);
            }, settings.typingInterval);
            select.data('typingTimer', typingTimer);
        });

        searchBox.on('keydown', function () {
            if (debug) {
                console.log('keydown');
            }
            let settings = getSettings(select);
            if (typingTimer !== null) {
                clearTimeout(typingTimer);
            }
            select.data('typingTimer', typingTimer);
            setStatus(select, settings.typingText);
        });

        wrapper
            .on('click', 'a.dropdown-item', function (e) {
                e.preventDefault();
                if (debug) {
                    console.log('click', 'a.dropdown-item');
                }
                let a = $(e.currentTarget);
                let item = a.data('item');
                select.trigger('change', [item.id, item.text]);

                let value = item.id;
                select.val(value);
                setDropdownText(select, a.html());
            })
            .on('click', '.js-webcito-reset', function (e) {
                e.preventDefault();
                if (debug) {
                    console.log('click', '.js-webcito-reset');
                }
                // reset(select);
                select.val(null);
                searchBox.val(null);
                list.empty();
                setDropdownText(select, null);
                let settings = select.data('settings');
                setStatus(select, settings.waitingForTypingText);
            })
            .on('hidden.bs.dropdown', '.dropdown', function () {
                if (debug) {
                    console.log('hidden.bs.dropdown', '.dropdown');
                }
                list.empty();
                searchBox.val(null);
                let settings = getSettings(select);
                setStatus(select, settings.waitingForTypingText);
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
                let settings = getSettings(select);
                if (settings.loadDataOnShow){
                    getData(select)
                }

            });
    }

    function getData(select, search = true, val) {
        let settings = getSettings(select);
        let wrapper = getWrapper(select);
        const searchBox = wrapper.find('[type="search"]');
        const list = wrapper.find('.card-body');
        let xhr = select.data('xhr') || null;

        if (xhr !== null) {
            xhr.abort()
            xhr = null;
        }

        let data = search ? {q: searchBox.val() || null, limit: settings.limit} : {value: val};
        let query = settings.queryParams(data);
        let newXhr = $.get(select.data('bsTarget'), query, function (res) {
            if (res.error) {
                select.trigger('error', [res.error]);
            } else {
                if (search) {
                    list.empty();
                    res.items.forEach(item => {
                        let div = $('<div>', {
                            html: `<a class="dropdown-item" href="#">${item.text}</a>`,
                        }).appendTo(list);
                        div.find('a').data('item', item);
                    });
                    if (res.items.length !== res.total) {
                        setStatus(select, `showing ${res.items.length} / ${res.total} results`);
                    } else {
                        setStatus(select, 'results: ' + res.items.length);
                    }

                } else {
                    select.val(res.id);
                    setDropdownText(select, res.text);
                }
            }
        });
        select.data('xhr', newXhr);
    }

    $.fn.suggest = function (options, params) {

        if (!$(this).length) {
            return $(this); // cancel
        }

        if ($(this).length > 1) {
            return $(this).each(function () {
                return $(this).suggest(options, params); // return an instance of your own in each case
            })
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

        const select = $(this); // The single instance
        const isOptionsSet = typeof options === "object" || typeof options === "undefined";
        const isCallMethod = typeof options === "string";

        // init
        if (select.data('initSuggest') !== true) {

            select.data('initSuggest', true);
            select.addClass('js-suggest');

            if (isOptionsSet || !select.data('settings')) {
                const settings = $.extend(true, DEFAULTS, options || {});
                select.data('settings', settings);
                select.data('selected', select.val().split(settings.valueSeparator));
                if (debug) {
                    console.log('init', select, settings);
                }
            }

            buildDropdown(select);

            events(select);

            if (select.val() !== "") {
                getData(select, false, select.val());
            }
        }

        // call methods
        if (isCallMethod) {
            switch (options.toLowerCase()) {
                case 'val':
                    if (debug) {
                        console.log('method', 'val', params, select);
                    }
                    reset(select);
                    getData(select, false, params);
                    break;
                case 'destroy':
                    if (debug) {
                        console.log('method', 'destroy', select);
                    }
                    destroy(select, true);
                    break;
                case 'refresh':
                    if (debug) {
                        console.log('method', 'refresh', select);
                    }
                    refresh(select);
                    break;
                case 'updateoptions': {
                    if (debug) {
                        console.log('method', 'updateoptions', params, select);
                    }
                    const oldSettings = getSettings(select);
                    select.data('settings', $.extend(true, DEFAULTS, oldSettings, params || {}));
                    refresh(select);
                    break;
                }
            }
        }

        // return the reference for chaining
        return select;
    };
}(jQuery));