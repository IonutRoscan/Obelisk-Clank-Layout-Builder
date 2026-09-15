/**
 * Social & Profile Tools
 *
 * Defines tools used for conversations, memories, relationship flavor,
 * notifications and other profile-oriented presentation components.
 *
 * Tools in this module:
 *   Chat Thread
 *   Memory Polaroid
 *   Pet Name Tag
 *   Compatibility Meter
 *   Meme Caption
 *   Fake Notification
 *   Achievement Unlocked
 *   Spoiler Reveal
 *   Content Warning
 *   OOC Note
 *   Evidence Board
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
            '[Obelisk] core.js was not loaded before tools/social.js.'
        );

        return;
    }


    if (!fonts) {

        console.error(
            '[Obelisk] fonts.js was not loaded before tools/social.js.'
        );

        return;
    }


    const {
        escapeHTML,
        showToast,
        injectText
    } = core;


    // Chat Thread helpers

    function obeliskChatTheme(
        style,
        hex
    ) {

        if (style === 'discord') {

            return {
                bg: '#2b2d31',
                border: '#1e1f22',
                leftBubble: '#383a40',
                leftText: '#dbdee1',
                rightBubble: '#404249',
                rightText: '#dbdee1',
                leftLabel: '#949ba4',
                rightLabel: '#949ba4'
            };
        }


        if (style === 'theme') {

            return {
                bg: '#0d0d0d',
                border: '#252525',
                leftBubble: '#1a1a1a',
                leftText: '#ddd',
                rightBubble: hex,
                rightText: '#0a0a0a',
                leftLabel: '#777',
                rightLabel: hex
            };
        }


        // iMessage — default

        return {
            bg: '#000000',
            border: '#1c1c1e',
            leftBubble: '#26262a',
            leftText: '#e9e9eb',
            rightBubble: '#0a84ff',
            rightText: '#ffffff',
            leftLabel: '#8e8e93',
            rightLabel: '#0a84ff'
        };
    }


    function obeliskChatBubbleHTML(
        text,
        side,
        theme,
        isPreview
    ) {

        const isRight =
            side === 'right';

        const bg =
            isRight
                ? theme.rightBubble
                : theme.leftBubble;

        const color =
            isRight
                ? theme.rightText
                : theme.leftText;

        const radius =
            isRight
                ? '16px 16px 4px 16px'
                : '16px 16px 16px 4px';


        return `
            <div style="display:flex; justify-content:${isRight ? 'flex-end' : 'flex-start'};">
                <div style="max-width:${isPreview ? '90%' : '75%'}; background:${bg}; color:${color}; padding:${isPreview ? '6px 10px' : '10px 14px'}; border-radius:${radius}; font-size:${isPreview ? '.75em' : '.95em'}; line-height:1.4; box-shadow:0 2px 6px rgba(0,0,0,.3);">
                    ${escapeHTML(text)}
                </div>
            </div>
        `;
    }


    // Shared tool registry

    window.Obelisk.tools =
        window.Obelisk.tools || [];


    window.Obelisk.tools.push(
        ...[

            // CHAT THREAD
        {
            name: '💬 Chat Thread',
            fields: [
                {
                    key: 'style', label: 'Thread Style', type: 'select',
                    options: [
                        { label: 'iMessage (Blue/Gray)', value: 'imessage' },
                        { label: 'Discord (Dark)', value: 'discord' },
                        { label: 'Theme Color', value: 'theme' }
                    ],
                    default: 'imessage'
                },
                { key: 'leftName', label: 'Left Sender Name', placeholder: 'Them' },
                { key: 'rightName', label: 'Right Sender Name (You)', placeholder: 'You' },
                { key: 'msg1', label: 'Message 1', type: 'textarea', placeholder: 'hey...', rows: 2 },
                { key: 'side1', label: 'Message 1 Side', type: 'select', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }], default: 'left' },
                { key: 'msg2', label: 'Message 2', type: 'textarea', placeholder: 'you up?', rows: 2 },
                { key: 'side2', label: 'Message 2 Side', type: 'select', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }], default: 'left' },
                { key: 'msg3', label: 'Message 3', type: 'textarea', placeholder: 'yeah, what\'s up?', rows: 2 },
                { key: 'side3', label: 'Message 3 Side', type: 'select', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }], default: 'right' },
                { key: 'msg4', label: 'Message 4 (optional)', type: 'textarea', placeholder: '', rows: 2 },
                { key: 'side4', label: 'Message 4 Side', type: 'select', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }], default: 'left' },
                { key: 'msg5', label: 'Message 5 (optional)', type: 'textarea', placeholder: '', rows: 2 },
                { key: 'side5', label: 'Message 5 Side', type: 'select', options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }], default: 'right' }
            ],
            preview: (values, hex) => {
                const theme = obeliskChatTheme(values.style, hex);
                const rows = [1, 2, 3].map(n => obeliskChatBubbleHTML(
                    values[`msg${n}`] || `Message ${n}...`,
                    values[`side${n}`] || (n === 3 ? 'right' : 'left'),
                    theme,
                    true
                )).join('');
                return `
                <div style="display:flex; flex-direction:column; gap:6px; padding:8px; background:${theme.bg};">
                    ${rows}
                </div>
                `;
            },
            validate: values => {
                const hasAny = [1, 2, 3, 4, 5].some(n => (values[`msg${n}`] || '').trim());
                if (!hasAny) {
                    showToast('Enter at least one message.', 'error');
                    return false;
                }
                return true;
            },
            onSubmit: (values, hex) => {
                const theme = obeliskChatTheme(values.style, hex);
                const leftName = escapeHTML((values.leftName || 'Them').trim() || 'Them');
                const rightName = escapeHTML((values.rightName || 'You').trim() || 'You');

                const bubbles = [1, 2, 3, 4, 5]
                    .filter(n => (values[`msg${n}`] || '').trim())
                    .map(n => obeliskChatBubbleHTML(values[`msg${n}`].trim(), values[`side${n}`] || 'left', theme, false))
                    .join('\n');

                injectText(`
<div style="margin:24px auto; max-width:420px; background:${theme.bg}; border:1px solid ${theme.border}; border-radius:14px; padding:16px; box-shadow:0 10px 30px rgba(0,0,0,0.5); font-family:-apple-system, 'Segoe UI', sans-serif;">
    <div style="display:flex; justify-content:space-between; padding:0 6px 12px 6px; border-bottom:1px solid ${theme.border}; margin-bottom:12px;">
        <span style="color:${theme.leftLabel}; font-size:.75em; font-weight:700; letter-spacing:1px; text-transform:uppercase;">${leftName}</span>
        <span style="color:${theme.rightLabel}; font-size:.75em; font-weight:700; letter-spacing:1px; text-transform:uppercase;">${rightName}</span>
    </div>
    <div style="display:flex; flex-direction:column; gap:8px;">
        ${bubbles}
    </div>
</div>
`);
            }
        },

        // MEMORY POLAROID
        {
            name: '📷 Memory Polaroid',
            fields: [
                { key: 'url', label: 'Image URL', placeholder: 'https://...' },
                { key: 'caption', label: 'Handwritten Caption', placeholder: 'that one summer...' },
                { key: 'tilt', label: 'Tilt Angle', type: 'range', min: -12, max: 12, default: -3 }
            ],
            preview: (values, hex) => `
                ${fonts.importTag('handwritten')}
                <div style="text-align:center; padding:10px;">
                    <div style="display:inline-block; background:#f4f1ea; padding:8px 8px 22px 8px; transform:rotate(${values.tilt || -3}deg); box-shadow:0 4px 10px rgba(0,0,0,.4);">
                        ${values.url
                            ? `<img src="${escapeHTML(values.url)}" style="width:140px; height:100px; object-fit:cover; display:block;">`
                            : `<div style="width:140px; height:100px; display:flex; align-items:center; justify-content:center; background:#ddd; color:#888; font-size:.7em;">PHOTO</div>`
                        }
                        <div style="font-family:'Caveat', cursive; color:#333; font-size:1.1em; text-align:center; margin-top:6px;">
                            ${escapeHTML(values.caption || 'a memory...')}
                        </div>
                    </div>
                </div>
            `,
            validate: values => values.url.trim() ? true : (showToast('Enter an image URL.', 'error'), false),
            onSubmit: (values, hex) => {
                const tilt = values.tilt || -3;
                injectText(`
${fonts.importTag('handwritten')}<div style="margin:28px 0; text-align:center;">
    <div style="display:inline-block; background:#f4f1ea; padding:14px 14px 34px 14px; transform:rotate(${tilt}deg); box-shadow:0 10px 25px rgba(0,0,0,.45); border-radius:2px;">
        <img src="${escapeHTML(values.url.trim())}" style="width:260px; max-width:100%; height:190px; object-fit:cover; display:block; filter:sepia(.15) contrast(1.05);">
        <div style="font-family:'Caveat', cursive; color:#3a3530; font-size:1.4em; text-align:center; margin-top:10px; letter-spacing:.5px;">
            ${escapeHTML(values.caption.trim() || 'a memory...')}
        </div>
    </div>
</div>
`);
            }
        },

        // PET NAME TAG
        {
            name: '💞 Pet Name Tag',
            fields: [
                { key: 'name', label: 'Pet Name', placeholder: 'Sunshine' },
                {
                    key: 'style', label: 'Tag Style', type: 'select',
                    options: [
                        { label: 'Soft Pink', value: 'pink' },
                        { label: 'Lavender', value: 'lavender' },
                        { label: 'Theme Color', value: 'theme' }
                    ],
                    default: 'pink'
                }
            ],
            preview: (values, hex) => {
                const c = values.style === 'lavender' ? '#b9a3e3' : values.style === 'theme' ? hex : '#f2a6c1';
                return `
                <div style="display:inline-flex; align-items:center; gap:4px; background:${c}22; border:1px solid ${c}; color:${c}; padding:4px 12px; border-radius:20px; font-size:.8em; font-weight:700; letter-spacing:.5px;">
                    ♡ ${escapeHTML(values.name || 'nickname')}
                </div>
                `;
            },
            validate: values => values.name.trim() ? true : (showToast('Enter a pet name.', 'error'), false),
            onSubmit: (values, hex) => {
                const c = values.style === 'lavender' ? '#b9a3e3' : values.style === 'theme' ? hex : '#f2a6c1';
                injectText(`
<span style="display:inline-flex; align-items:center; gap:5px; background:${c}22; border:1px solid ${c}; color:${c}; padding:5px 16px; border-radius:20px; font-size:.85em; font-weight:700; letter-spacing:.5px; margin:4px;">
    ♡ ${escapeHTML(values.name.trim())}
</span>
`);
            }
        },

        // COMPATIBILITY METER
        {
            name: '💘 Compatibility Meter',
            fields: [
                { key: 'label', label: 'Meter Label', placeholder: 'Compatibility' },
                { key: 'percent', label: 'Percent', type: 'range', min: 0, max: 100, default: 78 },
                {
                    key: 'style', label: 'Color', type: 'select',
                    options: [
                        { label: 'Romantic Pink/Red', value: 'romance' },
                        { label: 'Theme Color', value: 'theme' }
                    ],
                    default: 'romance'
                }
            ],
            preview: (values, hex) => {
                const c = values.style === 'theme' ? hex : '#e05a7a';
                return `
                <div style="padding:6px;">
                    <div style="display:flex; justify-content:space-between; color:#ccc; font-size:.75em; margin-bottom:4px;">
                        <span>${escapeHTML(values.label || 'Compatibility')}</span>
                        <span style="color:${c}; font-weight:700;">${values.percent || 78}%</span>
                    </div>
                    <div style="background:#222; border-radius:8px; height:10px; overflow:hidden;">
                        <div style="width:${values.percent || 78}%; height:100%; background:${c};"></div>
                    </div>
                </div>
                `;
            },
            validate: values => values.label.trim() ? true : (showToast('Enter a label.', 'error'), false),
            onSubmit: (values, hex) => {
                const c = values.style === 'theme' ? hex : '#e05a7a';
                const pct = Math.max(0, Math.min(100, Number(values.percent) || 0));
                injectText(`
<div style="margin:20px 0; max-width:340px;">
    <div style="display:flex; justify-content:space-between; color:#bbb; font-size:.8em; font-weight:700; letter-spacing:.5px; text-transform:uppercase; margin-bottom:6px;">
        <span>♡ ${escapeHTML(values.label.trim())}</span>
        <span style="color:${c};">${pct}%</span>
    </div>
    <div style="background:#1a1a1a; border:1px solid #2a2a2a; border-radius:10px; height:14px; overflow:hidden; box-shadow:inset 0 2px 4px rgba(0,0,0,.4);">
        <div style="width:${pct}%; height:100%; background:linear-gradient(90deg, ${c}aa, ${c}); box-shadow:0 0 10px ${c}88;"></div>
    </div>
</div>
`);
            }
        },

        // MEME CAPTION
        {
            name: '😂 Meme Caption',
            fields: [
                { key: 'url', label: 'Image URL', placeholder: 'https://...' },
                { key: 'top', label: 'Top Text', placeholder: 'WHEN THE PLOT TWIST HITS' },
                { key: 'bottom', label: 'Bottom Text', placeholder: '' }
            ],
            preview: (values, hex) => `
                ${fonts.importTag('impact')}
                <div style="position:relative; display:inline-block; max-width:100%;">
                    ${values.url
                        ? `<img src="${escapeHTML(values.url)}" style="max-width:100%; max-height:160px; display:block; border-radius:4px;">`
                        : `<div style="width:200px; height:120px; display:flex; align-items:center; justify-content:center; background:#222; color:#666; font-size:.7em;">IMAGE</div>`
                    }
                    <div style="position:absolute; top:4px; left:0; right:0; text-align:center; font-family:'Anton', Impact, sans-serif; color:#fff; -webkit-text-stroke:1px #000; text-transform:uppercase; font-size:1em; line-height:1.1; padding:0 4px;">
                        ${escapeHTML(values.top || '')}
                    </div>
                    <div style="position:absolute; bottom:4px; left:0; right:0; text-align:center; font-family:'Anton', Impact, sans-serif; color:#fff; -webkit-text-stroke:1px #000; text-transform:uppercase; font-size:1em; line-height:1.1; padding:0 4px;">
                        ${escapeHTML(values.bottom || '')}
                    </div>
                </div>
            `,
            validate: values => values.url.trim() ? true : (showToast('Enter an image URL.', 'error'), false),
            onSubmit: (values, hex) => {
                injectText(`
${fonts.importTag('impact')}<div style="margin:24px auto; position:relative; display:inline-block; max-width:100%; text-align:center;">
    <img src="${escapeHTML(values.url.trim())}" style="max-width:100%; display:block; border-radius:6px;">
    <div style="position:absolute; top:12px; left:0; right:0; text-align:center; font-family:'Anton', Impact, sans-serif; color:#fff; -webkit-text-stroke:2px #000; text-shadow:2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000; text-transform:uppercase; font-size:1.8em; line-height:1.1; letter-spacing:1px; padding:0 10px;">
        ${escapeHTML(values.top.trim())}
    </div>
    <div style="position:absolute; bottom:12px; left:0; right:0; text-align:center; font-family:'Anton', Impact, sans-serif; color:#fff; -webkit-text-stroke:2px #000; text-shadow:2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000; text-transform:uppercase; font-size:1.8em; line-height:1.1; letter-spacing:1px; padding:0 10px;">
        ${escapeHTML(values.bottom.trim())}
    </div>
</div>
`);
            }
        },

        // FAKE NOTIFICATION
        {
            name: '🔔 Fake Notification',
            fields: [
                { key: 'app', label: 'App Name', placeholder: 'Messages' },
                { key: 'icon', label: 'App Icon (emoji)', placeholder: '💬' },
                { key: 'message', label: 'Notification Text', placeholder: 'is typing...' },
                { key: 'time', label: 'Time Label', placeholder: 'now' }
            ],
            preview: (values, hex) => `
                <div style="background:#1c1c1e; border:1px solid #2c2c2e; border-radius:14px; padding:10px 12px; display:flex; gap:8px; align-items:flex-start; max-width:280px; box-shadow:0 6px 16px rgba(0,0,0,.4);">
                    <div style="width:28px; height:28px; border-radius:7px; background:${hex}; display:flex; align-items:center; justify-content:center; font-size:.9em; flex-shrink:0;">
                        ${escapeHTML(values.icon || '🔔')}
                    </div>
                    <div style="flex:1; min-width:0;">
                        <div style="display:flex; justify-content:space-between; color:#8e8e93; font-size:.65em; font-weight:700; text-transform:uppercase;">
                            <span>${escapeHTML(values.app || 'App')}</span>
                            <span>${escapeHTML(values.time || 'now')}</span>
                        </div>
                        <div style="color:#e9e9eb; font-size:.8em; margin-top:2px;">${escapeHTML(values.message || 'Notification text...')}</div>
                    </div>
                </div>
            `,
            validate: values => values.message.trim() ? true : (showToast('Enter notification text.', 'error'), false),
            onSubmit: (values, hex) => {
                injectText(`
<div style="margin:20px auto; background:rgba(28,28,30,0.92); backdrop-filter:blur(10px); border:1px solid #2c2c2e; border-radius:16px; padding:14px 16px; display:flex; gap:10px; align-items:flex-start; max-width:340px; box-shadow:0 10px 30px rgba(0,0,0,.5); font-family:-apple-system, 'Segoe UI', sans-serif;">
    <div style="width:36px; height:36px; border-radius:9px; background:${hex}; display:flex; align-items:center; justify-content:center; font-size:1.1em; flex-shrink:0;">
        ${escapeHTML(values.icon.trim() || '🔔')}
    </div>
    <div style="flex:1; min-width:0;">
        <div style="display:flex; justify-content:space-between; color:#8e8e93; font-size:.7em; font-weight:700; letter-spacing:.5px; text-transform:uppercase;">
            <span>${escapeHTML(values.app.trim() || 'App')}</span>
            <span>${escapeHTML(values.time.trim() || 'now')}</span>
        </div>
        <div style="color:#e9e9eb; font-size:.9em; margin-top:3px; line-height:1.4;">${escapeHTML(values.message.trim())}</div>
    </div>
</div>
`);
            }
        },

        // ACHIEVEMENT UNLOCKED
        {
            name: '🏆 Achievement Unlocked',
            fields: [
                { key: 'icon', label: 'Icon (emoji)', placeholder: '🏆' },
                { key: 'title', label: 'Achievement Title', placeholder: 'Survived the First Night' },
                { key: 'subtitle', label: 'Subtitle', placeholder: 'Somehow. Barely.' }
            ],
            preview: (values, hex) => `
                <div style="background:#0d0d0d; border:1px solid ${hex}; border-radius:8px; padding:10px 14px; display:flex; gap:10px; align-items:center; max-width:300px; box-shadow:0 0 16px ${hex}44;">
                    <div style="font-size:1.6em;">${escapeHTML(values.icon || '🏆')}</div>
                    <div>
                        <div style="color:${hex}; font-size:.6em; font-weight:700; letter-spacing:1.5px; text-transform:uppercase;">Achievement Unlocked</div>
                        <div style="color:#eee; font-weight:700; font-size:.85em;">${escapeHTML(values.title || 'Title')}</div>
                    </div>
                </div>
            `,
            validate: values => values.title.trim() ? true : (showToast('Enter an achievement title.', 'error'), false),
            onSubmit: (values, hex) => {
                injectText(`
<div style="margin:20px auto; background:linear-gradient(135deg, #0d0d0d, #151515); border:1px solid ${hex}; border-radius:10px; padding:16px 20px; display:flex; gap:14px; align-items:center; max-width:380px; box-shadow:0 0 24px ${hex}55, 0 10px 25px rgba(0,0,0,.5);">
    <div style="font-size:2.2em; filter:drop-shadow(0 0 6px ${hex});">${escapeHTML(values.icon.trim() || '🏆')}</div>
    <div>
        <div style="color:${hex}; font-size:.7em; font-weight:900; letter-spacing:2px; text-transform:uppercase;">Achievement Unlocked</div>
        <div style="color:#f2f2f2; font-weight:800; font-size:1.1em; margin-top:2px;">${escapeHTML(values.title.trim())}</div>
        ${values.subtitle.trim() ? `<div style="color:#999; font-size:.85em; margin-top:2px;">${escapeHTML(values.subtitle.trim())}</div>` : ''}
    </div>
</div>
`);
            }
        },

        // SPOILER REVEAL
        {
            name: '👁️‍🗨️ Spoiler Reveal',
            fields: [
                { key: 'label', label: 'Reveal Label', placeholder: 'SPOILER — Click to Reveal' },
                { key: 'content', label: 'Hidden Content', type: 'textarea', placeholder: 'The thing nobody\'s supposed to know yet...', rows: 4 }
            ],
            preview: (values, hex) => `
                <details style="background:#0a0a0a; border:1px solid #333; border-radius:6px; padding:8px 12px;">
                    <summary style="color:#888; cursor:pointer; font-size:.75em; font-weight:700; letter-spacing:1px; text-transform:uppercase;">
                        ⚠ ${escapeHTML(values.label || 'SPOILER — Click to Reveal')}
                    </summary>
                    <div style="margin-top:8px; color:#ccc; font-size:.85em;">
                        ${escapeHTML(values.content || 'Hidden content...')}
                    </div>
                </details>
            `,
            validate: values => values.content.trim() ? true : (showToast('Enter the hidden content.', 'error'), false),
            onSubmit: (values, hex) => {
                injectText(`
<details style="margin:18px 0; background:#0a0a0a; border:1px dashed #444; border-radius:8px; padding:12px 16px;">
    <summary style="color:#999; cursor:pointer; font-weight:700; letter-spacing:1px; text-transform:uppercase; font-size:.85em;">
        ⚠ ${escapeHTML(values.label.trim() || 'SPOILER — Click to Reveal')}
    </summary>
    <div style="margin-top:12px; padding-top:12px; border-top:1px solid #222; color:#ddd; line-height:1.7;">
        ${escapeHTML(values.content.trim())}
    </div>
</details>
`);
            }
        },

        // CONTENT WARNING
        {
            name: '🚩 Content Warning',
            fields: [
                { key: 'tags', label: 'Warning Topics (comma-separated)', placeholder: 'violence, mild gore, death' },
                { key: 'note', label: 'Extra Note (optional)', placeholder: 'Proceed with care.' }
            ],
            preview: (values, hex) => `
                <div style="background:#1a1010; border:1px solid #4a2222; border-radius:6px; padding:8px 12px; color:#d99;">
                    <div style="font-size:.75em; font-weight:700; letter-spacing:1px;">🚩 CONTENT WARNING</div>
                    <div style="font-size:.75em; color:#c88; margin-top:3px;">${escapeHTML(values.tags || 'topic, topic')}</div>
                </div>
            `,
            validate: values => values.tags.trim() ? true : (showToast('Enter at least one warning topic.', 'error'), false),
            onSubmit: (values, hex) => {
                const tags = values.tags.split(',').map(t => t.trim()).filter(Boolean);
                const tagHTML = tags.map(t => `
                    <span style="background:#2a1414; border:1px solid #4a2222; color:#e08; color:#d99; padding:3px 10px; border-radius:12px; font-size:.75em; margin:2px;">${escapeHTML(t)}</span>
                `).join('');
                injectText(`
<div style="margin:18px 0; background:#150d0d; border:1px solid #4a2222; border-left:3px solid #a33; border-radius:8px; padding:12px 16px;">
    <div style="color:#d99; font-weight:800; letter-spacing:1px; text-transform:uppercase; font-size:.8em; margin-bottom:8px;">🚩 Content Warning</div>
    <div style="display:flex; flex-wrap:wrap; gap:4px;">
        ${tagHTML}
    </div>
    ${values.note.trim() ? `<div style="color:#a88; font-size:.85em; margin-top:8px; font-style:italic;">${escapeHTML(values.note.trim())}</div>` : ''}
</div>
`);
            }
        },

        // OOC NOTE
        {
            name: '💭 OOC Note',
            fields: [
                { key: 'text', label: 'Out-of-Character Note', type: 'textarea', placeholder: 'This character is written for slow-burn RP, not instant romance.', rows: 3 }
            ],
            preview: (values, hex) => `
                <div style="background:#111; border:1px dashed #444; border-radius:6px; padding:8px 12px; color:#999; font-style:italic; font-size:.8em;">
                    ( OOC: ${escapeHTML(values.text || 'note...')} )
                </div>
            `,
            validate: values => values.text.trim() ? true : (showToast('Enter a note.', 'error'), false),
            onSubmit: (values, hex) => {
                injectText(`
<div style="margin:16px 0; background:#0f0f0f; border:1px dashed #3a3a3a; border-radius:8px; padding:12px 16px; color:#999; font-style:italic; font-size:.9em; line-height:1.6;">
    ( OOC: ${escapeHTML(values.text.trim())} )
</div>
`);
            }
        },

        // EVIDENCE BOARD
        {
            name: '📌 Evidence Board',
            fields: [
                { key: 'note1', label: 'Note 1', type: 'textarea', placeholder: 'She was seen near the docks.', rows: 2 },
                { key: 'note2', label: 'Note 2', type: 'textarea', placeholder: 'The letter was never sent.', rows: 2 },
                { key: 'note3', label: 'Note 3', type: 'textarea', placeholder: 'Nobody remembers the third guest.', rows: 2 },
                { key: 'note4', label: 'Note 4 (optional)', type: 'textarea', placeholder: '', rows: 2 }
            ],
            preview: (values, hex) => {
                const notes = [1, 2, 3, 4].map(n => values[`note${n}`]).filter(t => t && t.trim());
                const cards = (notes.length ? notes : ['note...', 'note...']).map((t, i) => `
                    <div style="background:#f2ecd8; color:#222; padding:8px; font-size:.65em; transform:rotate(${(i % 2 === 0 ? -3 : 2)}deg); box-shadow:0 3px 6px rgba(0,0,0,.4); border-radius:2px;">
                        📌 ${escapeHTML(t)}
                    </div>
                `).join('');
                return `
                <div style="background:#3b2f22; padding:10px; border-radius:6px; display:grid; grid-template-columns:1fr 1fr; gap:8px;">
                    ${cards}
                </div>
                `;
            },
            validate: values => {
                const hasAny = [1, 2, 3, 4].some(n => (values[`note${n}`] || '').trim());
                if (!hasAny) {
                    showToast('Enter at least one note.', 'error');
                    return false;
                }
                return true;
            },
            onSubmit: (values, hex) => {
                const notes = [1, 2, 3, 4].map(n => values[`note${n}`]).filter(t => t && t.trim());
                const tilts = [-4, 3, -2, 5];
                const cards = notes.map((t, i) => `
    <div style="background:#f2ecd8; color:#241f16; padding:14px; font-family:'Caveat', cursive; font-size:1.15em; line-height:1.3; transform:rotate(${tilts[i % tilts.length]}deg); box-shadow:0 6px 14px rgba(0,0,0,.5); border-radius:2px; position:relative;">
        <div style="position:absolute; top:-8px; left:50%; transform:translateX(-50%); color:${hex}; font-size:1.4em;">📌</div>
        ${escapeHTML(t.trim())}
    </div>`).join('\n');

                injectText(`
${fonts.importTag('handwritten')}<div style="margin:24px 0; background:#3b2f22; background-image:radial-gradient(#4a3c2c 1px, transparent 1px); background-size:12px 12px; padding:20px; border-radius:8px; border:1px solid #241d14; box-shadow:inset 0 0 30px rgba(0,0,0,.5);">
    <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(140px, 1fr)); gap:20px 24px;">
        ${cards}
    </div>
</div>
`);
            }
        },

        ]
    );

})();