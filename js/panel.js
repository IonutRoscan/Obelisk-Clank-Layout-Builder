/**
 * Panel System
 *
 * Owns the main Obelisk interface and its UI state.
 *
 * Responsibilities:
 *   - persistent accent color
 *   - favorites and recent tools
 *   - startup animation
 *   - settings modal
 *   - panel creation
 *   - tool card creation
 *   - category rendering and search
 *   - panel event wiring
 *   - opening tool configuration modals
 *
 * Tool definitions themselves live in /js/tools/.
 *
 * Exposes:
 *   window.Obelisk.panel
 *
 * Depends on:
 *   window.Obelisk.core
 *   window.Obelisk.storage
 *   window.Obelisk.modal
 *   window.Obelisk.meta
 *   window.Obelisk.tools
 */

(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    // Core dependencies

    const core =
        window.Obelisk?.core;


    if (!core) {

        console.error(
            '[Obelisk] core.js was not loaded before panel.js.'
        );

        return;
    }


    const escapeHTML =
        core.escapeHTML;

    const obeliskEsc =
        escapeHTML;

    const showToast =
        core.showToast;

    const storage =
        window.Obelisk?.storage;

    // SAFETY:
    // panel.js depends on storage.js being loaded first. Failing here
    // makes a broken manifest/load order obvious instead of allowing
    // Obelisk to start with partially initialized state.

    if (!storage) {

        console.error(
            '[Obelisk] storage.js was not loaded before panel.js.'
        );

        return;
    }


    let obeliskSettings =
        storage.getSettings();


    const saveObeliskSettings =
        () => {

            storage.saveSettings(
                obeliskSettings
            );
        };


    const MAX_RECENT_TOOLS =
        storage.maxRecentTools;


    let favoriteToolNames =
        storage.getFavoriteTools();


    let recentToolNames =
        storage.getRecentTools();


    const saveFavoriteTools =
        () => {

            storage.saveFavoriteTools(
                favoriteToolNames
            );
        };


    const saveRecentTools =
        () => {

            storage.saveRecentTools(
                recentToolNames
            );
        };

    const isFavoriteTool =
        name =>
            favoriteToolNames.includes(
                name
            );


    const toggleFavoriteTool =
        name => {

            if (
                isFavoriteTool(name)
            ) {

                favoriteToolNames =
                    favoriteToolNames.filter(
                        item =>
                            item !== name
                    );

            } else {

                favoriteToolNames = [
                    name,
                    ...favoriteToolNames
                ];
            }


            saveFavoriteTools();
        };


    const rememberRecentTool =
        name => {

            recentToolNames = [
                name,

                ...recentToolNames.filter(
                    item =>
                        item !== name
                )
            ].slice(
                0,
                MAX_RECENT_TOOLS
            );


            saveRecentTools();
        };

    let panel = null;

    let accentColor =
        storage.getAccent();

    // 2. THEME

        const applyAccent = hex => {

            accentColor =
                hex ||
                '#c4a35a';


            storage.setAccent(
                accentColor
            );


            if (panel) {
            panel.style.setProperty(
                '--obelisk-accent',
                accentColor
            );
        }

        document
            .querySelectorAll('.obelisk-modal')
            .forEach(modal => {
                modal.style.setProperty(
                    '--obelisk-accent',
                    accentColor
                );
            });
    };

        // Modal system

    const modalSystem =
        window.Obelisk?.modal;


    // SAFETY:
    // Tool configuration depends on modal.js. A missing module here
    // normally means the manifest script order is incorrect.

    if (!modalSystem) {

        console.error(
            '[Obelisk] modal.js was not loaded before panel.js.'
        );

        return;
    }


    /**
     * Opens a tool and updates Recent before handing UI responsibility
     * to the standalone modal module.
     *
     * Recent-tool tracking stays here because it belongs to Obelisk
     * application state, not to the modal component itself.
     */

    const openModal =
        tool => {

            rememberRecentTool(
                tool.name
            );


            if (panel) {

                const currentSearch =
                    panel.querySelector(
                        '#obelisk-search'
                    );


                renderTools(
                    currentSearch?.value ||
                    ''
                );
            }


            modalSystem.open(
                tool,
                {
                    getAccent:
                        () =>
                            accentColor
                }
            );
        };

    // 6. TOOL METADATA

    const obeliskMeta =
        window.Obelisk?.meta || {};

    // Tool registry

    const tools =
        window.Obelisk?.tools ||
        [];

        // OBELISK BOOT SEQUENCE

    const showObeliskBoot =
        () => {

            if (
                !obeliskSettings.startupAnimation
            ) {
                return;
            }


            const boot =
                document.createElement(
                    'div'
                );


            boot.className =
                'obelisk-boot';


            boot.style.setProperty(
                '--obelisk-accent',
                accentColor
            );


            boot.innerHTML = `
                <div class="obelisk-boot-card">

                    <div class="obelisk-boot-mark">
                        ◆
                    </div>

                    <div class="obelisk-boot-title">
                        OBELISK
                    </div>

                    <div class="obelisk-boot-subtitle">
                        CLANK LAYOUT BUILDER
                    </div>

                    <div class="obelisk-boot-terminal">

                        <div data-obelisk-boot-status>
                            INITIALIZING COMPONENT REGISTRY
                        </div>

                        <div class="obelisk-boot-track">
                            <div
                                class="obelisk-boot-progress"
                                data-obelisk-boot-progress
                            ></div>
                        </div>

                    </div>

                    <div class="obelisk-boot-version">
                        v2.1.0
                    </div>

                </div>
            `;


            document.body.appendChild(
                boot
            );


            const status =
                boot.querySelector(
                    '[data-obelisk-boot-status]'
                );


            const progress =
                boot.querySelector(
                    '[data-obelisk-boot-progress]'
                );


            requestAnimationFrame(
                () => {

                    boot.classList.add(
                        'obelisk-boot-visible'
                    );
                }
            );


            const stages = [

                {
                    at: 160,
                    width: '22%',
                    text:
                        'LOADING COMPONENT REGISTRY'
                },

                {
                    at: 700,
                    width: '50%',
                    text:
                        'RESTORING USER SETTINGS'
                },

                {
                    at: 1250,
                    width: '80%',
                    text:
                        'ATTACHING BUILDER INTERFACE'
                },

                {
                    at: 1750,
                    width: '100%',
                    text:
                        'OBELISK ONLINE'
                }

            ];


            stages.forEach(
                stage => {

                    setTimeout(
                        () => {

                            if (status) {

                                status.textContent =
                                    stage.text;
                            }


                            if (progress) {

                                progress.style.width =
                                    stage.width;
                            }

                        },
                        stage.at
                    );
                }
            );


            setTimeout(
                () => {

                    boot.classList.add(
                        'obelisk-boot-complete'
                    );

                },
                2350
            );


            setTimeout(
                () => {

                    boot.remove();

                },
                2850
            );
        };

    const openObeliskSettings =
    () => {

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
            'obelisk-modal obelisk-settings-modal';


        modal.style.setProperty(
            '--obelisk-accent',
            accentColor
        );


        modal.innerHTML = `
            <header class="obelisk-modal-header">

                <div class="obelisk-modal-title-wrap">

                    <div class="obelisk-modal-symbol">
                        ⚙
                    </div>

                    <div>

                        <div class="obelisk-modal-kicker">
                            OBELISK SYSTEM
                        </div>

                        <div class="obelisk-modal-title">
                            SETTINGS
                        </div>

                        <div class="obelisk-modal-subtitle">
                            Personalize builder behavior and stored data.
                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    class="obelisk-modal-close"
                    data-obelisk-settings-close
                >
                    ×
                </button>

            </header>


            <div class="obelisk-settings-body">

                <section class="obelisk-settings-row">

                    <div>
                        <strong>
                            Startup Animation
                        </strong>

                        <span>
                            Show the Obelisk boot sequence when the builder loads.
                        </span>
                    </div>

                    <button
                        type="button"
                        class="obelisk-settings-toggle ${
                            obeliskSettings.startupAnimation
                                ? 'obelisk-settings-toggle-active'
                                : ''
                        }"
                        data-obelisk-setting-boot
                    >
                        ${
                            obeliskSettings.startupAnimation
                                ? 'ON'
                                : 'OFF'
                        }
                    </button>

                </section>


                <section class="obelisk-settings-row">

                    <div>
                        <strong>
                            Studio Effects
                        </strong>

                        <span>
                            Enable animated grids, scan effects and Studio transitions.
                        </span>
                    </div>

                    <button
                        type="button"
                        class="obelisk-settings-toggle ${
                            obeliskSettings.studioAnimations
                                ? 'obelisk-settings-toggle-active'
                                : ''
                        }"
                        data-obelisk-setting-studio-fx
                    >
                        ${
                            obeliskSettings.studioAnimations
                                ? 'ON'
                                : 'OFF'
                        }
                    </button>

                </section>


                <section class="obelisk-settings-row">

                    <div>
                        <strong>
                            Recent Tools
                        </strong>

                        <span>
                            Clear your recently opened tools.
                        </span>
                    </div>

                    <button
                        type="button"
                        class="obelisk-settings-action"
                        data-obelisk-clear-recent
                    >
                        CLEAR
                    </button>

                </section>


                <section class="obelisk-settings-row">

                    <div>
                        <strong>
                            Favorites
                        </strong>

                        <span>
                            Remove all starred tools.
                        </span>
                    </div>

                    <button
                        type="button"
                        class="obelisk-settings-action"
                        data-obelisk-clear-favorites
                    >
                        CLEAR
                    </button>

                </section>

            </div>
        `;


        overlay.appendChild(
            modal
        );


        document.body.appendChild(
            overlay
        );


        requestAnimationFrame(
            () => {

                overlay.classList.add(
                    'obelisk-modal-visible'
                );
            }
        );


        const close =
            () => {

                overlay.classList.remove(
                    'obelisk-modal-visible'
                );


                setTimeout(
                    () => {

                        overlay.remove();

                    },
                    220
                );
            };


        overlay
            .querySelector(
                '[data-obelisk-settings-close]'
            )
            ?.addEventListener(
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


        const bootToggle =
            overlay.querySelector(
                '[data-obelisk-setting-boot]'
            );


        bootToggle?.addEventListener(
            'click',
            () => {

                obeliskSettings.startupAnimation =
                    !obeliskSettings.startupAnimation;


                saveObeliskSettings();


                bootToggle.textContent =
                    obeliskSettings.startupAnimation
                        ? 'ON'
                        : 'OFF';


                bootToggle.classList.toggle(
                    'obelisk-settings-toggle-active',
                    obeliskSettings.startupAnimation
                );
            }
        );


        const studioFxToggle =
            overlay.querySelector(
                '[data-obelisk-setting-studio-fx]'
            );


        studioFxToggle?.addEventListener(
            'click',
            () => {

                obeliskSettings.studioAnimations =
                    !obeliskSettings.studioAnimations;


                saveObeliskSettings();


                studioFxToggle.textContent =
                    obeliskSettings.studioAnimations
                        ? 'ON'
                        : 'OFF';


                studioFxToggle.classList.toggle(
                    'obelisk-settings-toggle-active',
                    obeliskSettings.studioAnimations
                );
            }
        );


        overlay
            .querySelector(
                '[data-obelisk-clear-recent]'
            )
            ?.addEventListener(
                'click',
                () => {

                    recentToolNames =
                        [];


                    saveRecentTools();


                    renderTools(
                        searchInput()?.value ||
                        ''
                    );


                    showToast(
                        'Recent tools cleared.',
                        'success'
                    );
                }
            );


        overlay
            .querySelector(
                '[data-obelisk-clear-favorites]'
            )
            ?.addEventListener(
                'click',
                () => {

                    favoriteToolNames =
                        [];


                    saveFavoriteTools();


                    renderTools(
                        searchInput()?.value ||
                        ''
                    );


                    showToast(
                        'Favorites cleared.',
                        'success'
                    );
                }
            );
    };

    const injectObelisk = () => {

        if (
            document.querySelector(
                '#obelisk-panel'
            )
        ) {
            return;
        }

        panel =
            document.createElement('aside');

        panel.id =
            'obelisk-panel';

        panel.style.setProperty(
            '--obelisk-accent',
            accentColor
        );

        const momoiSrc = chrome.runtime.getURL('momoi-dancing-avatar.gif');

        panel.innerHTML = `
            <img src="${momoiSrc}" class="obelisk-mascot" alt="Momoi" />
            <div class="obelisk-panel-inner">

                <header class="obelisk-header">

                    <div class="obelisk-brand">
                        <div class="obelisk-brand-mark">
                            ◆
                        </div>

                        <div>
                            <div class="obelisk-brand-title">
                                OBELISK
                                <button
                                    type="button"
                                    class="obelisk-settings-button"
                                    id="obelisk-settings-button"
                                    title="Settings"
                                    aria-label="Obelisk Settings"
                                >
                                    ⚙
                                </button>
                            </div>

                            <div class="obelisk-brand-subtitle">
                                CLANK LAYOUT BUILDER
                            </div>
                        </div>
                    </div>

                    <div class="obelisk-header-actions">

                        <div class="obelisk-header-status">
                            <span></span>
                            ONLINE
                        </div>

                        <button
                            type="button"
                            class="obelisk-panel-close"
                            id="obelisk-panel-close"
                            title="Close Obelisk"
                            aria-label="Close Obelisk"
                        >
                            ×
                        </button>

                    </div>

                </header>

                <div class="obelisk-theme-card">

                    <div class="obelisk-theme-heading">
                        <span>THEME ACCENT</span>

                        <output
                            id="obelisk-color-value"
                        >
                            ${escapeHTML(
                                accentColor
                            )}
                        </output>
                    </div>

                    <div class="obelisk-theme-controls">

                        <input
                            id="obelisk-color"
                            type="color"
                            value="${escapeHTML(
                                accentColor
                            )}"
                        >

                        <div class="obelisk-color-presets">

                            ${[
                                '#c4a35a',
                                '#b56cff',
                                '#5da9ff',
                                '#5de0b5',
                                '#e66b8f',
                                '#e6e6e6'
                            ]
                                .map(
                                    color => `
                                        <button
                                            type="button"
                                            class="obelisk-color-preset"
                                            data-color="${color}"
                                            style="
                                                --preset:${color};
                                            "
                                            aria-label="${color}"
                                        ></button>
                                    `
                                )
                                .join('')}

                        </div>

                    </div>

                </div>

                <button
                    type="button"
                    class="obelisk-studio-launch"
                    id="obelisk-studio-launch"
                >
                    <span class="obelisk-studio-launch-mark">◆</span>
                    <span class="obelisk-studio-launch-copy">
                        <small>VISUAL PROFILE WORKSPACE</small>
                        <strong>OPEN STUDIO</strong>
                    </span>
                    <span class="obelisk-studio-launch-arrow">↗</span>
                </button>
                
                <div class="obelisk-system-strip">

    <div class="obelisk-system-stat">
        <strong>
            ${tools.length}
        </strong>
        <span>TOOLS</span>
    </div>

    <div class="obelisk-system-divider"></div>

    <div class="obelisk-system-stat">
        <strong data-obelisk-favorite-count>
            ${favoriteToolNames.length}
        </strong>
        <span>FAVORITES</span>
    </div>

    <div class="obelisk-system-divider"></div>

    <div class="obelisk-system-stat">
        <strong data-obelisk-recent-count>
            ${recentToolNames.length}
        </strong>
        <span>RECENT</span>
    </div>

</div>

                <div class="obelisk-search-wrap">

                    <span class="obelisk-search-icon">
                        /
                    </span>

                    <input
                        id="obelisk-search"
                        type="search"
                        placeholder="Search tools..."
                        autocomplete="off"
                        spellcheck="false"
                    >

                    <kbd>/</kbd>

                </div>

                <div
                    id="obelisk-tool-area"
                    class="obelisk-tool-area"
                ></div>

                <footer class="obelisk-footer">

                    <span>
                        OBELISK
                    </span>

                    <span class="obelisk-footer-status">
                        ${tools.length} TOOLS READY
                    </span>

                </footer>

            </div>

            <button
                id="obelisk-toggle"
                class="obelisk-toggle"
                type="button"
                aria-label="Toggle Obelisk"
            >
                <span>◆</span>
            </button>
        `;

        applyAccent(
            accentColor
        );

        wirePanel();

        renderTools();

        document.body.appendChild(
            panel
        );

        showObeliskBoot();
    };

    // 9. TOOL RENDERING

    const toolArea =
        () => panel?.querySelector(
            '#obelisk-tool-area'
        );

    const searchInput =
        () => panel?.querySelector(
            '#obelisk-search'
        );

        // TOOL CARD FACTORY

    const createToolCard =
        (
            tool,
            meta
        ) => {

            const card =
                document.createElement(
                    'div'
                );


            card.className =
                'obelisk-tool-card';


            // MAIN OPEN BUTTON

            const openButton =
                document.createElement(
                    'button'
                );


            openButton.type =
                'button';


            openButton.className =
                'obelisk-tool-open';


            openButton.innerHTML = `

                <span
                    class="obelisk-tool-icon"
                >
                    ${obeliskEsc(
                        meta.icon
                    )}
                </span>

                <span
                    class="obelisk-tool-copy"
                >

                    <strong>
                        ${obeliskEsc(
                            tool.name.replace(
                                /^[^A-Za-z]+/,
                                ''
                            )
                        )}
                    </strong>

                    <small>
                        ${obeliskEsc(
                            meta.description
                        )}
                    </small>

                </span>

            `;


            openButton.addEventListener(
                'click',
                event => {

                    event.preventDefault();


                    openModal(
                        tool
                    );
                }
            );


            // FAVORITE BUTTON

            const favoriteButton =
                document.createElement(
                    'button'
                );


            favoriteButton.type =
                'button';


            favoriteButton.className =
                'obelisk-tool-favorite';


            const updateFavoriteButton =
                () => {

                    const favorite =
                        isFavoriteTool(
                            tool.name
                        );


                    favoriteButton.textContent =
                        favorite
                            ? '★'
                            : '☆';


                    favoriteButton.classList.toggle(
                        'obelisk-tool-favorite-active',
                        favorite
                    );


                    favoriteButton.setAttribute(
                        'aria-label',
                        favorite
                            ? `Remove ${tool.name} from favorites`
                            : `Add ${tool.name} to favorites`
                    );


                    favoriteButton.title =
                        favorite
                            ? 'Remove from Favorites'
                            : 'Add to Favorites';
                };


            updateFavoriteButton();


            favoriteButton.addEventListener(
                'click',
                event => {

                    event.preventDefault();

                    event.stopPropagation();


                    toggleFavoriteTool(
                        tool.name
                    );


                    /*
                     * Rebuild because adding/removing a favorite
                     * changes the Favorites section itself.
                     */

                    const currentSearch =
                        searchInput()?.value ||
                        '';


                    renderTools(
                        currentSearch
                    );
                }
            );


            card.appendChild(
                openButton
            );


            card.appendChild(
                favoriteButton
            );


            return card;
        };


    // TOOL SECTION FACTORY

    const appendToolSection =
        (
            area,
            title,
            entries,
            special = false
        ) => {

            if (
                !entries.length
            ) {
                return;
            }


            const section =
                document.createElement(
                    'section'
                );


            section.className =
                special
                    ? 'obelisk-tool-section obelisk-tool-section-quick'
                    : 'obelisk-tool-section';


            const heading =
                document.createElement(
                    'div'
                );


            heading.className =
                special
                    ? 'obelisk-category-title obelisk-category-title-quick'
                    : 'obelisk-category-title';


            heading.innerHTML = `
                <span>
                    ${escapeHTML(
                        title
                    )}
                </span>

                <i></i>
            `;


            section.appendChild(
                heading
            );


            const grid =
                document.createElement(
                    'div'
                );


            grid.className =
                'obelisk-tool-grid';


            entries.forEach(
                ({
                    tool,
                    meta
                }) => {

                    grid.appendChild(
                        createToolCard(
                            tool,
                            meta
                        )
                    );
                }
            );


            section.appendChild(
                grid
            );


            area.appendChild(
                section
            );
        };


    // TOOL RENDERING

    const renderTools = (
        filter = ''
    ) => {

        const area =
            toolArea();


        if (!area) {
            return;
        }


        const query =
            filter
                .trim()
                .toLowerCase();


        area.innerHTML =
            '';


        // REMOVE DEAD SAVED REFERENCES

        const existingNames =
            new Set(
                tools.map(
                    tool =>
                        tool.name
                )
            );


        favoriteToolNames =
            favoriteToolNames.filter(
                name =>
                    existingNames.has(
                        name
                    )
            );


        recentToolNames =
            recentToolNames.filter(
                name =>
                    existingNames.has(
                        name
                    )
            );


        saveFavoriteTools();
        saveRecentTools();


        // METADATA HELPER

        const getMeta =
            tool =>
                obeliskMeta[
                    tool.name
                ] || {
                    category:
                        'TOOLS',

                    description:
                        '',

                    icon:
                        '◆'
                };


        // FAVORITES / RECENT
        //
        // Only shown while there is no active search.

        if (!query) {

            const favoriteEntries =
                favoriteToolNames
                    .map(
                        name => {

                            const tool =
                                tools.find(
                                    candidate =>
                                        candidate.name ===
                                        name
                                );


                            if (!tool) {
                                return null;
                            }


                            return {
                                tool,
                                meta:
                                    getMeta(
                                        tool
                                    )
                            };
                        }
                    )
                    .filter(Boolean);


            appendToolSection(
                area,
                '★ FAVORITES',
                favoriteEntries,
                true
            );


            /*
             * Don't duplicate favorites inside Recent.
             */

            const recentEntries =
                recentToolNames
                    .filter(
                        name =>
                            !favoriteToolNames.includes(
                                name
                            )
                    )
                    .map(
                        name => {

                            const tool =
                                tools.find(
                                    candidate =>
                                        candidate.name ===
                                        name
                                );


                            if (!tool) {
                                return null;
                            }


                            return {
                                tool,
                                meta:
                                    getMeta(
                                        tool
                                    )
                            };
                        }
                    )
                    .filter(Boolean);


            appendToolSection(
                area,
                '◷ RECENT',
                recentEntries,
                true
            );

                    const favoriteCount =
            panel?.querySelector(
                '[data-obelisk-favorite-count]'
            );


        const recentCount =
            panel?.querySelector(
                '[data-obelisk-recent-count]'
            );


        if (favoriteCount) {

            favoriteCount.textContent =
                favoriteToolNames.length;
        }


        if (recentCount) {

            recentCount.textContent =
                recentToolNames.length;
        }
        }


        // SEARCH / NORMAL TOOL LIST

        const visible =
            tools.filter(
                tool => {

                    const meta =
                        getMeta(
                            tool
                        );


                    return (
                        !query ||

                        tool.name
                            .toLowerCase()
                            .includes(
                                query
                            ) ||

                        String(
                            meta.category
                        )
                            .toLowerCase()
                            .includes(
                                query
                            ) ||

                        String(
                            meta.description
                        )
                            .toLowerCase()
                            .includes(
                                query
                            )
                    );
                }
            );


        // CATEGORY GROUPS

        const groups =
            {};


        visible.forEach(
            tool => {

                const meta =
                    getMeta(
                        tool
                    );


                (
                    groups[
                        meta.category
                    ] ||= []
                ).push({
                    tool,
                    meta
                });
            }
        );


        const order = [
            'DECORATION',
            'INTERACTIVE',
            'MEDIA',
            'LAYOUT',
            'DATA',
            'TEXT',
            'CONTENT',
            'CALLOUT',
            'CHARACTERS',
            'DIALOGUE',
            'SOCIAL',
            'THEMES'
        ];


        const categoryRank =
            category => {

                const index =
                    order.indexOf(
                        category
                    );


                return index === -1
                    ? 999
                    : index;
            };


        Object.keys(
            groups
        )
            .sort(
                (
                    a,
                    b
                ) =>
                    categoryRank(a) -
                    categoryRank(b)
            )
            .forEach(
                category => {

                    appendToolSection(
                        area,
                        category,
                        groups[
                            category
                        ]
                    );
                }
            );


        // EMPTY SEARCH

        if (
            query &&
            !visible.length
        ) {

            area.innerHTML = `
                <div class="obelisk-empty">

                    <div class="obelisk-empty-mark">
                        ◇
                    </div>

                    <strong>
                        NO TOOLS FOUND
                    </strong>

                    <span>
                        Try a different search.
                    </span>

                </div>
            `;
        }
    };

    // 10. PANEL EVENTS

    const wirePanel = () => {
        const settingsButton =
        panel.querySelector(
            '#obelisk-settings-button'
        );


    settingsButton?.addEventListener(
        'click',
        event => {

            event.preventDefault();

            openObeliskSettings();
        }
    );

        const studioLaunch =
            panel.querySelector(
                '#obelisk-studio-launch'
            );

        studioLaunch?.addEventListener(
            'click',
            event => {

                event.preventDefault();

                window.Obelisk?.studio?.open?.({
                    accent: accentColor
                });
            }
        );

        const toggle =
            panel.querySelector(
                '#obelisk-toggle'
            );

        toggle?.addEventListener(
            'click',
            event => {

                event.preventDefault();

                panel.classList.toggle(
                    'obelisk-open'
                );
            }
        );

                const panelClose =
            panel.querySelector(
                '#obelisk-panel-close'
            );


        panelClose?.addEventListener(
            'click',
            event => {

                event.preventDefault();

                panel.classList.remove(
                    'obelisk-open'
                );
            }
        );

        const colorInput =
            panel.querySelector(
                '#obelisk-color'
            );

        const colorValue =
            panel.querySelector(
                '#obelisk-color-value'
            );

        colorInput?.addEventListener(
            'input',
            () => {

                applyAccent(
                    colorInput.value
                );

                if (colorValue) {
                    colorValue.textContent =
                        colorInput.value;
                }
            }
        );

        panel
            .querySelectorAll(
                '.obelisk-color-preset'
            )
            .forEach(
                button => {

                    button.addEventListener(
                        'click',
                        () => {

                            const color =
                                button.dataset
                                    .color;

                            colorInput.value =
                                color;

                            applyAccent(
                                color
                            );

                            if (colorValue) {
                                colorValue.textContent =
                                    color;
                            }
                        }
                    );
                }
            );

        const search =
            panel.querySelector(
                '#obelisk-search'
            );

        search?.addEventListener(
            'input',
            () => {

                renderTools(
                    search.value
                );
            }
        );
    };


    // Public panel API

    window.Obelisk.panel = {

        inject:
            injectObelisk,

        render:
            renderTools,

        getElement:
            () =>
                panel,

        getSearchInput:
            searchInput,

        isOpen:
            () =>
                Boolean(
                    panel?.classList.contains(
                        'obelisk-open'
                    )
                ),

        show:
            () => {
                panel?.classList.remove(
                    'obelisk-hidden-route'
                );
            },

        hide:
            () => {
                panel?.classList.add(
                    'obelisk-hidden-route'
                );
            },

        getAccent:
            () =>
                accentColor

    };

})();