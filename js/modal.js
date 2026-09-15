/**
 * Modal System
 *
 * Owns the builder window used when configuring an Obelisk tool.
 *
 * The modal system is responsible for:
 *
 *   field rendering
 *     Converts a tool's field definitions into form controls.
 *
 *   live previews
 *     Re-renders a tool preview whenever its values change.
 *
 *   interactive previews
 *     Calls a tool's optional wirePreview() hook after preview markup
 *     is created or refreshed.
 *
 *   validation and submission
 *     Collects field values, runs the tool's validator and forwards
 *     valid values to its onSubmit() handler.
 *
 *   modal lifecycle
 *     Opens, closes and tracks the currently active builder overlay.
 *
 * The modal intentionally does not manage Favorites, Recent tools,
 * panel rendering or persistent storage. Those belong to other modules.
 *
 * Exposes:
 *   window.Obelisk.modal
 *
 * Depends on:
 *   window.Obelisk.core
 *
 * Loaded before:
 *   content.js
 */


(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    const core =
        window.Obelisk.core;


    // SAFETY:
    // Modal markup contains user-provided values, so the shared HTML
    // escaping utility must exist before this module can operate.

    if (!core) {

        console.error(
            '[Obelisk] core.js was not loaded before modal.js.'
        );

        return;
    }


    const escapeHTML =
        core.escapeHTML;


    // Active modal state

    let activeOverlay =
        null;


    /**
     * Returns the accent color supplied by the main Obelisk runtime.
     *
     * A getter is used rather than storing one fixed value so previews
     * always have access to the runtime's current accent.
     */

    const resolveAccent =
        getAccent => {

            if (
                typeof getAccent ===
                'function'
            ) {

                return (
                    getAccent() ||
                    '#c4a35a'
                );
            }


            return '#c4a35a';
        };


    // Field rendering

    /**
     * Converts one tool field definition into its modal form control.
     *
     * Supported field types:
     *   text and other standard input types
     *   textarea
     *   select
     *   range
     */

    const renderListItem =
        (
            field,
            item = {},
            index = 0
        ) => {

            const itemFields =
                field.itemFields || [];

            const controls =
                itemFields
                    .map(
                        itemField => {

                            const value =
                                item[
                                    itemField.key
                                ] ??
                                itemField.default ??
                                '';

                            const common =
                                `data-obelisk-list-prop="${escapeHTML(
                                    itemField.key
                                )}"`;

                            if (
                                itemField.type ===
                                'textarea'
                            ) {

                                return `
                                    <label class="obelisk-list-item-field">
                                        <span>${escapeHTML(
                                            itemField.label ||
                                            itemField.key
                                        )}</span>

                                        <textarea
                                            ${common}
                                            rows="${itemField.rows || 3}"
                                            placeholder="${escapeHTML(
                                                itemField.placeholder || ''
                                            )}"
                                        >${escapeHTML(value)}</textarea>
                                    </label>
                                `;
                            }

                            return `
                                <label class="obelisk-list-item-field">
                                    <span>${escapeHTML(
                                        itemField.label ||
                                        itemField.key
                                    )}</span>

                                    <input
                                        type="${itemField.type || 'text'}"
                                        ${common}
                                        value="${escapeHTML(value)}"
                                        placeholder="${escapeHTML(
                                            itemField.placeholder || ''
                                        )}"
                                    >
                                </label>
                            `;
                        }
                    )
                    .join('');

            return `
                <div
                    class="obelisk-list-item"
                    data-obelisk-list-item
                >
                    <div class="obelisk-list-item-head">
                        <span class="obelisk-list-item-index">
                            ENTRY ${index + 1}
                        </span>

                        <div class="obelisk-list-item-actions">
                            <button
                                type="button"
                                data-obelisk-list-action="up"
                                aria-label="Move entry up"
                                title="Move up"
                            >↑</button>

                            <button
                                type="button"
                                data-obelisk-list-action="down"
                                aria-label="Move entry down"
                                title="Move down"
                            >↓</button>

                            <button
                                type="button"
                                data-obelisk-list-action="remove"
                                aria-label="Remove entry"
                                title="Remove"
                            >×</button>
                        </div>
                    </div>

                    <div class="obelisk-list-item-fields">
                        ${controls}
                    </div>
                </div>
            `;
        };


    const refreshListIndices =
        list => {

            list
                .querySelectorAll(
                    '[data-obelisk-list-item]'
                )
                .forEach(
                    (item, index) => {

                        const indexEl =
                            item.querySelector(
                                '.obelisk-list-item-index'
                            );

                        if (indexEl) {
                            indexEl.textContent =
                                `ENTRY ${index + 1}`;
                        }
                    }
                );
        };


    const renderField =
        field => {

            const id =
                `obelisk-field-${field.key}`;


            const label =
                escapeHTML(
                    field.label ||
                    field.key
                );


            const description =
                field.description
                    ? `
                        <small class="obelisk-field-description">
                            ${escapeHTML(
                                field.description
                            )}
                        </small>
                    `
                    : '';


            if (
                field.type ===
                'list'
            ) {

                const initialItems =
                    Array.isArray(
                        field.default
                    )
                        ? field.default
                        : [];

                return `
                    <div
                        class="obelisk-field obelisk-list-field"
                        data-obelisk-list="${escapeHTML(
                            field.key
                        )}"
                    >
                        <span class="obelisk-field-label">
                            ${label}
                        </span>

                        ${description}

                        <div
                            class="obelisk-list-items"
                            data-obelisk-list-items
                        >
                            ${initialItems
                                .map(
                                    (item, index) =>
                                        renderListItem(
                                            field,
                                            item,
                                            index
                                        )
                                )
                                .join('')}
                        </div>

                        <button
                            type="button"
                            class="obelisk-list-add"
                            data-obelisk-list-action="add"
                        >
                            + ${escapeHTML(
                                field.addLabel ||
                                'ADD ENTRY'
                            )}
                        </button>
                    </div>
                `;
            }


            if (
                field.type ===
                'textarea'
            ) {

                return `
                    <label
                        class="obelisk-field"
                        for="${id}"
                    >
                        <span class="obelisk-field-label">
                            ${label}
                        </span>

                        ${description}

                        <textarea
                            id="${id}"
                            data-obelisk-field="${escapeHTML(
                                field.key
                            )}"
                            placeholder="${escapeHTML(
                                field.placeholder || ''
                            )}"
                            rows="${field.rows || 4}"
                        >${escapeHTML(
                            field.default || ''
                        )}</textarea>
                    </label>
                `;
            }


            if (
                field.type ===
                'select'
            ) {

                return `
                    <label
                        class="obelisk-field"
                        for="${id}"
                    >
                        <span class="obelisk-field-label">
                            ${label}
                        </span>

                        ${description}

                        <select
                            id="${id}"
                            data-obelisk-field="${escapeHTML(
                                field.key
                            )}"
                        >
                            ${(field.options || [])
                                .map(
                                    option => {

                                        const value =
                                            typeof option ===
                                                'string'
                                                ? option
                                                : option.value;


                                        const text =
                                            typeof option ===
                                                'string'
                                                ? option
                                                : option.label;


                                        return `
                                            <option
                                                value="${escapeHTML(
                                                    value
                                                )}"
                                                ${
                                                    String(value) ===
                                                    String(field.default ?? '')
                                                        ? 'selected'
                                                        : ''
                                                }
                                            >
                                                ${escapeHTML(
                                                    text
                                                )}
                                            </option>
                                        `;
                                    }
                                )
                                .join('')}
                        </select>
                    </label>
                `;
            }


            if (
                field.type ===
                'range'
            ) {

                const value =
                    field.default ??
                    field.min ??
                    0;


                return `
                    <label
                        class="obelisk-field"
                        for="${id}"
                    >
                        <span class="obelisk-field-label-row">

                            <span class="obelisk-field-label">
                                ${label}
                            </span>

                            <output
                                data-obelisk-output="${escapeHTML(
                                    field.key
                                )}"
                            >
                                ${escapeHTML(
                                    value
                                )}
                            </output>

                        </span>

                        ${description}

                        <input
                            id="${id}"
                            type="range"
                            min="${field.min ?? 0}"
                            max="${field.max ?? 100}"
                            step="${field.step ?? 1}"
                            value="${value}"
                            data-obelisk-field="${escapeHTML(
                                field.key
                            )}"
                        >
                    </label>
                `;
            }


            return `
                <label
                    class="obelisk-field"
                    for="${id}"
                >
                    <span class="obelisk-field-label">
                        ${label}
                    </span>

                    ${description}

                    <input
                        id="${id}"
                        type="${field.type || 'text'}"
                        value="${escapeHTML(
                            field.default || ''
                        )}"
                        placeholder="${escapeHTML(
                            field.placeholder || ''
                        )}"
                        data-obelisk-field="${escapeHTML(
                            field.key
                        )}"
                    >
                </label>
            `;
        };


    /**
     * Creates the initial values passed to a tool preview when its modal
     * is first opened.
     */

    const getInitialValues =
        fields => {

            const values =
                {};


            (fields || []).forEach(
                field => {

                    values[field.key] =
                        field.type === 'list'
                            ? (
                                Array.isArray(field.default)
                                    ? field.default.map(
                                        item => ({ ...item })
                                    )
                                    : []
                            )
                            : (field.default ?? '');
                }
            );


            return values;
        };


    /**
     * Reads the current values from every Obelisk field in a modal.
     */

    const collectValues =
        modal => {

            const values =
                {};


            modal
                .querySelectorAll(
                    '[data-obelisk-field]'
                )
                .forEach(
                    field => {

                        values[
                            field.dataset.obeliskField
                        ] =
                            field.value;
                    }
                );


            modal
                .querySelectorAll(
                    '[data-obelisk-list]'
                )
                .forEach(
                    list => {

                        const key =
                            list.dataset.obeliskList;

                        values[key] =
                            [
                                ...list.querySelectorAll(
                                    '[data-obelisk-list-item]'
                                )
                            ].map(
                                item => {

                                    const result =
                                        {};

                                    item
                                        .querySelectorAll(
                                            '[data-obelisk-list-prop]'
                                        )
                                        .forEach(
                                            control => {

                                                result[
                                                    control.dataset
                                                        .obeliskListProp
                                                ] =
                                                    control.value;
                                            }
                                        );

                                    return result;
                                }
                            );
                    }
                );


            return values;
        };


    // Modal lifecycle

    /**
     * Closes the active builder modal.
     *
     * The reference is cleared immediately while the DOM node remains
     * briefly so its exit animation can finish.
     */

    const close =
        () => {

            if (!activeOverlay) {
                return;
            }


            activeOverlay.classList.remove(
                'obelisk-modal-visible'
            );


            const overlay =
                activeOverlay;


            activeOverlay =
                null;


            setTimeout(
                () => {

                    overlay.remove();
                },
                220
            );
        };


    /**
     * Connects form controls, preview updates and submit behavior after
     * a modal has been added to the page.
     */

    const wireModal =
        (
            overlay,
            modal,
            tool,
            getAccent
        ) => {

            const closeButton =
                modal.querySelector(
                    '.obelisk-modal-close'
                );


            const cancelButton =
                modal.querySelector(
                    '[data-obelisk-cancel]'
                );


            const submitButton =
                modal.querySelector(
                    '[data-obelisk-submit]'
                );


            closeButton?.addEventListener(
                'click',
                close
            );


            cancelButton?.addEventListener(
                'click',
                close
            );


            overlay.addEventListener(
                'click',
                event => {

                    if (
                        event.target ===
                        overlay
                    ) {

                        close();
                    }
                }
            );


            /**
             * Some previews have their own pointer, click or drag behavior.
             *
             * WHY:
             * Updating preview.innerHTML destroys previous DOM listeners,
             * so interactive tools must be wired again after every refresh.
             */

            const wirePreviewInteractions =
                () => {

                    const preview =
                        modal.querySelector(
                            '#obelisk-live-preview'
                        );


                    if (
                        !preview ||
                        typeof tool.wirePreview !==
                            'function'
                    ) {

                        return;
                    }


                    tool.wirePreview({
                        modal,
                        preview,
                        updatePreview
                    });
                };


            const updatePreview =
                () => {

                    if (!tool.preview) {
                        return;
                    }


                    const preview =
                        modal.querySelector(
                            '#obelisk-live-preview'
                        );


                    if (!preview) {
                        return;
                    }


                    preview.innerHTML =
                        tool.preview(
                            collectValues(
                                modal
                            ),
                            resolveAccent(
                                getAccent
                            )
                        );


                    wirePreviewInteractions();
                };


            modal
                .querySelectorAll(
                    '[data-obelisk-field]'
                )
                .forEach(
                    field => {

                        field.addEventListener(
                            'input',
                            () => {

                                const output =
                                    modal.querySelector(
                                        `[data-obelisk-output="${CSS.escape(
                                            field.dataset
                                                .obeliskField
                                        )}"]`
                                    );


                                if (output) {

                                    output.value =
                                        field.value;

                                    output.textContent =
                                        field.value;
                                }


                                updatePreview();
                            }
                        );


                        field.addEventListener(
                            'change',
                            updatePreview
                        );
                    }
                );


            modal
                .querySelectorAll(
                    '[data-obelisk-list]'
                )
                .forEach(
                    list => {

                        const fieldKey =
                            list.dataset.obeliskList;

                        const fieldConfig =
                            (tool.fields || [])
                                .find(
                                    field =>
                                        field.key === fieldKey
                                );

                        if (!fieldConfig) {
                            return;
                        }

                        list.addEventListener(
                            'input',
                            updatePreview
                        );

                        list.addEventListener(
                            'change',
                            updatePreview
                        );

                        list.addEventListener(
                            'click',
                            event => {

                                const button =
                                    event.target.closest(
                                        '[data-obelisk-list-action]'
                                    );

                                if (!button) {
                                    return;
                                }

                                const action =
                                    button.dataset
                                        .obeliskListAction;

                                const items =
                                    list.querySelector(
                                        '[data-obelisk-list-items]'
                                    );

                                if (!items) {
                                    return;
                                }

                                if (action === 'add') {

                                    const index =
                                        items.querySelectorAll(
                                            '[data-obelisk-list-item]'
                                        ).length;

                                    items.insertAdjacentHTML(
                                        'beforeend',
                                        renderListItem(
                                            fieldConfig,
                                            {},
                                            index
                                        )
                                    );

                                    refreshListIndices(
                                        list
                                    );

                                    updatePreview();
                                    return;
                                }

                                const item =
                                    button.closest(
                                        '[data-obelisk-list-item]'
                                    );

                                if (!item) {
                                    return;
                                }

                                if (action === 'up') {
                                    const previous =
                                        item.previousElementSibling;

                                    if (previous) {
                                        items.insertBefore(
                                            item,
                                            previous
                                        );
                                    }
                                }

                                if (action === 'down') {
                                    const next =
                                        item.nextElementSibling;

                                    if (next) {
                                        items.insertBefore(
                                            next,
                                            item
                                        );
                                    }
                                }

                                if (action === 'remove') {
                                    const count =
                                        items.querySelectorAll(
                                            '[data-obelisk-list-item]'
                                        ).length;

                                    const minItems =
                                        Number(
                                            fieldConfig.minItems ?? 1
                                        );

                                    if (count <= minItems) {
                                        return;
                                    }

                                    item.remove();
                                }

                                refreshListIndices(
                                    list
                                );

                                updatePreview();
                            }
                        );
                    }
                );


            // Interactive previews must also be wired for the initial
            // markup that existed before the first field change.

            wirePreviewInteractions();


            submitButton?.addEventListener(
                'click',
                () => {

                    const values =
                        collectValues(
                            modal
                        );


                    if (
                        tool.validate &&
                        !tool.validate(
                            values
                        )
                    ) {

                        return;
                    }


                    if (
                        typeof tool.onSubmit ===
                        'function'
                    ) {

                        tool.onSubmit(
                            values,
                            resolveAccent(
                                getAccent
                            )
                        );
                    }


                    close();
                }
            );


            const firstInput =
                modal.querySelector(
                    'input, textarea, select'
                );


            setTimeout(
                () => {

                    firstInput?.focus();
                },
                100
            );
        };


    /**
     * Opens the builder modal for a tool.
     *
     * options.getAccent should return the current Obelisk accent color.
     * Keeping that value outside this module prevents the modal system
     * from becoming coupled to panel or storage state.
     */

    const open =
        (
            tool,
            options = {}
        ) => {

            close();


            const getAccent =
                options.getAccent;


            const accent =
                resolveAccent(
                    getAccent
                );


            const overlay =
                document.createElement(
                    'div'
                );


            overlay.className =
                'obelisk-modal-overlay';


            const modal =
                document.createElement(
                    'div'
                );


            modal.className =
                'obelisk-modal';


            modal.style.setProperty(
                '--obelisk-accent',
                accent
            );


            const title =
                tool.name.replace(
                    /^[^A-Za-z]+/,
                    ''
                );


            modal.innerHTML = `
                <div class="obelisk-modal-glow"></div>

                <div class="obelisk-modal-header">

                    <div class="obelisk-modal-heading">

                        <span class="obelisk-modal-kicker">
                            OBELISK BUILDER
                        </span>

                        <strong>
                            ${escapeHTML(
                                title
                            )}
                        </strong>

                    </div>

                    <button
                        class="obelisk-modal-close"
                        type="button"
                        aria-label="Close"
                    >
                        ×
                    </button>

                </div>

                <div class="obelisk-modal-body">

                    <div class="obelisk-modal-fields">
                        ${(tool.fields || [])
                            .map(
                                field =>
                                    renderField(
                                        field
                                    )
                            )
                            .join('')}
                    </div>

                    ${
                        tool.preview
                            ? `
                                <div class="obelisk-preview-block">

                                    <div class="obelisk-preview-label">
                                        LIVE PREVIEW
                                    </div>

                                    <div
                                        class="obelisk-preview"
                                        id="obelisk-live-preview"
                                    >
                                        ${tool.preview(
                                            getInitialValues(
                                                tool.fields
                                            ),
                                            accent
                                        )}
                                    </div>

                                </div>
                            `
                            : ''
                    }

                </div>

                <div class="obelisk-modal-footer">

                    <button
                        type="button"
                        class="obelisk-btn obelisk-btn-secondary"
                        data-obelisk-cancel
                    >
                        CANCEL
                    </button>

                    <button
                        type="button"
                        class="obelisk-btn obelisk-btn-primary"
                        data-obelisk-submit
                    >
                        <span>◆</span>
                        INSERT
                    </button>

                </div>
            `;


            overlay.appendChild(
                modal
            );


            document.body.appendChild(
                overlay
            );


            activeOverlay =
                overlay;


            requestAnimationFrame(
                () => {

                    overlay.classList.add(
                        'obelisk-modal-visible'
                    );
                }
            );


            wireModal(
                overlay,
                modal,
                tool,
                getAccent
            );
        };


    // Public modal API

    window.Obelisk.modal = {

        open,

        close,


        isOpen() {

            return Boolean(
                activeOverlay
            );
        },


        getActiveOverlay() {

            return activeOverlay;
        }

    };

})();