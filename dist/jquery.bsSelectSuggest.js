/** global $ */
(function ($) {
    const debug = false;
    let xhr = null;
    let typingTimer = null;
    const DEFAULTS = {
        limit: 10,
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

    function generateId() {
        return "webcito_suggestion_" + $('[id^="webcito_suggestion_"]').length;
    }

    function getTemplate(select) {
        let settings = select.data('settings');
        let darkClass = settings.darkMenu ? 'dropdown-menu-dark' : '';
        let closeBtnClass = settings.darkMenu ? 'btn-close-white' : '';
        return `
            <div class="dropdown">
                  <div class="${settings.btnClass} d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false" style="width:${settings.btnWidth}">
                    <span class="js-selected-text"></span>
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
    }

    function getWrapper(select) {
        return select.closest('[id^="webcito_suggestion_"]');
    }

    function buildDropdown(select) {

        let w = getWrapper(select);
        if (w.length) {
            return w;
        }

        let id = generateId();
        let wrap = $('<div>', {
            id: id
        }).insertAfter(select);
        select.hide();
        select.appendTo(wrap);
        $(getTemplate(select)).insertBefore(select);
        setTimeout(function () {
            if (wrap.find('.js-selected-text').text() === "") {
                setDropdownText(null, select);
            }
        }, 40);
        return wrap;

    }

    function refresh(select) {
        destroy(select, false);
        select.suggest(select.data('settings') || {});
    }

    function destroy(select, show) {
        let valBefore = select.val();
        let wrapper = getWrapper(select);
        select.insertBefore(wrapper);
        wrapper.remove();
        select.val(valBefore);
        select.data('init', false)
        if (show)
            select.show();
    }

    function setDropdownText(html, select) {
        let settings = select.data('settings');
        getWrapper(select).find('.js-selected-text').html('<span class="px-2 py-1 d-inline">' +
            (html || settings.emptyText) + '</span>');
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
        const wrapper = getWrapper(select),
            statusBox = wrapper.find('.suggest-status-text');
        statusBox.html(text);
    }

    function events(select) {
        const wrapper = getWrapper(select);
        const searchBox = wrapper.find('[type="search"]');
        const settings = select.data('settings');

        const list = wrapper.find('.card-body');

        searchBox.on('keyup', function () {
            if (typingTimer !== null) {
                clearTimeout(typingTimer);
            }

            typingTimer = setTimeout(function () {
                setStatus(select, settings.loadingText);
                getData(select);
            }, settings.typingInterval);
        });

        searchBox.on('keydown', function () {
            let settings = select.data('settings');
            if (typingTimer !== null) {
                clearTimeout(typingTimer);
            }
            setStatus(select, settings.typingText);
        });

        wrapper
            .on('click', 'a.dropdown-item', function (e) {
                e.preventDefault();
                let a = $(e.currentTarget);
                let item = a.data('item');
                select.trigger('change', [item.id, item.text]);

                let value = item.id;
                select.val(value);
                setDropdownText(a.html(), select);
            })
            .on('click', '.js-webcito-reset', function (e) {
                e.preventDefault();
                select.val(null);
                searchBox.val(null);
                list.empty();
                setDropdownText(null, select);
                let settings = select.data('settings');
                setStatus(select, settings.waitingForTypingText);
            })
            .on('hidden.bs.dropdown', '.dropdown', function () {
                list.empty();
                searchBox.val(null);
                let settings = select.data('settings');
                setStatus(select, settings.waitingForTypingText);
            })
            .on('shown.bs.dropdown', '.dropdown', function () {
                searchBox.focus();
            });
    }

    function getData(select, search = true, val) {
        let settings = select.data('settings');
        console.log(settings);
        let wrapper = getWrapper(select);
        const searchBox = wrapper.find('[type="search"]');
        const list = wrapper.find('.card-body');

        if (xhr !== null) {
            xhr.abort()
            xhr = null;
        }

        let data = search ? {q: searchBox.val() || null, limit: settings.limit} : {value: val};
        let query = settings.queryParams(data);
        xhr = $.get(select.data('bsTarget'), query, function (res) {
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
                    setDropdownText(res.text, select);
                }
            }
        });
    }


    $.fn.suggest = function (options, params) {

        if (!$(this).length === 0) {
            return $(this);
        }

        if ($(this).length > 1) {
            return $(this).each(function () {
                return $(this).suggest(options, params);
            })
        }

        const select = $(this),
            isOptionsSet = typeof options === "object" || typeof options === "undefined",
            isCallMethod = typeof options === "string";



        if (!select.data('init')) {

            if (isOptionsSet) {
                let settings = $.extend(true, DEFAULTS, options || {});
                select.data('settings', settings);
                select.data('selected', select.val().split(settings.valueSeparator));
            }

            buildDropdown(select);
            events(select);
            select.data('init', true);
            if (select.val() !== "") {
                getData(select,false, select.val());
            }
        }









        if (isCallMethod) {
            switch (options.toLowerCase()) {
                case 'val':
                    reset(select);
                    let value = params;
                    let isEmpty = !value || value === '';
                    if (isEmpty) {
                        value = [];
                    } else {
                        let isArray = Array.isArray(value);
                        if (isArray) {
                            if (typeof value[0] === 'object') {
                                // set values directly
                            } else {

                            }
                        }
                    }

                    getData(select,false, params);
                    break;
                case 'destroy':
                    destroy(select, true);
                    break;
                case 'refresh':
                    refresh(select);
                    break;
                case 'updateoptions': {
                    select.data('settings', $.extend(true, select.data('settings'), params || {}, DEFAULTS));
                    if (debug) {
                        console.log(select.data('settings'));
                    }
                    refresh(select);
                    break;
                }
            }
        }

        // return the reference for chaining
        return select;
    };
}(jQuery));