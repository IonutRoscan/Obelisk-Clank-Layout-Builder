/**
 * Web Font Registry
 *
 * Provides the shared font definitions used by Obelisk tools.
 *
 * Some generated components rely on fonts that may not exist on the
 * reader's operating system. Obelisk therefore uses Google Fonts imports
 * for selected styles so generated layouts look more consistent across
 * Windows, macOS, Linux and mobile devices.
 *
 * This module does not render tools itself. It only describes available
 * fonts and provides helpers for tools that need them.
 *
 * Current consumers include:
 *   Styled Text
 *   Memory Polaroid
 *   Meme Caption
 *   Evidence Board
 *
 * Additional tools may safely reuse this registry.
 *
 * Exposes:
 *   window.Obelisk.fonts
 *
 * Loaded before:
 *   tool modules
 *   content.js
 */

(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    // Font registry

    const registry = {

        inherit: {
            label:
                'Default (System)',

            family:
                'inherit',

            importParam:
                null
        },


        serif: {
            label:
                'Elegant (Serif)',

            family:
                "'Playfair Display', Georgia, serif",

            importParam:
                'Playfair+Display:wght@400;700'
        },


        mono: {
            label:
                'Typewriter (Mono)',

            family:
                "'Courier Prime', 'Courier New', monospace",

            importParam:
                'Courier+Prime:wght@400;700'
        },


        handwritten: {
            label:
                'Handwritten (Casual)',

            family:
                "'Caveat', cursive",

            importParam:
                'Caveat:wght@400;700'
        },


        romantic: {
            label:
                'Romantic Script',

            family:
                "'Dancing Script', cursive",

            importParam:
                'Dancing+Script:wght@400;700'
        },


        gothic: {
            label:
                'Gothic / Horror',

            family:
                "'Creepster', cursive",

            importParam:
                'Creepster'
        },


        comic: {
            label:
                'Comic / Bold',

            family:
                "'Bangers', cursive",

            importParam:
                'Bangers'
        },


        scifi: {
            label:
                'Sci-Fi / Tech',

            family:
                "'Orbitron', sans-serif",

            importParam:
                'Orbitron:wght@400;700;900'
        },


        impact: {
            label:
                'Impact / Meme',

            family:
                "'Anton', Impact, sans-serif",

            importParam:
                'Anton'
        }

    };


    // Font helpers

    /**
     * Resolves a font definition by key.
     *
     * Unknown keys fall back to the system/default font so malformed or
     * older saved values cannot break generated components.
     */

    const get =
        fontKey =>
            registry[fontKey] ||
            registry.inherit;


    /**
     * Creates the <style> tag needed to load a registered web font.
     *
     * COMPAT:
     * Clank currently preserves <style> tags in generated About content,
     * which allows Google Fonts @import rules to survive rendering.
     *
     * The system/default font has no external import and therefore returns
     * an empty string.
     */

    const importTag =
        fontKey => {

            const font =
                get(
                    fontKey
                );


            if (!font.importParam) {
                return '';
            }


            return (
                `<style>@import url('https://fonts.googleapis.com/css2?family=${font.importParam}&display=swap');</style>\n`
            );
        };


    /**
     * Converts the registry into the value/label format used by Obelisk
     * select fields.
     */

    const getOptions =
        () =>
            Object.entries(
                registry
            ).map(
                ([value, font]) => ({
                    label:
                        font.label,

                    value
                })
            );


    // Public font API

    window.Obelisk.fonts = {

        registry,

        get,

        importTag,

        getOptions

    };

})();