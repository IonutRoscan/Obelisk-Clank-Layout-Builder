/**
 * Profile Architecture Tools
 *
 * High-level tools inspired by full-page Clank profile layouts.
 * Everything generated here uses inline styles so it stays compatible
 * with Clank's About renderer without relying on <style> blocks.
 *
 * Tools:
 *   Profile Canvas
 *   Section Header
 *   Archive Group
 *   Live Input Field
 */

(() => {

    'use strict';

    window.Obelisk =
        window.Obelisk || {};

    const core =
        window.Obelisk.core;

    if (!core) {
        console.error(
            '[Obelisk] core.js was not loaded before tools/profile.js.'
        );
        return;
    }

    const {
        escapeHTML,
        showToast,
        injectText,
        findAboutEditor,
        wrapAboutContent
    } = core;

    window.Obelisk.tools =
        window.Obelisk.tools || [];


    // Shared helpers

    const clamp =
        (value, min, max, fallback) => {
            const number =
                Number(value);

            if (!Number.isFinite(number)) {
                return fallback;
            }

            return Math.max(
                min,
                Math.min(max, number)
            );
        };


    const canvasStyle =
        values => {

            const background =
                values.background || '#071422';

            const secondary =
                values.secondary || '#0b1e2d';

            const border =
                values.border || '#1670a6';

            const text =
                values.text || '#d7e6f5';

            const borderWidth =
                clamp(
                    values.borderWidth,
                    0,
                    4,
                    1
                );

            const radius =
                clamp(
                    values.radius,
                    0,
                    32,
                    0
                );

            const padding =
                clamp(
                    values.padding,
                    0,
                    56,
                    16
                );

            const maxWidth =
                clamp(
                    values.maxWidth,
                    420,
                    1400,
                    900
                );

            let bg =
                background;

            let effectiveBorderWidth =
                borderWidth;

            let effectiveRadius =
                radius;

            let shadow =
                'none';

            switch (values.preset) {
                case 'soft':
                    effectiveBorderWidth = 0;
                    effectiveRadius =
                        Math.max(
                            14,
                            radius
                        );
                    shadow =
                        '0 18px 50px rgba(0,0,0,.24)';
                    break;

                case 'archive':
                    bg =
                        `linear-gradient(180deg, ${background} 0%, ${secondary} 100%)`;
                    shadow =
                        `inset 0 0 0 1px ${border}18, 0 20px 60px rgba(0,0,0,.28)`;
                    break;

                case 'gradient':
                    bg =
                        `linear-gradient(135deg, ${background}, ${secondary})`;
                    shadow =
                        `0 20px 60px ${border}12`;
                    break;

                case 'custom':
                    shadow =
                        `inset 0 0 0 1px ${border}12`;
                    break;

                case 'database':
                default:
                    shadow =
                        `inset 0 0 0 1px ${border}10`;
                    break;
            }

            return {
                background: bg,
                border,
                text,
                borderWidth:
                    effectiveBorderWidth,
                radius:
                    effectiveRadius,
                padding,
                maxWidth,
                shadow
            };
        };


    const canvasMarkup =
        values => {

            const style =
                canvasStyle(values);

            return `<div data-obelisk-canvas="true" style="width:100%; max-width:${style.maxWidth}px; margin:28px auto; padding:${style.padding}px; box-sizing:border-box; color:${style.text}; background:${style.background}; border:${style.borderWidth}px solid ${style.border}; border-radius:${style.radius}px; box-shadow:${style.shadow}; overflow:hidden;">`;
        };


    const renderArchiveDetails =
        (
            entry,
            values,
            hex
        ) => {

            const title =
                escapeHTML(
                    entry.title ||
                    'UNTITLED FILE'
                );

            const content =
                escapeHTML(
                    entry.content ||
                    'Hidden information...'
                );

            const border =
                values.borderColor ||
                hex;

            const bg =
                values.surface ||
                '#06111c';

            const radius =
                values.style === 'soft'
                    ? '10px'
                    : values.style === 'minimal'
                        ? '0'
                        : '2px';

            return `
<details style="background:${bg}; border:1px solid ${border}88; border-radius:${radius}; overflow:hidden;">
<summary style="padding:11px 13px; color:${border}; cursor:pointer; font-size:11px; font-weight:800; letter-spacing:1.3px; text-transform:uppercase; background:${border}0c;">${title}</summary>
<div style="padding:12px 14px; color:#c8d5e2; font-size:12px; line-height:1.65; white-space:pre-line; border-top:1px solid ${border}55;">${content}</div>
</details>
            `;
        };


    window.Obelisk.tools.push(
        ...[

        // Profile Canvas

        {
            name: '▰ Profile Canvas',

            fields: [
                {
                    key: 'preset',
                    label: 'Canvas Preset',
                    type: 'select',
                    options: [
                        { label: 'Database Frame', value: 'database' },
                        { label: 'Soft Panel', value: 'soft' },
                        { label: 'Archive Terminal', value: 'archive' },
                        { label: 'Gradient Dossier', value: 'gradient' },
                        { label: 'Custom Shell', value: 'custom' }
                    ],
                    default: 'database'
                },
                {
                    key: 'mode',
                    label: 'Insert Mode',
                    type: 'select',
                    options: [
                        { label: 'Wrap current About content', value: 'wrap' },
                        { label: 'Insert empty canvas at cursor', value: 'empty' }
                    ],
                    default: 'wrap',
                    description:
                        'Wrap mode places everything already in Edit about inside the canvas.'
                },
                {
                    key: 'background',
                    label: 'Background Color',
                    type: 'color',
                    default: '#071422'
                },
                {
                    key: 'secondary',
                    label: 'Secondary / Gradient Color',
                    type: 'color',
                    default: '#0b1e2d'
                },
                {
                    key: 'border',
                    label: 'Border / Accent Color',
                    type: 'color',
                    default: '#1670a6'
                },
                {
                    key: 'text',
                    label: 'Inherited Text Color',
                    type: 'color',
                    default: '#d7e6f5'
                },
                {
                    key: 'borderWidth',
                    label: 'Border Width',
                    type: 'range',
                    min: 0,
                    max: 4,
                    step: 1,
                    default: 1
                },
                {
                    key: 'radius',
                    label: 'Corner Radius',
                    type: 'range',
                    min: 0,
                    max: 32,
                    step: 1,
                    default: 0
                },
                {
                    key: 'padding',
                    label: 'Inner Padding',
                    type: 'range',
                    min: 0,
                    max: 56,
                    step: 2,
                    default: 16
                },
                {
                    key: 'maxWidth',
                    label: 'Maximum Width',
                    type: 'range',
                    min: 420,
                    max: 1400,
                    step: 20,
                    default: 900
                }
            ],

            preview: values => {

                const style =
                    canvasStyle(values);

                return `
                    <div style="padding:8px; background:#151719; border-radius:8px;">
                        <div style="width:100%; min-height:155px; box-sizing:border-box; padding:${Math.min(style.padding, 24)}px; color:${style.text}; background:${style.background}; border:${style.borderWidth}px solid ${style.border}; border-radius:${style.radius}px; box-shadow:${style.shadow}; overflow:hidden;">
                            <div style="font-size:7px; color:${style.border}; letter-spacing:2.8px; text-transform:uppercase; text-align:center;">
                                CITY DATABASE // PROFILE CANVAS
                            </div>
                            <div style="height:1px; margin:12px 0; background:${style.border}77;"></div>
                            <div style="padding:12px; border:1px solid ${style.border}66; color:#b9c6d2; font-size:9px; line-height:1.6;">
                                Existing profile content will live inside this shell.
                            </div>
                        </div>
                    </div>
                `;
            },

            onSubmit: (values) => {

                const opening =
                    canvasMarkup(values);

                if (
                    values.mode === 'wrap'
                ) {

                    const editor =
                        findAboutEditor();

                    if (!editor) {
                        showToast(
                            'Could not find the Edit about editor.',
                            'error'
                        );
                        return;
                    }

                    if (
                        editor.value.includes(
                            'data-obelisk-canvas="true"'
                        ) ||
                        editor.value.includes(
                            "data-obelisk-canvas='true'"
                        )
                    ) {
                        showToast(
                            'This profile already contains an Obelisk canvas.',
                            'error'
                        );
                        return;
                    }

                    wrapAboutContent(
                        opening,
                        '</div>'
                    );
                    return;
                }

                injectText(`
${opening}
<!-- ADD PROFILE CONTENT HERE -->
</div>
                `);
            }
        },


        // Section Header / Divider

        {
            name: '⌁ Section Header',

            fields: [
                {
                    key: 'label',
                    label: 'Section Label',
                    placeholder:
                        'PUBLIC BULLETIN BOARD',
                    default:
                        'PUBLIC BULLETIN BOARD'
                },
                {
                    key: 'style',
                    label: 'Divider Style',
                    type: 'select',
                    options: [
                        { label: 'Centered Hairlines', value: 'center' },
                        { label: 'Database Header', value: 'database' },
                        { label: 'Dossier Slash', value: 'dossier' },
                        { label: 'Thin Rule', value: 'thin' },
                        { label: 'Double Rule', value: 'double' }
                    ],
                    default: 'center'
                },
                {
                    key: 'spacing',
                    label: 'Letter Spacing',
                    type: 'range',
                    min: 0,
                    max: 8,
                    step: 0.5,
                    default: 3
                }
            ],

            preview: (values, hex) => {

                const label =
                    escapeHTML(
                        values.label ||
                        'SECTION HEADER'
                    );

                const spacing =
                    clamp(
                        values.spacing,
                        0,
                        8,
                        3
                    );

                if (values.style === 'database') {
                    return `
                        <div style="color:${hex}; font-size:8px; font-weight:800; letter-spacing:${spacing}px; text-transform:uppercase;">${label}</div>
                        <div style="height:1px; margin-top:10px; background:${hex}88;"></div>
                    `;
                }

                if (values.style === 'dossier') {
                    return `
                        <div style="display:flex; align-items:center; gap:10px; color:${hex}; font-size:8px; font-weight:800; letter-spacing:${spacing}px; text-transform:uppercase;">
                            <span>▣</span><span>${label} // FILE</span><span style="height:1px; flex:1; background:${hex}66;"></span>
                        </div>
                    `;
                }

                if (values.style === 'thin') {
                    return `
                        <div style="text-align:center; color:${hex}; font-size:8px; letter-spacing:${spacing}px; text-transform:uppercase;">${label}</div>
                        <div style="height:1px; margin-top:9px; background:${hex}66;"></div>
                    `;
                }

                if (values.style === 'double') {
                    return `
                        <div style="height:1px; background:${hex}55;"></div>
                        <div style="padding:8px 0; text-align:center; color:${hex}; font-size:8px; letter-spacing:${spacing}px; text-transform:uppercase;">${label}</div>
                        <div style="height:1px; background:${hex}55;"></div>
                    `;
                }

                return `
                    <div style="display:flex; align-items:center; gap:12px;">
                        <span style="height:1px; flex:1; background:${hex}55;"></span>
                        <span style="color:${hex}; font-size:8px; font-weight:800; letter-spacing:${spacing}px; text-transform:uppercase; white-space:nowrap;">${label}</span>
                        <span style="height:1px; flex:1; background:${hex}55;"></span>
                    </div>
                `;
            },

            validate: values => {
                if (!values.label.trim()) {
                    showToast(
                        'Enter a section label.',
                        'error'
                    );
                    return false;
                }
                return true;
            },

            onSubmit: (values, hex) => {

                const label =
                    escapeHTML(
                        values.label.trim()
                    );

                const spacing =
                    clamp(
                        values.spacing,
                        0,
                        8,
                        3
                    );

                let code;

                switch (values.style) {
                    case 'database':
                        code = `
<div style="margin:28px 0 18px; color:${hex}; font-size:9px; font-weight:800; letter-spacing:${spacing}px; text-transform:uppercase;">${label}</div>
<div style="height:1px; margin-top:-8px; margin-bottom:18px; background:${hex}88;"></div>
                        `;
                        break;

                    case 'dossier':
                        code = `
<div style="display:flex; align-items:center; gap:10px; margin:28px 0 16px; color:${hex}; font-size:9px; font-weight:800; letter-spacing:${spacing}px; text-transform:uppercase;">
<span>▣</span>
<span>${label} // FILE</span>
<span style="height:1px; flex:1; background:${hex}66;"></span>
</div>
                        `;
                        break;

                    case 'thin':
                        code = `
<div style="margin:28px 0 16px; text-align:center; color:${hex}; font-size:9px; font-weight:700; letter-spacing:${spacing}px; text-transform:uppercase;">${label}</div>
<div style="height:1px; margin-top:-6px; background:${hex}66;"></div>
                        `;
                        break;

                    case 'double':
                        code = `
<div style="height:1px; margin-top:28px; background:${hex}55;"></div>
<div style="padding:10px 0; text-align:center; color:${hex}; font-size:9px; font-weight:800; letter-spacing:${spacing}px; text-transform:uppercase;">${label}</div>
<div style="height:1px; margin-bottom:18px; background:${hex}55;"></div>
                        `;
                        break;

                    case 'center':
                    default:
                        code = `
<div style="display:flex; align-items:center; gap:14px; margin:28px 0 18px;">
<span style="height:1px; flex:1; background:${hex}55;"></span>
<span style="color:${hex}; font-size:9px; font-weight:800; letter-spacing:${spacing}px; text-transform:uppercase; white-space:nowrap;">${label}</span>
<span style="height:1px; flex:1; background:${hex}55;"></span>
</div>
                        `;
                }

                injectText(code);
            }
        },


        // Archive Group

        {
            name: '▤ Archive Group',

            fields: [
                {
                    key: 'heading',
                    label: 'Archive Heading',
                    placeholder:
                        'ARCHIVE FILES',
                    default:
                        'ARCHIVE FILES'
                },
                {
                    key: 'layout',
                    label: 'Layout',
                    type: 'select',
                    options: [
                        { label: 'Responsive two-column', value: 'responsive' },
                        { label: 'Single column', value: 'single' }
                    ],
                    default: 'responsive'
                },
                {
                    key: 'style',
                    label: 'Archive Style',
                    type: 'select',
                    options: [
                        { label: 'Database', value: 'database' },
                        { label: 'Minimal', value: 'minimal' },
                        { label: 'Soft', value: 'soft' }
                    ],
                    default: 'database'
                },
                {
                    key: 'surface',
                    label: 'Panel Background',
                    type: 'color',
                    default: '#06111c'
                },
                {
                    key: 'borderColor',
                    label: 'Line / Label Color',
                    type: 'color',
                    default: '#1670a6'
                },
                {
                    key: 'entries',
                    label: 'Ordered Dropdowns',
                    type: 'list',
                    minItems: 1,
                    addLabel: 'ADD DROPDOWN',
                    description:
                        'Use ↑ and ↓ to control the exact order before inserting.',
                    itemFields: [
                        {
                            key: 'title',
                            label: 'Title',
                            placeholder:
                                'LEON GRIFFIN · CRIMSONSTEEL'
                        },
                        {
                            key: 'content',
                            label: 'Hidden Content',
                            type: 'textarea',
                            rows: 3,
                            placeholder:
                                'Age: 22\nAbility: ...'
                        }
                    ],
                    default: [
                        {
                            title: 'RIVAL FILE',
                            content: 'Age: 22\nYear: 3rd Year\nHero Rank: A-Rank'
                        },
                        {
                            title: 'VALIANT FAMILY',
                            content: 'A private family record with hidden notes.'
                        },
                        {
                            title: 'PERSONAL PREFERENCES',
                            content: 'Likes, dislikes, routines, and other records.'
                        }
                    ]
                }
            ],

            preview: (values, hex) => {

                const entries =
                    Array.isArray(values.entries)
                        ? values.entries
                        : [];

                const grid =
                    values.layout === 'single'
                        ? 'grid-template-columns:1fr;'
                        : 'grid-template-columns:repeat(auto-fit,minmax(180px,1fr));';

                return `
                    <div style="color:${values.borderColor || hex}; font-size:7px; font-weight:800; letter-spacing:2.5px; text-align:center; text-transform:uppercase; margin-bottom:10px;">
                        ${escapeHTML(values.heading || 'ARCHIVE FILES')}
                    </div>
                    <div style="display:grid; ${grid} gap:8px;">
                        ${entries
                            .slice(0, 4)
                            .map(
                                entry =>
                                    renderArchiveDetails(
                                        entry,
                                        values,
                                        hex
                                    )
                            )
                            .join('')}
                    </div>
                `;
            },

            validate: values => {
                if (!values.heading.trim()) {
                    showToast(
                        'Enter an archive heading.',
                        'error'
                    );
                    return false;
                }

                if (
                    !Array.isArray(values.entries) ||
                    values.entries.length < 1 ||
                    values.entries.some(
                        entry =>
                            !String(entry.title || '').trim()
                    )
                ) {
                    showToast(
                        'Every archive entry needs a title.',
                        'error'
                    );
                    return false;
                }

                return true;
            },

            onSubmit: (values, hex) => {

                const grid =
                    values.layout === 'single'
                        ? 'grid-template-columns:1fr;'
                        : 'grid-template-columns:repeat(auto-fit,minmax(240px,1fr));';

                const border =
                    values.borderColor ||
                    hex;

                const entries =
                    values.entries
                        .map(
                            entry =>
                                renderArchiveDetails(
                                    {
                                        title:
                                            String(entry.title || '').trim(),
                                        content:
                                            String(entry.content || '').trim()
                                    },
                                    values,
                                    hex
                                )
                        )
                        .join('');

                injectText(`
<div style="margin:30px 0;">
<div style="display:flex; align-items:center; gap:12px; margin-bottom:14px;">
<span style="height:1px; flex:1; background:${border}44;"></span>
<span style="color:${border}; font-size:9px; font-weight:800; letter-spacing:3px; text-transform:uppercase; white-space:nowrap;">${escapeHTML(values.heading.trim())}</span>
<span style="height:1px; flex:1; background:${border}44;"></span>
</div>
<div style="display:grid; ${grid} gap:10px; align-items:start;">
${entries}
</div>
</div>
                `);
            }
        },


        // Native live input

        {
            name: '⌨ Live Input Field',

            fields: [
                {
                    key: 'kind',
                    label: 'Input Type',
                    type: 'select',
                    options: [
                        { label: 'Text', value: 'text' },
                        { label: 'Search', value: 'search' },
                        { label: 'Password', value: 'password' },
                        { label: 'Multiline', value: 'textarea' }
                    ],
                    default: 'text'
                },
                {
                    key: 'style',
                    label: 'Visual Style',
                    type: 'select',
                    options: [
                        { label: 'Bulletin Board', value: 'bulletin' },
                        { label: 'Terminal', value: 'terminal' },
                        { label: 'Soft Panel', value: 'soft' },
                        { label: 'Minimal', value: 'minimal' }
                    ],
                    default: 'bulletin'
                },
                {
                    key: 'placeholder',
                    label: 'Placeholder',
                    placeholder:
                        'TYPE A MESSAGE...',
                    default:
                        'TYPE A MESSAGE...'
                },
                {
                    key: 'button',
                    label: 'Button Label',
                    placeholder:
                        'POST',
                    default:
                        'POST',
                    description:
                        'The field can accept typing. The button is visual only; Clank does not provide a save/post action for profile HTML.'
                }
            ],

            preview: (values, hex) => {

                const radius =
                    values.style === 'soft'
                        ? '12px'
                        : values.style === 'minimal'
                            ? '0'
                            : '3px';

                const bg =
                    values.style === 'terminal'
                        ? '#020805'
                        : values.style === 'soft'
                            ? '#11151a'
                            : '#06111c';

                const input =
                    values.kind === 'textarea'
                        ? `<textarea placeholder="${escapeHTML(values.placeholder || 'TYPE HERE...')}" style="min-height:58px; resize:vertical; flex:1; box-sizing:border-box; padding:10px 12px; color:#e4eef7; background:${bg}; border:1px solid ${hex}77; border-radius:${radius}; outline:none; font:inherit;"></textarea>`
                        : `<input type="${escapeHTML(values.kind || 'text')}" placeholder="${escapeHTML(values.placeholder || 'TYPE HERE...')}" style="height:38px; flex:1; min-width:0; box-sizing:border-box; padding:0 12px; color:#e4eef7; background:${bg}; border:1px solid ${hex}77; border-radius:${radius}; outline:none; font:inherit;">`;

                return `
                    <div style="display:flex; align-items:${values.kind === 'textarea' ? 'stretch' : 'center'}; gap:7px;">
                        ${input}
                        <button type="button" style="min-width:58px; padding:0 12px; color:${hex}; background:${hex}12; border:1px solid ${hex}; border-radius:${radius}; font-size:8px; font-weight:800; letter-spacing:1px;">${escapeHTML(values.button || 'POST')}</button>
                    </div>
                `;
            },

            validate: values => {
                if (!values.button.trim()) {
                    showToast(
                        'Enter a button label.',
                        'error'
                    );
                    return false;
                }
                return true;
            },

            onSubmit: (values, hex) => {

                const radius =
                    values.style === 'soft'
                        ? '12px'
                        : values.style === 'minimal'
                            ? '0'
                            : '3px';

                const bg =
                    values.style === 'terminal'
                        ? '#020805'
                        : values.style === 'soft'
                            ? '#11151a'
                            : '#06111c';

                const field =
                    values.kind === 'textarea'
                        ? `<textarea placeholder="${escapeHTML(values.placeholder.trim())}" style="min-height:72px; resize:vertical; flex:1; width:100%; box-sizing:border-box; padding:12px 14px; color:#e4eef7; background:${bg}; border:1px solid ${hex}77; border-radius:${radius}; outline:none; font:inherit; line-height:1.45;"></textarea>`
                        : `<input type="${escapeHTML(values.kind || 'text')}" placeholder="${escapeHTML(values.placeholder.trim())}" style="height:42px; flex:1; min-width:0; box-sizing:border-box; padding:0 14px; color:#e4eef7; background:${bg}; border:1px solid ${hex}77; border-radius:${radius}; outline:none; font:inherit;">`;

                injectText(`
<div style="display:flex; align-items:${values.kind === 'textarea' ? 'stretch' : 'center'}; gap:8px; margin:14px 0;">
${field}
<button type="button" style="min-width:64px; padding:0 14px; color:${hex}; background:${hex}12; border:1px solid ${hex}; border-radius:${radius}; font-size:9px; font-weight:800; letter-spacing:1.2px; text-transform:uppercase; cursor:pointer;">${escapeHTML(values.button.trim())}</button>
</div>
                `);
            }
        }

        ]
    );

})();
