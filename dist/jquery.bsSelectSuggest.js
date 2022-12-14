/** global $ */
(function ($) {
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
        queryParams: function(params){}
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
                  <div class="form-control form-control border-dark  d-flex align-items-center" data-bs-toggle="dropdown" aria-expanded="false" style="width:${settings.btnWidth}">
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
        getWrapper(select).find('.js-selected-text').html('<span class="px-2 py-1 border border-dark rounded d-inline">' +
            (html || settings.emptyText) + '</span>');
    }

    $.fn.suggest = function (options, params) {
        return $(this).each(function () {
            const select = $(this),
                isOptionsSet = typeof options === "object" || typeof options === "undefined",
                isCallMethod = typeof options === "string";
            let xhr = null;
            let typingTimer;
            let selected = [];

            if (isOptionsSet) {
                let settings = $.extend(true, DEFAULTS, options || {});
                select.data('settings', settings);
                select.data('selected', select.val().split(settings.valueSeparator));
            }

            const wrapper = buildDropdown(select);

            const list = wrapper.find('.card-body'),
                statusBox = wrapper.find('.suggest-status-text'),
                searchBox = wrapper.find('[type="search"]');

            // let method = options && typeof options === "string" ? options : null;

            if (select.data('init') !== true) {
                events();
                select.data('init', true);
                if (select.val() !== "") {
                    getData(false, select.val());
                }
            }

            function setStatus(text) {
                statusBox.html(text);
            }

            function events() {

                searchBox.on('keyup', function () {
                    let settings = select.data('settings');
                    clearTimeout(typingTimer);
                    typingTimer = setTimeout(doneTyping, settings.typingInterval);
                });

                searchBox.on('keydown', function () {
                    let settings = select.data('settings');
                    clearTimeout(typingTimer);
                    setStatus(settings.typingText);
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
                        setStatus(settings.waitingForTypingText);
                    })
                    .on('hidden.bs.dropdown', '.dropdown', function () {
                        list.empty();
                        searchBox.val(null);
                        let settings = select.data('settings');
                        setStatus(settings.waitingForTypingText);
                    })
                    .on('shown.bs.dropdown', '.dropdown', function () {
                        searchBox.focus();
                    });
            }

            function doneTyping() {
                let settings = select.data('settings');
                setStatus(settings.loadingText);
                getData()
            }

            function getData(search = true, val) {
                let settings = select.data('settings');
                if (xhr !== null) {
                    xhr.abort()
                    xhr = null;
                }

                let data = search ? {q: searchBox.val() || null, limit: settings.limit} : {value: val};
                xhr = $.get(select.data('bsTarget'), settings.queryParams(data), function (res) {
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
                                setStatus(`showing ${res.items.length} / ${res.total} results`);
                            } else {
                                setStatus('results: ' + res.items.length);
                            }

                        } else {
                            select.val(res.id);
                            setDropdownText(res.text, select);
                        }
                    }
                });
            }


            function reset() {
                let settings = select.data('settings');
                select.val(null);
                searchBox.val(null);
                list.empty();
                // setDropdownText();
                setStatus(settings.waitingForTypingText);
            }


            if (isCallMethod) {
                switch (options.toLowerCase()) {
                    case 'val':
                        reset();
                        let value = params;
                        let isEmpty = !value || value === '';
                        if (isEmpty) {
                            value = [];
                        } else {
                            let isArray = Array.isArray(value);
                            if (isArray) {
                                if (typeof value[0] === 'object') {
                                    // set values directly
                                }
                                else {

                                }
                            }
                        }

                        getData(false, params);
                        break;
                    case 'destroy':
                        destroy(select, true);
                        break;
                    case 'refresh':
                        refresh(select);
                        break;
                    case 'updateoptions': {
                        select.data('settings', $.extend(true, select.data('settings'), params || {}, DEFAULTS));
                        console.log(select.data('settings'));
                        refresh(select);
                        break;
                    }
                }
            }

            // return the reference for chaining
            return select;
        });
    };
}(jQuery));