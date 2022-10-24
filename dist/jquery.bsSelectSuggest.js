/** global $ */
(function ($) {
    $.fn.suggest = function (options, params) {
        let select = $(this),
            typingTimer,
            doneTypingInterval = 400,
            xhr = null,
            settings = $.extend(true, {
                limit: 10,
                darkMenu: false,
                btnClass: 'btn btn-outline-secondary',
                emptyText: 'Please choose..',
                waitingForTypingText: 'Waiting for typing',
                typingText: 'typing..',
                loadingText: 'Loading..',
            }, options && typeof options === "object" ? options : {});

        let wrapper = buildDropdown();
        let list = wrapper.find('.card-body'),
            statusBox = wrapper.find('.card-footer small'),
            searchBox = wrapper.find('[type="search"]');

        let method = options && typeof options === "string" ? options : null;

        if (select.data('init') !== true) {
            events();
            select.data('init', true);
        }

        function getTemplate() {
            let darkClass = settings.darkMenu ? 'dropdown-menu-dark' : '';

            return `
            <div class="btn-group w-100 dropdown">
                  <button type="button" class="d-flex align-items-center justify-content-between  ${settings.btnClass} dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                    <span class="js-selected-text">${settings.emptyText}</span>
                  </button>
                  <div class="dropdown-menu ${darkClass} p-0 mt-1 w-100">
                    <div class="card border-0 m-0 w-100">
                        <div class="card-header d-flex flex-nowrap align-items-center">
                            <input autocomplete="false" type="search" name="q" class="form-control-sm flex-fill" placeholder="Search">
                            <button role="button" class=" btn-close ms-1 js-webcito-reset"></button>
                        </div>
                         <div class="card-body p-0">

                        </div>
                        <div class="card-footer bg-dark text-bg-dark py-0 px-1 fw-light fst-italic d-flex align-items-center">
                            <small>${settings.waitingForTypingText}</small>
                        </div>
                    </div>
                  </div>
            </div>`;
        }

        function buildDropdown() {
            console.log('LOG: build dropdown');
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
            $(getTemplate()).insertBefore(select);
            return wrap;

        }

        function setStatus(text) {
            statusBox.html(text);
        }

        function generateId() {
            return "webcito_suggestion_" + $('[id^="webcito_suggestion_"]').length;
        }

        function events() {
            searchBox.on('keyup', function () {
                clearTimeout(typingTimer);
                typingTimer = setTimeout(doneTyping, doneTypingInterval);
            });

            searchBox.on('keydown', function () {
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
                    setStatus(settings.waitingForTypingText);
                })
                .on('hidden.bs.dropdown', '.dropdown', function () {
                    list.empty();
                    searchBox.val(null);
                    setStatus('Warte auf Eingabe');
                })
                .on('shown.bs.dropdown', '.dropdown', function () {
                    searchBox.focus();
                });
        }

        function doneTyping() {

            setStatus(settings.loadingText);
            getData()
        }

        function getData(search = true, val) {

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
                            // div.find('a').data('data', item.data);
                            // div.find('a').data('text', item.text);
                            // div.find('a').data('id', item.id);
                        });
                        if (res.items.length !== res.total) {
                            setStatus(`<span class="badge bg-danger">Achtung, es werden nur ${res.items.length} von ${res.total} Ergebnissen angezeigt</span>`);
                        } else {
                            setStatus('Results: ' + res.items.length);
                        }

                    } else {
                        select.val(res.id);
                        setDropdownText(res.text);
                    }
                }
            });
        }

        function setDropdownText(html) {
            wrapper.find('.js-selected-text').html(html || settings.emptyText);
        }

        if (null !== method) {
            switch (method.toLowerCase()) {
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
    };
}(jQuery));