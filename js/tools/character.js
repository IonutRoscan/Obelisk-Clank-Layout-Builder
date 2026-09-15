/**
 * Character & Interaction Tools
 *
 * Defines tools used to introduce characters and represent interactions
 * between them.
 *
 * Tools currently in this module:
 *   Relationship
 *   Dialogue
 *   Character Header
 *   Badge / Tag
 *
 * Tool display metadata remains in tool-meta.js. This file owns the
 * actual fields, previews, validation and generated output.
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
            '[Obelisk] core.js was not loaded before tools/character.js.'
        );

        return;
    }


    const {
        escapeHTML,
        showToast,
        injectText
    } = core;

    const badgeStyleColor = (style, hex) =>
        style === 'Danger'
            ? '#d45c5c'
            : style === 'System'
                ? '#66b7ff'
                : style === 'Ghost'
                    ? '#888'
                    : hex;

    // Shared tool registry

    window.Obelisk.tools =
        window.Obelisk.tools || [];


    window.Obelisk.tools.push(
        ...[
            // Relationship

                    {
            name: '♡ Relationship',

            fields: [
                {
                    key: 'name',
                    label: 'Character',
                    placeholder:
                        'Character name'
                },

                {
                    key: 'relationship',
                    label: 'Relationship',
                    placeholder:
                        'Trusted ally'
                },

                {
                    key: 'description',
                    label: 'Description',
                    type: 'textarea',
                    placeholder:
                        'Describe the relationship...',
                    rows: 4
                }
            ],

            preview: (values, hex) => `
                <div style="
                    padding:15px;
                    background:#111;
                    border:1px solid #2a2a2a;
                    border-top:3px solid ${hex};
                    border-radius:9px;
                ">
                    <div style="
                        color:${hex};
                        font-weight:800;
                    ">
                        ♡ ${
                            escapeHTML(
                                values.name ||
                                'CHARACTER'
                            )
                        }
                    </div>

                    <div style="
                        color:#777;
                        font-size:.75em;
                        margin-top:3px;
                    ">
                        ${
                            escapeHTML(
                                values.relationship ||
                                'RELATIONSHIP'
                            )
                        }
                    </div>

                    <div style="
                        margin-top:9px;
                        color:#aaa;
                    ">
                        ${escapeHTML(
                            values.description ||
                            'Relationship description...'
                        )}
                    </div>
                </div>
            `,

            validate: values => {
                if (
                    !values.name.trim() ||
                    !values.relationship.trim()
                ) {
                    showToast(
                        'Please enter the character and relationship.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<div style="
    margin:16px 0;
    padding:16px;
    background:#111;
    border:1px solid #292929;
    border-top:3px solid ${hex};
    border-radius:10px;
">
    <div style="
        color:${hex};
        font-weight:800;
        font-size:1.05em;
    ">
        ♡ ${escapeHTML(
            values.name.trim()
        )}
    </div>

    <div style="
        color:#777;
        font-size:.75em;
        margin-top:3px;
        letter-spacing:1px;
        text-transform:uppercase;
    ">
        ${escapeHTML(
            values.relationship.trim()
        )}
    </div>

    ${
        values.description.trim()
            ? `
                <div style="
                    margin-top:10px;
                    color:#aaa;
                    line-height:1.6;
                ">
                    ${escapeHTML(
                        values.description.trim()
                    )}
                </div>
            `
            : ''
    }
</div>
`);
            }
        },

        // Dialogue

        {
            name: '◌ Dialogue',

            fields: [
                {
                    key: 'charName',
                    label: 'Character Name',
                    placeholder:
                        'Character'
                },

                {
                    key: 'charText',
                    label: 'Character Dialogue',
                    type: 'textarea',
                    placeholder:
                        'What does the character say?',
                    rows: 3
                },

                {
                    key: 'responderName',
                    label: 'Your Name',
                    placeholder:
                        'YOU'
                },

                {
                    key: 'responderText',
                    label: 'Your Dialogue',
                    type: 'textarea',
                    placeholder:
                        'What do you say?',
                    rows: 3
                }
            ],

            preview: (values, hex) => `
                <div style="
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                ">
                    <div
                        style="
                            align-self:flex-start;
                            max-width:85%;
                        "
                    >
                        <div style="
                            color:${hex};
                            font-size:.7em;
                            font-weight:700;
                            margin-bottom:3px;
                        ">
                            ${
                                escapeHTML(
                                    values.charName ||
                                    'CHARACTER'
                                )
                            }
                        </div>

                        <div style="
                            background:#111;
                            border-left:3px solid ${hex};
                            padding:10px 12px;
                            border-radius:8px;
                            color:#ccc;
                        ">
                            ${
                                escapeHTML(
                                    values.charText ||
                                    'Character dialogue...'
                                )
                            }
                        </div>
                    </div>

                    <div
                        style="
                            align-self:flex-end;
                            max-width:85%;
                            text-align:right;
                        "
                    >
                        <div style="
                            color:#777;
                            font-size:.7em;
                            font-weight:700;
                            margin-bottom:3px;
                        ">
                            ${
                                escapeHTML(
                                    values.responderName ||
                                    'YOU'
                                )
                            }
                        </div>

                        <div style="
                            background:#151515;
                            border-right:3px solid #555;
                            padding:10px 12px;
                            border-radius:8px;
                            color:#aaa;
                        ">
                            ${
                                escapeHTML(
                                    values.responderText ||
                                    'Your dialogue...'
                                )
                            }
                        </div>
                    </div>
                </div>
            `,

            validate: values => {

                if (
                    !values.charName.trim() ||
                    !values.charText.trim() ||
                    !values.responderText.trim()
                ) {
                    showToast(
                        'Please complete the dialogue.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                const charName =
                    escapeHTML(
                        values.charName.trim()
                    );

                const charText =
                    escapeHTML(
                        values.charText.trim()
                    );

                const responderName =
                    escapeHTML(
                        values.responderName.trim() ||
                        'YOU'
                    );

                const responderText =
                    escapeHTML(
                        values.responderText.trim()
                    );

                injectText(`
<div style="
    display:flex;
    flex-direction:column;
    gap:14px;
    margin:24px 0;
    font-size:.95em;
">

    <div style="
        display:flex;
        flex-direction:column;
        align-items:flex-start;
    ">
        <div style="
            color:${hex};
            font-size:.75em;
            font-weight:bold;
            margin-bottom:4px;
            margin-left:4px;
            letter-spacing:1px;
            text-transform:uppercase;
        ">
            ${charName}
        </div>

        <div style="
            background:#111;
            border:1px solid #222;
            border-left:3px solid ${hex};
            border-radius:12px 12px 12px 2px;
            padding:12px 16px;
            color:#ddd;
            max-width:85%;
            line-height:1.6;
            box-shadow:0 4px 10px rgba(0,0,0,.25);
        ">
            "${charText}"
        </div>
    </div>

    <div style="
        display:flex;
        flex-direction:column;
        align-items:flex-end;
    ">
        <div style="
            color:#777;
            font-size:.75em;
            font-weight:bold;
            margin-bottom:4px;
            margin-right:4px;
            letter-spacing:1px;
            text-transform:uppercase;
        ">
            ${responderName.toUpperCase()}
        </div>

        <div style="
            background:#151515;
            border:1px solid #2a2a2a;
            border-right:3px solid #555;
            border-radius:12px 12px 2px 12px;
            padding:12px 16px;
            color:#bbb;
            max-width:85%;
            line-height:1.6;
            text-align:right;
            box-shadow:0 4px 10px rgba(0,0,0,.25);
        ">
            "${responderText}"
        </div>
    </div>

</div>
`);
            }
        },

        // Character Header

        {
            name: '♙ Character Header',

            fields: [
                {
                    key: 'name',
                    label: 'Character Name',
                    placeholder:
                        'Character name'
                },

                {
                    key: 'title',
                    label: 'Title / Role',
                    placeholder:
                        'THE HEAD MAID'
                },

                {
                    key: 'tagline',
                    label: 'Tagline',
                    placeholder:
                        'Steady. Formal. Unreadable.'
                }
            ],

            preview: (values, hex) => `
                <div style="
                    padding:18px;
                    text-align:center;
                    border:1px solid #2a2a2a;
                    border-top:3px solid ${hex};
                    background:#101010;
                ">
                    <div style="
                        color:#777;
                        font-size:.65em;
                        letter-spacing:3px;
                    ">
                        ${escapeHTML(
                            values.title ||
                            'CHARACTER'
                        )}
                    </div>

                    <div style="
                        margin:6px 0;
                        color:${hex};
                        font-size:1.5em;
                        font-weight:800;
                    ">
                        ${escapeHTML(
                            values.name ||
                            'NAME'
                        )}
                    </div>

                    <div style="
                        color:#999;
                        font-style:italic;
                    ">
                        ${escapeHTML(
                            values.tagline ||
                            'Tagline'
                        )}
                    </div>
                </div>
            `,

            validate: values => {
                if (!values.name.trim()) {
                    showToast(
                        'Please enter a character name.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                injectText(`
<div style="
    margin:28px 0;
    padding:24px 18px;
    text-align:center;
    border:1px solid #2a2a2a;
    border-top:3px solid ${hex};
    border-radius:10px;
    background:
        radial-gradient(
            circle at 50% 0%,
            ${hex}18,
            transparent 55%
        ),
        #101010;
">
    ${
        values.title.trim()
            ? `
                <div style="
                    color:#777;
                    font-size:.68em;
                    letter-spacing:3px;
                    text-transform:uppercase;
                ">
                    ${escapeHTML(
                        values.title.trim()
                    )}
                </div>
            `
            : ''
    }

    <div style="
        margin:7px 0;
        color:${hex};
        font-size:1.6em;
        font-weight:800;
        letter-spacing:1px;
    ">
        ${escapeHTML(
            values.name.trim()
        )}
    </div>

    ${
        values.tagline.trim()
            ? `
                <div style="
                    color:#999;
                    font-style:italic;
                ">
                    ${escapeHTML(
                        values.tagline.trim()
                    )}
                </div>
            `
            : ''
    }
</div>
`);
            }
        },

        ],
        // Badge / Tag

        {
            name: '◆ Badge / Tag',

            fields: [
                {
                    key: 'text',
                    label: 'Badge Text',
                    placeholder:
                        'HEAD MAID'
                },

                {
                    key: 'style',
                    label: 'Style',
                    type: 'select',
                    options: [
                        'Gold',
                        'Danger',
                        'System',
                        'Ghost'
                    ],
                    default: 'Gold'
                }
            ],

            preview: (values, hex) => {
                const color =
                    badgeStyleColor(
                        values.style,
                        hex
                    );

                return `
                <span style="
                    display:inline-block;
                    padding:6px 12px;
                    border:1px solid ${color};
                    border-radius:999px;
                    color:${color};
                    font-size:.7em;
                    font-weight:800;
                    letter-spacing:1.5px;
                ">
                    ${escapeHTML(
                        values.text ||
                        'BADGE'
                    )}
                </span>
            `;
            },

            validate: values => {
                if (!values.text.trim()) {
                    showToast(
                        'Please enter badge text.',
                        'error'
                    );

                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                const color =
                    badgeStyleColor(
                        values.style,
                        hex
                    );

                injectText(`
<span style="
    display:inline-block;
    margin:6px 4px;
    padding:6px 12px;
    border:1px solid ${color};
    border-radius:999px;
    color:${color};
    background:${color}12;
    font-size:.68em;
    font-weight:800;
    letter-spacing:1.5px;
    text-transform:uppercase;
">
    ${escapeHTML(
        values.text.trim()
    )}
</span>
`);
            }
        }
    );

})();