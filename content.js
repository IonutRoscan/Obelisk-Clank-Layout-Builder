/**
 * Application Bootstrap
 *
 * Final entry point for the Obelisk extension runtime.
 *
 * Responsibilities:
 *   - validate required runtime systems
 *   - application-level keyboard shortcuts
 *   - Clank route detection
 *   - panel lifecycle
 *
 * Tool definitions, storage, modal rendering, component controllers
 * and panel UI behavior live in standalone modules.
 *
 * Depends on:
 *   window.Obelisk.modal
 *   window.Obelisk.panel
 */

(() => {

    'use strict';


    if (window.__OBELISK_LOADED__) {
        return;
    }

    window.__OBELISK_LOADED__ =
        true;


        // Runtime systems

    const modalSystem =
        window.Obelisk?.modal;

    const panelSystem =
        window.Obelisk?.panel;


    if (
        !modalSystem ||
        !panelSystem
    ) {

        console.error(
            '[Obelisk] Required runtime modules were not loaded before content.js.'
        );

        return;
    }


    const closeModal =
        () => {
            modalSystem.close();
        };

    // Keyboard shortcuts

    document.addEventListener(
        'keydown',
        event => {

            if (
                event.key === '/' &&
                document.activeElement !==
                    panelSystem.getSearchInput() &&
                panelSystem.isOpen() &&
                !modalSystem.isOpen()
            ) {

                event.preventDefault();

                panelSystem
                    .getSearchInput()
                    ?.focus();

                return;
            }

            if (
                event.key === 'Escape'
            ) {

                if (modalSystem.isOpen()) {
                    closeModal();
                    return;
                }

                if (
                    panelSystem.isOpen()
                ) {

                    const search =
                        panelSystem.getSearchInput();

                    if (search) {
                        search.value = '';
                        search.blur();
                    }

                    panelSystem.render();
                }
            }

            if (
                event.ctrlKey &&
                event.key === 'Enter' &&
                modalSystem.isOpen()
            ) {

                const activeOverlay =
                    modalSystem.getActiveOverlay();


                const submit =
                    activeOverlay?.querySelector(
                        '[data-obelisk-submit]'
                    );


                submit?.click();
            }
        }
    );

    // Route controller

    let wasEditPage =
        false;

        const checkRoute =
        () => {

            const isCharacterEditRoute =
                /^\/edit\/@c\/[^/]+\/?$/.test(
                    window.location.pathname
                );


            /*
             * The About editor only exists after Clank has a real character
             * record to edit (private or public). Waiting for the editor keeps
             * Obelisk off unrelated /edit/ routes and brand-new draft screens.
             */
            const isEditPage =
                isCharacterEditRoute &&
                Boolean(
                    window.Obelisk?.core?.findAboutEditor?.()
                );


            const panelEl =
                panelSystem.getElement();


            if (isEditPage) {

                if (!wasEditPage) {

                    wasEditPage =
                        true;


                    if (!panelEl) {

                        panelSystem.inject();

                    } else {

                        panelSystem.show();
                    }
                }

            } else {

                if (wasEditPage) {

                    wasEditPage =
                        false;


                    if (panelEl) {

                        panelSystem.hide();

                        closeModal();
                    }
                }
            }
        };

    // Application bootstrap

    const initialize = () => {
        if (!document.body) {
            setTimeout(initialize, 500);
            return;
        }
        // Resolve the initial route immediately.
        checkRoute();
    };

    initialize();

    // Clank uses client-side navigation, so periodically re-check the route.
    setInterval(checkRoute, 1000);

})();