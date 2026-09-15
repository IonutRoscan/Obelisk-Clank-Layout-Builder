/**
 * Basic Tools
 *
 * Defines a group of Obelisk's foundational layout and content tools.
 *
 * These tools are lightweight and self-contained. They only depend on
 * the shared core API for HTML escaping, notifications and insertion
 * into Clank's About editor.
 *
 * Tools in this module:
 *   Divider
 *   Framed Image
 *   Card Grid
 *   Stat / Skill Bar
 *   Quote
 *   Accordion
 *   Warning Box
 *
 * Tool display information such as categories, icons and descriptions
 * belongs in tool-meta.js. This file contains the actual behavior,
 * previews, validation and generated output for the tools above.
 *
 * Extends:
 *   window.Obelisk.tools
 *
 * Depends on:
 *   window.Obelisk.core
 */

(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    // Module dependencies

    const core =
        window.Obelisk.core;


    // SAFETY:
    // Tool modules rely on the shared escaping, notification and insertion
    // helpers. Registering tools without core.js would leave them only
    // partially functional and make load-order problems harder to diagnose.

    if (!core) {

        console.error(
            '[Obelisk] core.js was not loaded before tools/basic.js.'
        );

        return;
    }


    const {
        escapeHTML,
        showToast,
        injectText
    } = core;

    // Background helpers

    /**
     * Converts a Page Background pattern choice into its CSS background
     * representation.
     *
     * Shared by preview and generated output so both remain identical.
     */

    const obeliskBackgroundCSS =
        (
            pattern,
            hex,
            secondary
        ) => {

            if (pattern === 'dots') {

                return (
                    `radial-gradient(${hex} 1.5px, ${secondary} 1.5px) 0 0/22px 22px`
                );
            }


            if (pattern === 'solid') {
                return hex;
            }


            if (pattern === 'glow') {

                return (
                    `radial-gradient(circle at 50% 30%, ${hex}, ${secondary} 70%)`
                );
            }


            // Diagonal stripes — default.

            return (
                `repeating-linear-gradient(45deg, ${hex} 0 20px, ${secondary} 20px 40px)`
            );
        };


    // Shared tool registry

    window.Obelisk.tools =
        window.Obelisk.tools || [];


    window.Obelisk.tools.push(
        ...[

        // Divider

        {
            name: '✦ Divider',

            fields: [
                {
                    key: 'style',
                    label: 'Divider Style',
                    type: 'select',
                    options: [
                        'Elegant',
                        'Gothic',
                        'Minimal',
                        'Double',
                        'Stars'
                    ],
                    default: 'Elegant'
                }
            ],

            preview: (values, hex) => `
                <div
                    style="
                        padding:18px 0;
                        text-align:center;
                        color:${hex};
                        letter-spacing:6px;
                    "
                >
                    ${
                        values.style === 'Stars'
                            ? '✦ ─── ✦ ─── ✦'
                            : values.style === 'Double'
                                ? '━━━━━━  ━━━━━━'
                                : values.style === 'Gothic'
                                    ? '◆ ───────── ◆'
                                    : values.style === 'Minimal'
                                        ? '────────────'
                                        : '✦ ───────── ✦'
                    }
                </div>
            `,

            onSubmit: (values, hex) => {

                let divider;

                switch (values.style) {
                    case 'Gothic':
                        divider = `
<div style="margin:28px 0; text-align:center; color:${hex}; letter-spacing:5px;">
◆ ───────────────── ◆
</div>
`;
                        break;

                    case 'Minimal':
                        divider = `
<div style="height:1px; margin:24px 0; background:${hex}; opacity:.55;"></div>
`;
                        break;

                    case 'Double':
                        divider = `
<div style="margin:28px 0; text-align:center; color:${hex}; letter-spacing:2px;">
━━━━━━  ━━━━━━
</div>
`;
                        break;

                    case 'Stars':
                        divider = `
<div style="margin:28px 0; text-align:center; color:${hex}; letter-spacing:5px;">
✦ ─── ✦ ─── ✦
</div>
`;
                        break;

                    default:
                        divider = `
<div style="margin:28px 0; text-align:center; color:${hex}; letter-spacing:4px;">
✦ ───────── ✦
</div>
`;
                }

                injectText(divider);
            }
        },

        // Framed Image

        {
            name: '▣ Framed Image',

            fields: [
                {
                    key: 'url',
                    label: 'Image URL',
                    placeholder:
                        'https://...',
                    default: ''
                },

                {
                    key: 'caption',
                    label: 'Caption',
                    placeholder:
                        'Optional caption'
                },

                {
                    key: 'style',
                    label: 'Frame Style',
                    type: 'select',
                    options: [
                        'Royal',
                        'Cyber',
                        'Gothic',
                        'Minimal'
                    ],
                    default: 'Royal'
                }
            ],

            preview: values => `
                <div
                    style="
                        text-align:center;
                        padding:10px;
                    "
                >
                    ${
                        values.url
                            ? `
                                <img
                                    src="${escapeHTML(
                                        values.url
                                    )}"
                                    style="
                                        max-width:100%;
                                        max-height:160px;
                                        border-radius:8px;
                                        object-fit:cover;
                                    "
                                >
                            `
                            : `
                                <div
                                    style="
                                        height:100px;
                                        display:flex;
                                        align-items:center;
                                        justify-content:center;
                                        border:1px dashed #444;
                                        color:#777;
                                    "
                                >
                                    IMAGE PREVIEW
                                </div>
                            `
                    }

                    ${
                        values.caption
                            ? `
                                <div
                                    style="
                                        margin-top:8px;
                                        color:#888;
                                        font-size:.8em;
                                    "
                                >
                                    ${escapeHTML(
                                        values.caption
                                    )}
                                </div>
                            `
                            : ''
                    }
                </div>
            `,

            validate: values => {
                if (!values.url.trim()) {
                    showToast(
                        'Please enter an image URL.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                const styles = {
                    Royal: `
                        border:2px solid ${hex};
                        box-shadow:0 0 24px ${hex}33;
                    `,

                    Cyber: `
                        border:1px solid ${hex};
                        border-radius:2px;
                        box-shadow:0 0 12px ${hex}55;
                    `,

                    Gothic: `
                        border:1px solid #3b3326;
                        box-shadow:
                            inset 0 0 0 4px #111,
                            0 8px 30px rgba(0,0,0,.4);
                    `,

                    Minimal: `
                        border:1px solid #333;
                    `
                };

                const code = `
<div style="margin:24px 0; text-align:center;">
    <div style="
        display:inline-block;
        max-width:100%;
        padding:8px;
        background:#0d0d0f;
        border-radius:10px;
        ${styles[values.style] || styles.Royal}
    ">
        <img
            src="${escapeHTML(
                values.url.trim()
            )}"
            style="
                display:block;
                max-width:100%;
                height:auto;
                border-radius:4px;
            "
        >
    </div>

    ${
        values.caption.trim()
            ? `
                <div style="
                    margin-top:8px;
                    color:#888;
                    font-size:.8em;
                    letter-spacing:1px;
                ">
                    ${escapeHTML(
                        values.caption.trim()
                    )}
                </div>
            `
            : ''
    }
</div>
`;

                injectText(code);
            }
        },

        // Card Grid

        {
            name: '▦ Card Grid',

            fields: [
                {
                    key: 'columns',
                    label: 'Columns',
                    type: 'range',
                    min: 1,
                    max: 4,
                    default: 3
                },

                {
                    key: 'title',
                    label: 'Card Title',
                    placeholder:
                        'Card title'
                },

                {
                    key: 'text',
                    label: 'Card Content',
                    type: 'textarea',
                    placeholder:
                        'Card information...'
                }
            ],

            preview: (values, hex) => `
                <div
                    style="
                        display:grid;
                        grid-template-columns:
                            repeat(
                                ${values.columns || 3},
                                1fr
                            );
                        gap:8px;
                    "
                >
                    ${Array.from({
                        length:
                            Number(
                                values.columns || 3
                            )
                    })
                        .map(
                            (_, i) => `
                                <div
                                    style="
                                        padding:10px;
                                        border:1px solid #333;
                                        border-top:2px solid ${hex};
                                        background:#111;
                                        border-radius:6px;
                                    "
                                >
                                    <strong
                                        style="
                                            color:${hex};
                                            font-size:.75em;
                                        "
                                    >
                                        ${
                                            escapeHTML(
                                                values.title
                                            ) ||
                                            `CARD ${i + 1}`
                                        }
                                    </strong>
                                </div>
                            `
                        )
                        .join('')}
                </div>
            `,

            onSubmit: (values, hex) => {

                const columns =
                    Math.max(
                        1,
                        Math.min(
                            4,
                            Number(
                                values.columns || 3
                            )
                        )
                    );

                const code = `
<div style="
    display:grid;
    grid-template-columns:repeat(${columns}, minmax(0, 1fr));
    gap:14px;
    margin:24px 0;
">
${Array.from({
    length: columns
})
    .map(
        (_, i) => `
    <div style="
        background:#111;
        border:1px solid #292929;
        border-top:3px solid ${hex};
        border-radius:10px;
        padding:16px;
        box-shadow:0 8px 24px rgba(0,0,0,.25);
    ">
        <div style="
            color:${hex};
            font-weight:700;
            margin-bottom:8px;
        ">
            ${escapeHTML(
                values.title.trim() ||
                `CARD ${i + 1}`
            )}
        </div>

        <div style="
            color:#aaa;
            line-height:1.6;
        ">
            ${escapeHTML(
                values.text.trim()
            )}
        </div>
    </div>
`
    )
    .join('')}
</div>
`;

                injectText(code);
            }
        },

        // Stat / Skill Bar

        {
            name: '◈ Stat / Skill Bar',

            fields: [
                {
                    key: 'name',
                    label: 'Stat Name',
                    placeholder:
                        'Strength'
                },

                {
                    key: 'value',
                    label: 'Value',
                    type: 'range',
                    min: 0,
                    max: 100,
                    default: 75
                }
            ],

            preview: (values, hex) => `
                <div style="
                    padding:10px 0;
                ">
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        margin-bottom:6px;
                        color:#ddd;
                    ">
                        <span>
                            ${escapeHTML(
                                values.name ||
                                'STAT'
                            )}
                        </span>

                        <strong
                            style="color:${hex};"
                        >
                            ${values.value || 0}%
                        </strong>
                    </div>

                    <div style="
                        height:7px;
                        background:#222;
                        border-radius:99px;
                        overflow:hidden;
                    ">
                        <div style="
                            width:${values.value || 0}%;
                            height:100%;
                            background:${hex};
                            box-shadow:0 0 12px ${hex}88;
                        "></div>
                    </div>
                </div>
            `,

            validate: values => {
                if (!values.name.trim()) {
                    showToast(
                        'Please enter a stat name.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                const value =
                    Math.max(
                        0,
                        Math.min(
                            100,
                            Number(
                                values.value || 0
                            )
                        )
                    );

                const code = `
<div style="
    margin:16px 0;
">
    <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        margin-bottom:6px;
    ">
        <span style="
            color:#ddd;
            font-weight:600;
        ">
            ${escapeHTML(
                values.name.trim()
            )}
        </span>

        <span style="
            color:${hex};
            font-weight:700;
        ">
            ${value}%
        </span>
    </div>

    <div style="
        height:7px;
        background:#1c1c1c;
        border-radius:999px;
        overflow:hidden;
    ">
        <div style="
            width:${value}%;
            height:100%;
            background:${hex};
            box-shadow:0 0 12px ${hex}88;
        "></div>
    </div>
</div>
`;

                injectText(code);
            }
        },

        // Quote

        {
            name: '❝ Quote',

            fields: [
                {
                    key: 'text',
                    label: 'Quote',
                    type: 'textarea',
                    placeholder:
                        'Enter the quote...',
                    rows: 4
                },

                {
                    key: 'author',
                    label: 'Author',
                    placeholder:
                        'Optional attribution'
                }
            ],

            preview: (values, hex) => `
                <div style="
                    border-left:3px solid ${hex};
                    padding:12px 16px;
                    color:#ccc;
                    font-style:italic;
                ">
                    “${
                        escapeHTML(
                            values.text ||
                            'Your quote...'
                        )
                    }”

                    ${
                        values.author
                            ? `
                                <div style="
                                    margin-top:8px;
                                    color:${hex};
                                    font-style:normal;
                                    font-size:.75em;
                                ">
                                    — ${escapeHTML(
                                        values.author
                                    )}
                                </div>
                            `
                            : ''
                    }
                </div>
            `,

            validate: values => {
                if (!values.text.trim()) {
                    showToast(
                        'Please enter a quote.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<blockquote style="
    margin:24px 0;
    padding:16px 20px;
    border-left:3px solid ${hex};
    background:#101010;
    color:#ccc;
    font-style:italic;
    line-height:1.7;
">
    “${escapeHTML(
        values.text.trim()
    )}”

    ${
        values.author.trim()
            ? `
                <div style="
                    margin-top:8px;
                    color:${hex};
                    font-size:.75em;
                    font-style:normal;
                    letter-spacing:1px;
                ">
                    — ${escapeHTML(
                        values.author.trim()
                    )}
                </div>
            `
            : ''
    }
</blockquote>
`);
            }
        },

        // Accordion

        {
            name: '⌄ Accordion',

            fields: [
                {
                    key: 'title',
                    label: 'Section Title',
                    placeholder:
                        'Character Lore'
                },

                {
                    key: 'content',
                    label: 'Content',
                    type: 'textarea',
                    placeholder:
                        'Hidden information...',
                    rows: 5
                }
            ],

            preview: (values, hex) => `
                <details
                    style="
                        background:#111;
                        border:1px solid #2a2a2a;
                        border-left:3px solid ${hex};
                        border-radius:8px;
                        padding:10px 14px;
                    "
                >
                    <summary
                        style="
                            color:${hex};
                            cursor:pointer;
                            font-weight:700;
                        "
                    >
                        ${escapeHTML(
                            values.title ||
                            'SECTION TITLE'
                        )}
                    </summary>

                    <div
                        style="
                            margin-top:10px;
                            color:#aaa;
                        "
                    >
                        ${escapeHTML(
                            values.content ||
                            'Hidden content...'
                        )}
                    </div>
                </details>
            `,

            validate: values => {
                if (
                    !values.title.trim() ||
                    !values.content.trim()
                ) {
                    showToast(
                        'Please complete the accordion.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<details style="
    margin:18px 0;
    background:#111;
    border:1px solid #2a2a2a;
    border-left:3px solid ${hex};
    border-radius:8px;
    padding:12px 16px;
">
    <summary style="
        color:${hex};
        cursor:pointer;
        font-weight:700;
        letter-spacing:.5px;
    ">
        ${escapeHTML(
            values.title.trim()
        )}
    </summary>

    <div style="
        margin-top:12px;
        color:#aaa;
        line-height:1.7;
    ">
        ${escapeHTML(
            values.content.trim()
        )}
    </div>
</details>
`);
            }
        },

        // Warning Box

        {
            name: '⚠ Warning Box',

            fields: [
                {
                    key: 'title',
                    label: 'Warning Title',
                    placeholder:
                        'WARNING'
                },

                {
                    key: 'message',
                    label: 'Message',
                    type: 'textarea',
                    placeholder:
                        'Warning information...',
                    rows: 4
                }
            ],

            preview: (values, hex) => `
                <div style="
                    padding:14px;
                    background:#17130c;
                    border:1px solid #44351d;
                    border-left:3px solid ${hex};
                    border-radius:7px;
                ">
                    <strong
                        style="
                            color:${hex};
                            display:block;
                            margin-bottom:6px;
                        "
                    >
                        ⚠ ${
                            escapeHTML(
                                values.title ||
                                'WARNING'
                            )
                        }
                    </strong>

                    <span
                        style="
                            color:#aaa;
                        "
                    >
                        ${escapeHTML(
                            values.message ||
                            'Warning message...'
                        )}
                    </span>
                </div>
            `,

            validate: values => {
                if (
                    !values.title.trim() ||
                    !values.message.trim()
                ) {
                    showToast(
                        'Please complete the warning.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<div style="
    margin:20px 0;
    padding:16px;
    background:#17130c;
    border:1px solid #44351d;
    border-left:3px solid ${hex};
    border-radius:8px;
">
    <div style="
        color:${hex};
        font-weight:800;
        letter-spacing:1px;
        margin-bottom:7px;
    ">
        ⚠ ${escapeHTML(
            values.title.trim()
        )}
    </div>

    <div style="
        color:#aaa;
        line-height:1.6;
    ">
        ${escapeHTML(
            values.message.trim()
        )}
    </div>
</div>
`);
            }
        },

        // Page Background
        /*
         * Confirmed working via manual testing: a position:fixed,
         * full-viewport div injected into the about-editor content
         * escapes its container and paints behind the entire
         * Clank page, including while scrolling past other content.
         *
         * This is fragile in a way the rest of the toolkit isn't —
         * it only works because nothing between this div and the
         * page root currently has a `transform`, `filter`, or
         * `contain` CSS property (any of those creates a new
         * containing block and would trap the fixed positioning
         * inside whatever component wraps it). If Clank ever
         * changes their page markup in a way that adds one of
         * those properties higher up the tree, this tool will
         * silently start rendering as a small decorative box
         * instead of a real background — nothing to fix on our
         * end, just something that could break without warning.
         */
        {
            name: '🌌 Page Background',
            fields: [
                {
                    key: 'pattern', label: 'Pattern', type: 'select',
                    options: [
                        { label: 'Diagonal Stripes', value: 'stripes' },
                        { label: 'Dot Grid', value: 'dots' },
                        { label: 'Solid Wash', value: 'solid' },
                        { label: 'Radial Glow', value: 'glow' }
                    ],
                    default: 'stripes'
                },
                { key: 'secondary', label: 'Secondary Color (optional)', placeholder: '#000000' },
                { key: 'opacity', label: 'Opacity (%)', type: 'range', min: 5, max: 60, default: 20 }
            ],
            preview: (values, hex) => {
                const bg = obeliskBackgroundCSS(values.pattern, hex, values.secondary || '#000000');
                const op = (values.opacity || 20) / 100;
                return `
                <div style="position:relative; height:80px; border-radius:6px; overflow:hidden; border:1px solid #333;">
                    <div style="position:absolute; inset:0; background:${bg}; opacity:${op};"></div>
                    <div style="position:relative; color:#fff; font-size:.7em; text-align:center; padding-top:32px;">PREVIEW ONLY — actual effect covers the full page</div>
                </div>
                `;
            },
            onSubmit: (values, hex) => {
                const bg = obeliskBackgroundCSS(values.pattern, hex, values.secondary.trim() || '#000000');
                const op = Math.max(0.05, Math.min(0.6, (Number(values.opacity) || 20) / 100));
                injectText(`
<div style="position:fixed; top:0; left:0; width:100vw; height:100vh; background:${bg}; opacity:${op}; pointer-events:none; z-index:9999;"></div>
`);
                showToast('Background injected. If it stops working after a Clank update, this tool may need to be revisited.');
            }
        },

        // Pulse Indicator
        {
            name: '💓 Pulse Indicator',
            fields: [
                { key: 'label', label: 'Label Text', placeholder: 'LIVE' },
                {
                    key: 'style', label: 'Color', type: 'select',
                    options: [
                        { label: 'Theme Color', value: 'theme' },
                        { label: 'Alert Red', value: 'red' },
                        { label: 'Signal Green', value: 'green' }
                    ],
                    default: 'theme'
                }
            ],
            preview: (values, hex) => {
                const c = values.style === 'red' ? '#ff4444' : values.style === 'green' ? '#44ff88' : hex;
                return `
                <div style="display:inline-flex; align-items:center; gap:8px; background:#111; border:1px solid #2a2a2a; padding:6px 12px; border-radius:20px;">
                    <svg width="14" height="14" viewBox="0 0 14 14">
                        <circle cx="7" cy="7" r="3" fill="${c}">
                            <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
                        </circle>
                        <circle cx="7" cy="7" r="3" fill="none" stroke="${c}" stroke-width="1">
                            <animate attributeName="r" values="3;7" dur="1.4s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.6;0" dur="1.4s" repeatCount="indefinite" />
                        </circle>
                    </svg>
                    <span style="color:${c}; font-size:.75em; font-weight:700; letter-spacing:1px;">${escapeHTML(values.label || 'LIVE')}</span>
                </div>
                `;
            },
            validate: values => values.label.trim() ? true : (showToast('Enter a label.', 'error'), false),
            onSubmit: (values, hex) => {
                const c = values.style === 'red' ? '#ff4444' : values.style === 'green' ? '#44ff88' : hex;
                injectText(`
<div style="display:inline-flex; align-items:center; gap:10px; background:#0d0d0d; border:1px solid ${c}44; padding:8px 16px; border-radius:20px; margin:8px 0;">
    <svg width="16" height="16" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="3.5" fill="${c}">
            <animate attributeName="opacity" values="1;0.3;1" dur="1.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="8" cy="8" r="3.5" fill="none" stroke="${c}" stroke-width="1.5">
            <animate attributeName="r" values="3.5;8" dur="1.4s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.7;0" dur="1.4s" repeatCount="indefinite" />
        </circle>
    </svg>
    <span style="color:${c}; font-size:.8em; font-weight:800; letter-spacing:1.5px; text-transform:uppercase;">${escapeHTML(values.label.trim())}</span>
</div>
`);
            }
        },

        // Hover Reveal Card
        {
            name: '🖱️ Hover Reveal Card',
            fields: [
                { key: 'front', label: 'Front Text', placeholder: 'What they show the world' },
                { key: 'back', label: 'Reveal Text (on hover)', type: 'textarea', placeholder: 'What they hide from everyone else...', rows: 3 }
            ],
            preview: (values, hex) => `
                <div style="background:#111; border:1px solid ${hex}; border-radius:8px; padding:14px; text-align:center; color:#ccc; font-size:.8em;">
                    ${escapeHTML(values.front || 'Front text')}
                    <div style="color:#666; font-size:.75em; margin-top:6px;">(hover to reveal — preview not interactive)</div>
                </div>
            `,
            validate: values => (values.front.trim() && values.back.trim()) ? true : (showToast('Enter both front and reveal text.', 'error'), false),
            onSubmit: (values, hex) => {
                const uid = 'ob' + Math.random().toString(36).slice(2, 9);
                injectText(`
<style>
.${uid} { position:relative; background:#111; border:1px solid ${hex}; border-radius:10px; padding:20px; text-align:center; overflow:hidden; cursor:pointer; min-height:80px; }
.${uid} .front { color:#eee; font-weight:700; transition:opacity .3s; }
.${uid} .back { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:20px; color:${hex}; opacity:0; transition:opacity .3s; background:#0a0a0a; }
.${uid}:hover .front { opacity:0; }
.${uid}:hover .back { opacity:1; }
</style>
<div class="${uid}">
    <div class="front">${escapeHTML(values.front.trim())}</div>
    <div class="back">${escapeHTML(values.back.trim())}</div>
</div>
`);
            }
        }

        ]
    );
})();