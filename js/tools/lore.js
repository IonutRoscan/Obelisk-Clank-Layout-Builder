/**
 * Lore & Narrative Tools
 *
 * Defines tools used for structured lore, story information,
 * scene presentation and in-universe records.
 *
 * Tools in this module:
 *   Lore Entry
 *   Timeline Event
 *   Scene Header
 *   Terminal Log
 *   Stat Sheet
 *   Classified File
 *
 * These tools are grouped by purpose rather than by their panel category.
 * Their display categories, icons and descriptions remain defined in
 * tool-meta.js.
 *
 * This file owns each tool's fields, preview, validation and generated
 * output.
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


    if (!core) {

        console.error(
            '[Obelisk] core.js was not loaded before tools/lore.js.'
        );

        return;
    }


    const {
        escapeHTML,
        showToast,
        injectText
    } = core;


    // Shared tool registry

    window.Obelisk.tools =
        window.Obelisk.tools || [];


    window.Obelisk.tools.push(
        ...[

        // Lore Entry

        {
            name: '▤ Lore Entry',

            fields: [
                {
                    key: 'title',
                    label: 'Lore Title',
                    placeholder:
                        'Origins'
                },

                {
                    key: 'content',
                    label: 'Lore',
                    type: 'textarea',
                    placeholder:
                        'Write the lore entry...',
                    rows: 7
                }
            ],

            preview: (values, hex) => `
                <div style="
                    padding:16px;
                    border-left:2px solid ${hex};
                    background:#0f0f10;
                ">
                    <div style="
                        color:${hex};
                        font-size:.75em;
                        font-weight:800;
                        letter-spacing:1.5px;
                        text-transform:uppercase;
                        margin-bottom:8px;
                    ">
                        ${escapeHTML(
                            values.title ||
                            'LORE'
                        )}
                    </div>

                    <div style="
                        color:#aaa;
                        line-height:1.65;
                    ">
                        ${escapeHTML(
                            values.content ||
                            'Lore text...'
                        )}
                    </div>
                </div>
            `,

            validate: values => {
                if (
                    !values.title.trim() ||
                    !values.content.trim()
                ) {
                    showToast(
                        'Please complete the lore entry.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<div style="
    margin:24px 0;
    padding:18px;
    border-left:2px solid ${hex};
    background:
        linear-gradient(
            90deg,
            ${hex}08,
            transparent
        );
">
    <div style="
        color:${hex};
        font-size:.72em;
        font-weight:800;
        letter-spacing:2px;
        text-transform:uppercase;
        margin-bottom:9px;
    ">
        ${escapeHTML(
            values.title.trim()
        )}
    </div>

    <div style="
        color:#aaa;
        line-height:1.7;
    ">
        ${escapeHTML(
            values.content.trim()
        )}
    </div>
</div>
`);
            }
        },

        // Timeline Event

        {
            name: '◷ Timeline Event',

            fields: [
                {
                    key: 'date',
                    label: 'Date / Era',
                    placeholder:
                        'YEAR 01'
                },

                {
                    key: 'title',
                    label: 'Event',
                    placeholder:
                        'The Estate Was Founded'
                },

                {
                    key: 'description',
                    label: 'Description',
                    type: 'textarea',
                    placeholder:
                        'What happened?',
                    rows: 4
                }
            ],

            preview: (values, hex) => `
                <div style="
                    display:grid;
                    grid-template-columns:70px 1fr;
                    gap:12px;
                ">
                    <div style="
                        color:${hex};
                        font-weight:800;
                        font-size:.75em;
                    ">
                        ${escapeHTML(
                            values.date ||
                            'DATE'
                        )}
                    </div>

                    <div style="
                        border-left:1px solid #333;
                        padding-left:12px;
                    ">
                        <strong
                            style="
                                color:#ddd;
                            "
                        >
                            ${escapeHTML(
                                values.title ||
                                'EVENT'
                            )}
                        </strong>

                        <div style="
                            color:#888;
                            margin-top:5px;
                        ">
                            ${escapeHTML(
                                values.description ||
                                'Description...'
                            )}
                        </div>
                    </div>
                </div>
            `,

            validate: values => {
                if (
                    !values.title.trim() ||
                    !values.description.trim()
                ) {
                    showToast(
                        'Please complete the timeline event.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<div style="
    display:grid;
    grid-template-columns:80px 1fr;
    gap:14px;
    margin:18px 0;
">
    <div style="
        color:${hex};
        font-size:.72em;
        font-weight:800;
        padding-top:2px;
        letter-spacing:1px;
    ">
        ${escapeHTML(
            values.date.trim() ||
            'EVENT'
        )}
    </div>

    <div style="
        border-left:1px solid #333;
        padding-left:16px;
    ">
        <div style="
            color:#ddd;
            font-weight:700;
        ">
            ${escapeHTML(
                values.title.trim()
            )}
        </div>

        <div style="
            color:#888;
            margin-top:6px;
            line-height:1.6;
        ">
            ${escapeHTML(
                values.description.trim()
            )}
        </div>
    </div>
</div>
`);
            }
        },

        // Scene Header

        {
            name: '✦ Scene Header',

            fields: [
                {
                    key: 'title',
                    label: 'Scene Title',
                    placeholder:
                        'RAIN AND ROUTINE'
                },

                {
                    key: 'subtitle',
                    label: 'Subtitle',
                    placeholder:
                        'The estate settles into another quiet evening.'
                }
            ],

            preview: (values, hex) => `
                <div style="
                    padding:20px 0;
                    text-align:center;
                ">
                    <div style="
                        color:#555;
                        letter-spacing:4px;
                    ">
                        ✦
                    </div>

                    <div style="
                        margin:7px 0;
                        color:${hex};
                        font-size:1.15em;
                        font-weight:800;
                        letter-spacing:2px;
                    ">
                        ${escapeHTML(
                            values.title ||
                            'SCENE TITLE'
                        )}
                    </div>

                    <div style="
                        color:#777;
                        font-style:italic;
                    ">
                        ${escapeHTML(
                            values.subtitle ||
                            'Scene subtitle...'
                        )}
                    </div>
                </div>
            `,

            validate: values => {
                if (!values.title.trim()) {
                    showToast(
                        'Please enter a scene title.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<div style="
    margin:34px 0 26px;
    padding:20px 0;
    text-align:center;
    border-top:1px solid ${hex}44;
    border-bottom:1px solid ${hex}22;
">
    <div style="
        color:${hex};
        font-size:.65em;
        letter-spacing:4px;
    ">
        ✦
    </div>

    <div style="
        margin:7px 0;
        color:${hex};
        font-size:1.15em;
        font-weight:800;
        letter-spacing:2px;
        text-transform:uppercase;
    ">
        ${escapeHTML(
            values.title.trim()
        )}
    </div>

    ${
        values.subtitle.trim()
            ? `
                <div style="
                    color:#777;
                    font-style:italic;
                ">
                    ${escapeHTML(
                        values.subtitle.trim()
                    )}
                </div>
            `
            : ''
    }
</div>
`);
            }
        },

        // Terminal Log

        {
            name: '>_ Terminal Log',

            fields: [
                {
                    key: 'label',
                    label: 'System Label',
                    placeholder:
                        'SYSTEM'
                },

                {
                    key: 'message',
                    label: 'Message',
                    type: 'textarea',
                    placeholder:
                        'Connection established...',
                    rows: 4
                },

                {
                    key: 'status',
                    label: 'Status',
                    type: 'select',
                    options: [
                        'ONLINE',
                        'WARNING',
                        'ERROR',
                        'OFFLINE'
                    ],
                    default: 'ONLINE'
                }
            ],

            preview: (values, hex) => {

                const color =
                    values.status === 'ERROR'
                        ? '#d55'
                        : values.status === 'WARNING'
                            ? '#d9a441'
                            : hex;

                return `
                    <div style="
                        background:#080a0b;
                        border:1px solid #252b2d;
                        padding:14px;
                        font-family:monospace;
                    ">
                        <div style="
                            color:${color};
                            font-size:.7em;
                            margin-bottom:8px;
                        ">
                            [${escapeHTML(
                                values.status ||
                                'ONLINE'
                            )}]
                        </div>

                        <div style="
                            color:#8da28f;
                        ">
                            ${escapeHTML(
                                values.message ||
                                'System message...'
                            )}
                        </div>
                    </div>
                `;
            },

            validate: values => {
                if (!values.message.trim()) {
                    showToast(
                        'Please enter a terminal message.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                const color =
                    values.status === 'ERROR'
                        ? '#d55'
                        : values.status === 'WARNING'
                            ? '#d9a441'
                            : values.status === 'OFFLINE'
                                ? '#777'
                                : hex;

                injectText(`
<div style="
    margin:20px 0;
    padding:16px;
    background:#080a0b;
    border:1px solid #252b2d;
    border-left:2px solid ${color};
    font-family:monospace;
">
    <div style="
        color:${color};
        font-size:.7em;
        margin-bottom:9px;
        letter-spacing:1px;
    ">
        [${escapeHTML(
            values.status
        )}]
        ${escapeHTML(
            values.label.trim() ||
            'SYSTEM'
        )}
    </div>

    <div style="
        color:#8da28f;
        line-height:1.7;
        white-space:pre-wrap;
    ">
        ${escapeHTML(
            values.message.trim()
        )}
    </div>
</div>
`);
            }
        },

        // Stat Sheet

        {
            name: '▥ Stat Sheet',

            fields: [
                {
                    key: 'title',
                    label: 'Sheet Title',
                    placeholder:
                        'CHARACTER PROFILE'
                },

                {
                    key: 'stats',
                    label: 'Stats',
                    type: 'textarea',
                    placeholder:
                        'Strength: 80\nAgility: 65\nIntelligence: 90',
                    rows: 7
                }
            ],

            preview: (values, hex) => {

                const lines =
                    String(
                        values.stats || ''
                    )
                        .split('\n')
                        .filter(Boolean)
                        .slice(0, 5);

                return `
                    <div style="
                        padding:14px;
                        background:#111;
                        border:1px solid #2a2a2a;
                    ">
                        <div style="
                            color:${hex};
                            font-weight:800;
                            letter-spacing:1px;
                            margin-bottom:10px;
                        ">
                            ${escapeHTML(
                                values.title ||
                                'CHARACTER PROFILE'
                            )}
                        </div>

                        ${lines
                            .map(line => {

                                const parts =
                                    line.split(':');

                                return `
                                    <div style="
                                        display:flex;
                                        justify-content:space-between;
                                        border-top:1px solid #222;
                                        padding:7px 0;
                                    ">
                                        <span>
                                            ${escapeHTML(
                                                parts[0]
                                            )}
                                        </span>

                                        <strong
                                            style="
                                                color:${hex};
                                            "
                                        >
                                            ${escapeHTML(
                                                parts
                                                    .slice(1)
                                                    .join(':')
                                                    .trim() ||
                                                '—'
                                            )}
                                        </strong>
                                    </div>
                                `;
                            })
                            .join('')}
                    </div>
                `;
            },

            validate: values => {
                if (!values.stats.trim()) {
                    showToast(
                        'Add at least one stat.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                const rows =
                    values.stats
                        .split('\n')
                        .map(line =>
                            line.trim()
                        )
                        .filter(Boolean);

                injectText(`
<div style="
    margin:24px 0;
    padding:18px;
    background:#111;
    border:1px solid #292929;
    border-top:3px solid ${hex};
    border-radius:10px;
">
    ${
        values.title.trim()
            ? `
                <div style="
                    color:${hex};
                    font-weight:800;
                    letter-spacing:1px;
                    margin-bottom:10px;
                ">
                    ${escapeHTML(
                        values.title.trim()
                    )}
                </div>
            `
            : ''
    }

    ${rows
        .map(line => {

            const parts =
                line.split(':');

            const label =
                parts.shift()
                    ?.trim() ||
                '';

            const value =
                parts.join(':')
                    .trim();

            return `
                <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:20px;
                    padding:8px 0;
                    border-top:1px solid #222;
                ">
                    <span style="
                        color:#aaa;
                    ">
                        ${escapeHTML(
                            label
                        )}
                    </span>

                    <strong style="
                        color:${hex};
                    ">
                        ${escapeHTML(
                            value
                        )}
                    </strong>
                </div>
            `;
        })
        .join('')}
</div>
`);
            }
        },

        // Classified File

        {
            name: '▣ Classified File',

            fields: [
                {
                    key: 'classification',
                    label: 'Classification',
                    placeholder:
                        'TOP SECRET'
                },

                {
                    key: 'title',
                    label: 'File Title',
                    placeholder:
                        'SUBJECT: UNKNOWN'
                },

                {
                    key: 'content',
                    label: 'File Content',
                    type: 'textarea',
                    placeholder:
                        'Classified information...',
                    rows: 6
                }
            ],

            preview: (values, hex) => `
                <div style="
                    padding:16px;
                    background:#111;
                    border:1px solid #333;
                    position:relative;
                ">
                    <div style="
                        display:flex;
                        justify-content:space-between;
                        color:#777;
                        font-size:.65em;
                        letter-spacing:2px;
                    ">
                        <span>
                            ${escapeHTML(
                                values.classification ||
                                'CLASSIFIED'
                            )}
                        </span>

                        <span>
                            OBELISK
                        </span>
                    </div>

                    <div style="
                        margin:14px 0 8px;
                        color:${hex};
                        font-weight:800;
                    ">
                        ${escapeHTML(
                            values.title ||
                            'FILE TITLE'
                        )}
                    </div>

                    <div style="
                        color:#999;
                        line-height:1.6;
                    ">
                        ${escapeHTML(
                            values.content ||
                            'Classified information...'
                        )}
                    </div>
                </div>
            `,

            validate: values => {

                if (
                    !values.title.trim() ||
                    !values.content.trim()
                ) {
                    showToast(
                        'Please complete the classified file.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<div style="
    position:relative;
    margin:26px 0;
    padding:20px;
    background:#111;
    border:1px solid #333;
    border-top:3px solid ${hex};
    border-radius:3px;
    box-shadow:0 10px 30px rgba(0,0,0,.3);
">
    <div style="
        display:flex;
        justify-content:space-between;
        gap:12px;
        color:#666;
        font-size:.62em;
        letter-spacing:2px;
        text-transform:uppercase;
    ">
        <span>
            ${escapeHTML(
                values.classification.trim() ||
                'CLASSIFIED'
            )}
        </span>

        <span>
            OBELISK
        </span>
    </div>

    <div style="
        margin:16px 0 10px;
        color:${hex};
        font-weight:900;
        letter-spacing:1px;
        font-size:1.05em;
    ">
        ${escapeHTML(
            values.title.trim()
        )}
    </div>

    <div style="
        color:#999;
        line-height:1.7;
        white-space:pre-wrap;
    ">
        ${escapeHTML(
            values.content.trim()
        )}
    </div>

    <div style="
        margin-top:16px;
        padding-top:10px;
        border-top:1px solid #252525;
        color:#444;
        font-size:.6em;
        letter-spacing:2px;
    ">
        ACCESS RESTRICTED
    </div>
</div>
`);
            }
        },

        ]
    );

})();