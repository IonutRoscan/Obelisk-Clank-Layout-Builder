/**
 * Persistent Storage
 *
 * Centralizes data Obelisk keeps between page reloads and browser sessions.
 *
 * This module is the only place that should need to know the actual
 * localStorage keys used by the extension. Other modules should ask the
 * storage API to read or save values instead of accessing localStorage
 * directly.
 *
 * Currently stores:
 *
 *   accent
 *     The user's selected Obelisk interface accent color.
 *
 *   settings
 *     User preferences such as whether the startup animation is enabled.
 *
 *   favorites
 *     Names of tools the user has starred.
 *
 *   recent tools
 *     Names of the most recently opened tools.
 *
 *   custom kits
 *     User-created Studio kits saved for reuse and sharing.
 *
 * This module handles persistence only. It does not control panel behavior,
 * tool rendering or the logic for adding/removing Favorites and Recent items.
 *
 * Exposes:
 *   window.Obelisk.storage
 *
 * Loaded before:
 *   content.js
 */


(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    // Storage keys

    const KEYS = Object.freeze({

        accent:
            'obelisk-accent-color',

        settings:
            'obelisk-settings',

        favorites:
            'obelisk-favorite-tools',

        recent:
            'obelisk-recent-tools',

        customKits:
            'obelisk-custom-kits'

    });


    // Defaults

    const DEFAULT_ACCENT =
        '#c4a35a';

    const DEFAULT_SETTINGS = {
        startupAnimation: true,
        studioAnimations: true,

        // Studio UI preferences are intentionally separate from profile/theme
        // values. They only change the Obelisk workspace itself and never the
        // markup written into Clank's Edit about field.
        studioTextScale: 1.25,
        studioLeftWidth: 300,
        studioRightWidth: 350,
        studioSkin: 'obsidian'
    };

    const MAX_RECENT_TOOLS =
        6;


    /**
     * Reads JSON from localStorage.
     *
     * Invalid or damaged stored data should never prevent Obelisk from
     * starting, so parsing failures fall back to the supplied default.
     */

    const readJSON =
        (key, fallback) => {

            try {

                const stored =
                    localStorage.getItem(
                        key
                    );

                if (stored === null) {
                    return fallback;
                }

                return JSON.parse(
                    stored
                );

            } catch (error) {

                console.warn(
                    `[Obelisk] Could not read stored value "${key}".`,
                    error
                );

                return fallback;
            }
        };


    /**
     * Writes JSON to localStorage.
     *
     * Storage errors are reported without taking down the rest of the
     * extension. A browser denying persistence should not break Obelisk UI.
     */

    const writeJSON =
        (key, value) => {

            try {

                localStorage.setItem(
                    key,
                    JSON.stringify(
                        value
                    )
                );

            } catch (error) {

                console.warn(
                    `[Obelisk] Could not save stored value "${key}".`,
                    error
                );
            }
        };


    /**
     * Favorites and Recent should contain tool names only.
     *
     * Normalizing here prevents malformed manually-edited storage values
     * from leaking into the panel renderer.
     */

    const normalizeToolNames =
        value =>
            Array.isArray(value)
                ? value.filter(
                    item =>
                        typeof item ===
                        'string'
                )
                : [];


    const normalizeCustomKits = value =>
        Array.isArray(value)
            ? value.filter(item =>
                item &&
                typeof item === 'object' &&
                typeof item.id === 'string' &&
                typeof item.name === 'string' &&
                Array.isArray(item.blocks)
            )
            : [];


    // Public storage API

    window.Obelisk.storage = {

        maxRecentTools:
            MAX_RECENT_TOOLS,


        getAccent() {

            try {

                return (
                    localStorage.getItem(
                        KEYS.accent
                    ) ||
                    DEFAULT_ACCENT
                );

            } catch (error) {

                console.warn(
                    '[Obelisk] Could not read the saved accent color.',
                    error
                );

                return DEFAULT_ACCENT;
            }
        },


        setAccent(value) {

            const accent =
                value ||
                DEFAULT_ACCENT;

            try {

                localStorage.setItem(
                    KEYS.accent,
                    accent
                );

            } catch (error) {

                console.warn(
                    '[Obelisk] Could not save the accent color.',
                    error
                );
            }
        },


        getSettings() {

            const stored =
                readJSON(
                    KEYS.settings,
                    {}
                );

            const safeStored =
                stored &&
                typeof stored ===
                    'object' &&
                !Array.isArray(stored)
                    ? stored
                    : {};

            return {
                ...DEFAULT_SETTINGS,
                ...safeStored
            };
        },


        saveSettings(settings) {

            writeJSON(
                KEYS.settings,
                settings || {}
            );
        },


        getFavoriteTools() {

            return normalizeToolNames(
                readJSON(
                    KEYS.favorites,
                    []
                )
            );
        },


        saveFavoriteTools(names) {

            writeJSON(
                KEYS.favorites,
                normalizeToolNames(
                    names
                )
            );
        },


        getRecentTools() {

            return normalizeToolNames(
                readJSON(
                    KEYS.recent,
                    []
                )
            );
        },


        saveRecentTools(names) {

            writeJSON(
                KEYS.recent,
                normalizeToolNames(
                    names
                )
            );
        },


        getCustomKits() {

            return normalizeCustomKits(
                readJSON(
                    KEYS.customKits,
                    []
                )
            );
        },


        saveCustomKits(kits) {

            writeJSON(
                KEYS.customKits,
                normalizeCustomKits(kits)
            );
        }

    };

})();