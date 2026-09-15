/**
 * Styled Text & Theme Tools
 *
 * Defines tools focused on typography and strongly themed presentation.
 *
 * Tools in this module:
 *   Styled Text
 *   Cutecore Box
 *   Romance Letter
 *   Abyssal Log
 *
 * Styled Text uses the shared Obelisk font registry. The remaining tools
 * are self-contained visual components.
 *
 * Tool categories, icons and descriptions remain in tool-meta.js.
 *
 * Extends:
 *   window.Obelisk.tools
 *
 * Depends on:
 *   window.Obelisk.core
 *   window.Obelisk.fonts
 */

(() => {

    'use strict';


    window.Obelisk =
        window.Obelisk || {};


    // Module dependencies

    const core =
        window.Obelisk.core;

    const fonts =
        window.Obelisk.fonts;


    if (!core) {

        console.error(
            '[Obelisk] core.js was not loaded before tools/themes.js.'
        );

        return;
    }


    if (!fonts) {

        console.error(
            '[Obelisk] fonts.js was not loaded before tools/themes.js.'
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

        // Styled Text
        {
            name: '📝 Styled Text',
            fields: [
                {
                    key: 'font',
                    label: 'Font Style',
                    type: 'select',
                    options:
                        fonts.getOptions(),
                    default: 'inherit'
                },
                {
                    key: 'align',
                    label: 'Alignment',
                    type: 'select',
                    options: ['left', 'center', 'right', 'justify'],
                    default: 'left'
                },
                {
                    key: 'size',
                    label: 'Text Size (%)',
                    type: 'range',
                    min: 70,
                    max: 200,
                    default: 100
                },
                {
                    key: 'spacing',
                    label: 'Letter Spacing (px)',
                    type: 'range',
                    min: 0,
                    max: 10,
                    default: 0
                },
                {
                    key: 'textColor',
                    label: 'Text Color Override',
                    placeholder: '#cccccc (Leave blank for default)'
                },
                {
                    key: 'content',
                    label: 'Text Content (Supports Markdown)',
                    type: 'textarea',
                    placeholder: 'Type your styled text here...',
                    rows: 4
                }
            ],
            preview: (values, hex) => {
                const color = values.textColor && values.textColor.trim() !== '' ? escapeHTML(values.textColor.trim()) : '#ccc';
                const font =
                    fonts.get(
                        values.font
                    );
                return `
                ${fonts.importTag(values.font)}
                <div style="font-family:${font.family}; text-align:${escapeHTML(values.align)}; font-size:${values.size}%; letter-spacing:${values.spacing}px; color:${color}; padding: 10px;">
                    ${escapeHTML(values.content || 'Preview your text here...')}
                </div>
                `;
            },
            validate: values => values.content.trim() ? true : (showToast('Enter text.', 'error'), false),
            onSubmit: (values, hex) => {
                const color = values.textColor.trim() ? escapeHTML(values.textColor.trim()) : '#ccc';
                const font =
                    fonts.get(
                        values.font
                    );
                injectText(`
${fonts.importTag(values.font)}<div style="margin:20px 0; font-family:${font.family}; text-align:${values.align}; font-size:${values.size}%; letter-spacing:${values.spacing}px; color:${color}; line-height:1.7;">
    ${escapeHTML(values.content.trim())}
</div>
`);
            }
        },

        // Cutecore Box
        {
            name: '🎀 Cutecore Box',
            fields: [
                {
                    key: 'flavor',
                    label: 'Aesthetic Palette',
                    type: 'select',
                    options: [
                        { label: 'Strawberry (Pink)', value: 'pink' },
                        { label: 'Lavender (Purple)', value: 'purple' },
                        { label: 'Mint (Green)', value: 'green' }
                    ],
                    default: 'pink'
                },
                {
                    key: 'banner',
                    label: 'Decoration',
                    type: 'select',
                    options: ['✧･ﾟ: *✧･ﾟ:*', '🌸 🎀 🌸', '🍓 🍰 🍓', '☁️ ✨ ☁️'],
                    default: '✧･ﾟ: *✧･ﾟ:*'
                },
                { key: 'title', label: 'Cute Header', placeholder: 'Welcome!' },
                { key: 'content', label: 'Message', type: 'textarea', placeholder: 'Something sweet...', rows: 3 }
            ],
            preview: (values, hex) => {
                const palettes = {
                    pink: { bg: '#fff0f5', border: '#ffb6c1', textTop: '#ff69b4', textBody: '#ff91a4' },
                    purple: { bg: '#f4f0ff', border: '#d8b4fe', textTop: '#a855f7', textBody: '#c084fc' },
                    green: { bg: '#f0fdf4', border: '#bbf7d0', textTop: '#22c55e', textBody: '#4ade80' }
                };
                const p = palettes[values.flavor] || palettes.pink;
                return `
                <div style="background:${p.bg}; border:2px dotted ${p.border}; border-radius:12px; padding:12px; text-align:center; color:${p.textTop};">
                    <div style="font-size:0.7em; margin-bottom:5px;">${escapeHTML(values.banner)}</div>
                    <strong>${escapeHTML(values.title || 'Header')}</strong>
                    <div style="color:${p.textBody}; font-size:0.85em; margin-top:4px;">${escapeHTML(values.content || 'Content...')}</div>
                </div>
                `;
            },
            validate: values => values.content.trim() ? true : (showToast('Enter content.', 'error'), false),
            onSubmit: (values, hex) => {
                const palettes = {
                    pink: { bg: '#fff0f5', border: '#ffb6c1', textTop: '#ff69b4', textBody: '#ff91a4' },
                    purple: { bg: '#f4f0ff', border: '#d8b4fe', textTop: '#a855f7', textBody: '#c084fc' },
                    green: { bg: '#f0fdf4', border: '#bbf7d0', textTop: '#22c55e', textBody: '#4ade80' }
                };
                const p = palettes[values.flavor] || palettes.pink;

                injectText(`
<div style="margin:24px auto; max-width:85%; background:${p.bg}; border:3px dotted ${p.border}; border-radius:24px; padding:20px; text-align:center; box-shadow:0 8px 20px rgba(0,0,0,0.05);">
    <div style="color:${p.textTop}; font-size:1.1em; letter-spacing:2px; margin-bottom:4px;">
        ${values.banner}
    </div>
    <div style="color:${p.textTop}; font-size:1.3em; font-weight:900; letter-spacing:1px; margin-bottom:10px;">
        ${escapeHTML(values.title.trim() || '✧')}
    </div>
    <div style="color:${p.textBody}; line-height:1.6; font-size:0.95em;">
        ${escapeHTML(values.content.trim())}
    </div>
</div>
`);
            }
        },

        // Romance Letter
        {
            name: '💌 Romance Letter',
            fields: [
                {
                    key: 'paper',
                    label: 'Paper Stock',
                    type: 'select',
                    options: [
                        { label: 'Classic Cream', value: 'cream' },
                        { label: 'Rose Water', value: 'rose' },
                        { label: 'Old Parchment', value: 'parchment' }
                    ],
                    default: 'cream'
                },
                { key: 'greeting', label: 'Greeting', placeholder: 'My Dearest,' },
                { key: 'content', label: 'Letter Body', type: 'textarea', placeholder: 'Write your heart out...', rows: 4 },
                { key: 'signoff', label: 'Sign-off', placeholder: 'Forever yours,' },
                { key: 'seal', label: 'Wax Seal Initial (1 Letter)', placeholder: 'F' }
            ],
            preview: (values, hex) => {
                const papers = {
                    cream: { bg: '#faf8f5', border: '#e8e0d5', top: '#d4a373', text: '#5a4f44', wax: '#8a2b2b' },
                    rose: { bg: '#fff5f5', border: '#fed7d7', top: '#fc8181', text: '#704a4a', wax: '#b83232' },
                    parchment: { bg: '#f3eadd', border: '#d4c4b7', top: '#8c7a6b', text: '#3e362e', wax: '#4a0e0e' }
                };
                const p = papers[values.paper] || papers.cream;
                const initial = (values.seal || '♥').trim().charAt(0).toUpperCase();

                return `
                <div style="background:${p.bg}; border:1px solid ${p.border}; border-top:3px solid ${p.top}; padding:12px; font-family:Georgia, serif; color:${p.text}; position:relative;">
                    <em>${escapeHTML(values.greeting || 'Greeting,')}</em><br>
                    <div style="font-size:0.8em; margin-top:5px; line-height:1.4;">${escapeHTML(values.content || 'Body...')}</div>
                    <div style="text-align:right; margin-top:8px; font-style:italic; color:${p.top}; font-size:0.9em;">${escapeHTML(values.signoff || 'Sign-off')}</div>
                    <div style="position:absolute; bottom:5px; right:5px; width:22px; height:22px; background:${p.wax}; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#fff; font-size:11px;">${initial}</div>
                </div>
                `;
            },
            validate: values => values.content.trim() ? true : (showToast('Enter letter content.', 'error'), false),
            onSubmit: (values, hex) => {
                const papers = {
                    cream: { bg: '#faf8f5', border: '#e8e0d5', top: '#d4a373', text: '#5a4f44', wax: '#8a2b2b' },
                    rose: { bg: '#fff5f5', border: '#fed7d7', top: '#fc8181', text: '#704a4a', wax: '#b83232' },
                    parchment: { bg: '#f3eadd', border: '#d4c4b7', top: '#8c7a6b', text: '#3e362e', wax: '#4a0e0e' }
                };
                const p = papers[values.paper] || papers.cream;
                const initial = values.seal.trim().charAt(0).toUpperCase() || '♥';

                injectText(`
<div style="margin:24px auto; max-width:90%; background:${p.bg}; border:1px solid ${p.border}; border-top:4px solid ${p.top}; padding:30px 30px 45px 30px; font-family:Georgia, 'Times New Roman', serif; color:${p.text}; box-shadow:0 10px 25px rgba(0,0,0,0.1); position:relative;">
    <div style="font-style:italic; font-size:1.1em; margin-bottom:16px;">
        ${escapeHTML(values.greeting.trim())}
    </div>
    <div style="line-height:1.8; font-size:0.95em; white-space:pre-wrap;">
        ${escapeHTML(values.content.trim())}
    </div>
    <div style="margin-top:20px; font-style:italic; text-align:right; font-size:1.05em; color:${p.top};">
        ${escapeHTML(values.signoff.trim())}
    </div>
    <div style="position:absolute; bottom:-20px; right:30px; width:40px; height:40px; background:${p.wax}; border-radius:50%; box-shadow: inset 0 0 10px rgba(0,0,0,0.5), 0 4px 6px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:#fff; font-family:serif; font-style:italic; font-size:1.2em; border:2px solid rgba(255,255,255,0.1);">
        ${initial}
    </div>
</div>
`);
            }
        },

        // Abyssal Log
        {
            name: '👁️ Abyssal Log',
            fields: [
                {
                    key: 'anomaly',
                    label: 'Anomaly Type',
                    type: 'select',
                    options: [
                        { label: 'Blood / Flesh', value: 'blood' },
                        { label: 'Deep Ocean / Drown', value: 'ocean' },
                        { label: 'The Void / Static', value: 'void' }
                    ],
                    default: 'blood'
                },
                {
                    key: 'glitch',
                    label: 'Distortion Level',
                    type: 'select',
                    options: [
                        { label: 'Level 1: Uneasy', value: 'minor' },
                        { label: 'Level 2: Corrupted', value: 'heavy' }
                    ],
                    default: 'minor'
                },
                { key: 'title', label: 'Fragment Name', placeholder: 'MADNESS_LOG.TXT' },
                { key: 'content', label: 'Psychological Horror Text', type: 'textarea', placeholder: 'They are in the walls...', rows: 4 }
            ],
            preview: (values, hex) => {
                const types = {
                    blood: { line: '#8a0303', title: '#d41111', text: '#b3b3b3' },
                    ocean: { line: '#064e3b', title: '#14b8a6', text: '#94a3b8' },
                    void: { line: '#333333', title: '#ffffff', text: '#666666' }
                };
                const t = types[values.anomaly] || types.blood;
                const glitchEffect = values.glitch === 'heavy' ? `text-shadow: -1px 0 ${t.title}80, 1px 0 #00f8; letter-spacing: -0.5px;` : `text-shadow: 0 0 2px rgba(255,255,255,0.2);`;

                return `
                <div style="background:#000; border:1px solid #111; border-left:3px solid ${t.line}; padding:12px; font-family:monospace; color:${t.text};">
                    <strong style="color:${t.title}; letter-spacing:2px; ${glitchEffect}">${escapeHTML(values.title || 'TITLE')}</strong>
                    <div style="font-size:0.8em; margin-top:5px; ${glitchEffect}">${escapeHTML(values.content || 'Content...')}</div>
                </div>
                `;
            },
            validate: values => values.content.trim() ? true : (showToast('Enter eerie content.', 'error'), false),
            onSubmit: (values, hex) => {
                const types = {
                    blood: { line: '#8a0303', title: '#d41111', text: '#b3b3b3', glow: 'rgba(100,0,0,0.15)' },
                    ocean: { line: '#064e3b', title: '#14b8a6', text: '#94a3b8', glow: 'rgba(0,50,50,0.15)' },
                    void: { line: '#333333', title: '#ffffff', text: '#666666', glow: 'rgba(255,255,255,0.05)' }
                };
                const t = types[values.anomaly] || types.blood;
                const glitchEffect = values.glitch === 'heavy' 
                    ? `text-shadow: -2px 0 ${t.title}40, 2px 0 #00f4; letter-spacing: -0.5px;` 
                    : `text-shadow: 0 0 2px rgba(255,255,255,0.1);`;

                injectText(`
<div style="margin:24px 0; background:#000; border:1px solid #111; border-left:4px solid ${t.line}; padding:24px; font-family:'Courier New', Courier, monospace; color:${t.text}; box-shadow: inset 0 0 40px ${t.glow}, 0 10px 30px rgba(0,0,0,0.9);">
    <div style="color:${t.title}; font-weight:bold; letter-spacing:6px; margin-bottom:14px; text-shadow: 2px 0 4px ${t.line};">
        [ ${escapeHTML(values.title.trim())} ]
    </div>
    <div style="line-height:1.8; font-size:0.95em; white-space:pre-wrap; ${glitchEffect}">
        ${escapeHTML(values.content.trim())}
    </div>
</div>
`);
            }
        },

        ]
    );

})();