/** global $ */
(function ($) {
    const DEFAULTS = {
        limit: 10,
        typingInterval: 400,
        darkMenu: false,
        btnWidth: 'fit-content',
        btnClass: 'btn btn-outline-secondary',
        searchPlaceholderText: "Search",
        emptyText: 'Please choose..',
        waitingForTypingText: 'Waiting for typing',
        typingText: 'typing..',
        loadingText: 'Loading..',
    };

    function generateId() {
        return "webcito_suggestion_" + $('[id^="webcito_suggestion_"]').length;
    }

    function getTemplate(select) {
        let settings = select.data('settings');
        let darkClass = settings.darkMenu ? 'dropdown-menu-dark' : '';
        let closeBtnClass = settings.darkMenu ? 'btn-close-white' : '';


        return `
            <div class=" btn-group dropdown">
                  <button type="button" class=" d-flex align-items-center justify-content-between  ${settings.btnClass} dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" style="width:${settings.btnWidth}">
                    <span class="js-selected-text">${settings.emptyText}</span>
                  </button>
                  <div class="dropdown-menu ${darkClass} p-0 mt-1">
                    <div class="card bg-transparent border-0 m-0 w-100">
                        <div class="card-header d-flex flex-nowrap align-items-center justify-content-between">
                            <input autocomplete="false" type="search" class="form-control-sm flex-fill" placeholder="${settings.searchPlaceholderText}">
                            <button role="button" class=" btn-close ${closeBtnClass} ms-2 js-webcito-reset"></button>
                        </div>
                         <div class="card-body p-0">

                        </div>
                        <div class="card-footer bg-secondary text-bg-secondary p-1 fw-light fst-italic d-flex align-items-center">
                            <small>${settings.waitingForTypingText}</small>
                        </div>
                    </div>
                  </div>
            </div>`;
    }

    function buildDropdown(select) {

        let w = select.closest('[id^="webcito_suggestion_"]');
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
        return wrap;

    }

    $.fn.suggest = function (options, params) {
        return $(this).each(function(i, e){
            const select = $(this),
                isOptionsSet = typeof options === "object" || typeof options === "undefined",
                isCallMethod = typeof options === "string";
            let xhr = null;
            let typingTimer;

            // settings = $.extend(true, DEFAULTS, options && typeof options === "object" ? options : {});

            if (isOptionsSet){
                select.data('settings',  $.extend(true, DEFAULTS, options || {}));
            }

            const wrapper = buildDropdown(select);

            const list = wrapper.find('.card-body'),
                statusBox = wrapper.find('.card-footer small'),
                searchBox = wrapper.find('[type="search"]');

            // let method = options && typeof options === "string" ? options : null;

            if (select.data('init') !== true) {
                events();
                select.data('init', true);
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
                        let data = a.data();
                        select.trigger('suggest-change', [data.id, data.text]);

                        let value = a.attr('href').substring(1);
                        select.val(value);
                        setDropdownText(a.html());
                    })
                    .on('click', '.js-webcito-reset', function (e) {
                        e.preventDefault();
                        select.val(null);
                        searchBox.val(null);
                        list.empty();
                        setDropdownText();
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
                xhr = $.get(select.data('bsTarget'), data, function (res) {
                    if (res.error) {
                        select.trigger('suggest-error', [res.error]);
                    } else {
                        if (search) {
                            list.empty();
                            res.items.forEach(item => {
                                let div = $('<div>', {
                                    html: `<a class="dropdown-item" href="#${item.id}">${item.text}</a>`,
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
                            setDropdownText(res.text);
                        }
                    }
                });
            }

            function setDropdownText(html) {
                let settings = select.data('settings');
                wrapper.find('.js-selected-text').html(html || settings.emptyText);
            }

            if (isCallMethod) {
                let settings = select.data('settings');
                switch (options.toLowerCase()) {
                    case 'val':
                        select.val(null);
                        searchBox.val(null);
                        list.empty();
                        setDropdownText();
                        setStatus(settings.waitingForTypingText);
                        getData(false, params);
                        break;
                }
            }

            // return the reference for chaining
            return select;
        });
    };
}(jQuery));