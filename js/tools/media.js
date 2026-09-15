/**
 * Media & Visual Widget Tools
 *
 * Defines tools focused on media presentation, visual widgets,
 * embedded content and decorative display components.
 *
 * Tools in this module:
 *   Now Playing
 *   Gradient Text
 *   Scrolling Ticker
 *   Producer Tracklist
 *   Mod Loadout
 *   SoundCloud Player
 *   Sketchfab Model
 *   Cinematic GIF Box
 *   3D Hologram Card
 *
 * Interactive tools that require dedicated controllers, such as
 * Spinning Photo Plane, intentionally live elsewhere.
 *
 * Tool categories, icons and descriptions remain in tool-meta.js.
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
            '[Obelisk] core.js was not loaded before tools/media.js.'
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

        // Now Playing
        {
            name: '💿 Now Playing',
            fields: [
                { key: 'cover', label: 'Album Cover URL', placeholder: 'https://...' },
                { key: 'title', label: 'Song Title', placeholder: 'Bury the Light' },
                { key: 'artist', label: 'Artist Name', placeholder: 'Casey Edwards' },
                { key: 'time', label: 'Timestamp (e.g. 1:45)', placeholder: '1:45' }
            ],
            preview: (values, hex) => {
                const cover = values.cover && values.cover.trim() !== '' ? escapeHTML(values.cover) : 'https://placehold.co/100x100/111/333?text=COVER';
                return `
                <div style="display:flex; align-items:center; gap:12px; background:#111; padding:12px; border-radius:12px; border:1px solid #222;">
                    <img src="${cover}" style="width:45px; height:45px; border-radius:6px; object-fit:cover;">
                    <div style="flex:1;">
                        <strong style="color:#eee; font-size:11px;">${escapeHTML(values.title || 'Song Title')}</strong>
                        <div style="color:#888; font-size:9px;">${escapeHTML(values.artist || 'Artist')}</div>
                        <div style="height:3px; background:#333; margin-top:6px; border-radius:2px;"><div style="width:40%; height:100%; background:${hex}; border-radius:2px;"></div></div>
                    </div>
                </div>
                `;
            },
            validate: values => values.title.trim() ? true : (showToast('Enter a song title.', 'error'), false),
            onSubmit: (values, hex) => {
                const cover = values.cover && values.cover.trim() !== '' ? escapeHTML(values.cover) : 'https://placehold.co/200x200/111/333?text=COVER';
                const title = escapeHTML(values.title.trim());
                const artist = escapeHTML(values.artist.trim() || 'Unknown Artist');
                const time = escapeHTML(values.time.trim() || '1:15');
                
                injectText(`
<div style="display:flex; align-items:center; gap:16px; margin:24px auto; max-width:350px; background:linear-gradient(145deg, #151515, #0d0d0d); border:1px solid #2a2a2a; padding:14px; border-radius:16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
    <img src="${cover}" style="width:65px; height:65px; border-radius:10px; object-fit:cover; box-shadow:0 4px 10px rgba(0,0,0,0.4);">
    <div style="flex:1; min-width:0;">
        <div style="color:#fff; font-weight:800; font-size:1.05em; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; letter-spacing:0.5px;">${title}</div>
        <div style="color:#888; font-size:0.85em; margin-top:2px;">${artist}</div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:8px;">
            <div style="color:#555; font-size:0.7em;">${time}</div>
            <div style="flex:1; height:4px; background:#222; border-radius:2px; position:relative;">
                <div style="position:absolute; left:0; top:0; height:100%; width:45%; background:${hex}; border-radius:2px; box-shadow:0 0 8px ${hex}80;"></div>
            </div>
            <div style="color:#555; font-size:0.7em;">-2:30</div>
        </div>
    </div>
</div>
`);
            }
        },

        // Gradient Text
        {
            name: '✨ Gradient Text',
            fields: [
                {
                    key: 'palette',
                    label: 'Gradient Style',
                    type: 'select',
                    options: [
                        { label: 'Cyberpunk (Neon Pink/Blue)', value: 'linear-gradient(90deg, #ff007f, #00f0ff)' },
                        { label: 'Royal Gold (Gold/White)', value: 'linear-gradient(90deg, #bf953f, #fcf6ba, #b38728)' },
                        { label: 'Pearlescent (Pastel Magic)', value: 'linear-gradient(90deg, #ff9a9e, #fecfef, #a1c4fd)' },
                        { label: 'Inferno (Red/Orange)', value: 'linear-gradient(90deg, #ff4b1f, #ff9068)' }
                    ],
                    default: 'linear-gradient(90deg, #ff007f, #00f0ff)'
                },
                { key: 'text', label: 'Text Content', placeholder: 'LEGENDARY ITEM' },
                { key: 'size', label: 'Font Size (em)', type: 'range', min: 1, max: 4, step: 0.1, default: 1.5 }
            ],
            preview: (values, hex) => `
                <div style="font-weight:900; font-size:${values.size}em; background:${values.palette}; -webkit-background-clip:text; -webkit-text-fill-color:transparent; text-align:center;">
                    ${escapeHTML(values.text || 'GRADIENT')}
                </div>
            `,
            validate: values => values.text.trim() ? true : (showToast('Enter text.', 'error'), false),
            onSubmit: (values, hex) => {
                injectText(`
<div style="margin:20px 0; text-align:center; font-weight:900; font-size:${values.size}em; letter-spacing:2px; background:${values.palette}; -webkit-background-clip:text; -webkit-text-fill-color:transparent; color:transparent; display:inline-block; width:100%;">
    ${escapeHTML(values.text.trim())}
</div>
`);
            }
        },

        // Scrolling Ticker
        {
            name: '🚨 Scrolling Ticker',
            fields: [
                {
                    key: 'style',
                    label: 'Ticker Style',
                    type: 'select',
                    options: [
                        { label: 'System Alert (Red/Black)', value: 'alert' },
                        { label: 'News Feed (Theme Color)', value: 'news' },
                        { label: 'Cyber Matrix (Green/Black)', value: 'matrix' }
                    ],
                    default: 'news'
                },
                { key: 'text', label: 'Scrolling Message', placeholder: 'WARNING: CONTAINMENT BREACH DETECTED IN SECTOR 7...' },
                { key: 'speed', label: 'Scroll Speed', type: 'range', min: 1, max: 20, default: 8 }
            ],
            preview: (values, hex) => {
                const colors = {
                    alert: { bg: '#2a0808', text: '#ff4444', border: '#ff0000' },
                    news: { bg: '#111', text: hex, border: hex },
                    matrix: { bg: '#001a00', text: '#00ff00', border: '#003300' }
                };
                const c = colors[values.style];
                return `
                <div style="background:${c.bg}; border-top:1px solid ${c.border}; border-bottom:1px solid ${c.border}; padding:8px; color:${c.text}; font-family:monospace; font-weight:bold; font-size:10px; overflow:hidden; white-space:nowrap;">
                    > ${escapeHTML(values.text || 'SCROLLING TEXT...')}
                </div>
                `;
            },
            validate: values => values.text.trim() ? true : (showToast('Enter scrolling text.', 'error'), false),
            onSubmit: (values, hex) => {
                const colors = {
                    alert: { bg: '#1a0505', text: '#ff4444', border: '#ff0000' },
                    news: { bg: '#0d0d0d', text: hex, border: hex },
                    matrix: { bg: '#001100', text: '#00ff00', border: '#004400' }
                };
                const c = colors[values.style];
                
                // Using standard HTML marquee for animation without scripts!
                injectText(`
<div style="margin:24px 0; background:${c.bg}; border-top:2px solid ${c.border}; border-bottom:2px solid ${c.border}; padding:10px 0; box-shadow:0 0 15px ${c.border}40;">
    <marquee scrollamount="${values.speed}" style="color:${c.text}; font-family:monospace; font-weight:bold; letter-spacing:2px; font-size:0.9em; text-transform:uppercase;">
        ${escapeHTML(values.text.trim())} &nbsp;&nbsp;✦&nbsp;&nbsp; ${escapeHTML(values.text.trim())} &nbsp;&nbsp;✦&nbsp;&nbsp; ${escapeHTML(values.text.trim())}
    </marquee>
</div>
`);
            }
        },

        // Producer Tracklist
        {
            name: '🎛️ Producer Tracklist',
            fields: [
                { key: 'album', label: 'Project Title', placeholder: 'undrwtr' },
                { key: 'artist', label: 'Artist', placeholder: 'LOXXANI' },
                { key: 'track1', label: 'Track 01', placeholder: 'PULL EM OUT - 2:14' },
                { key: 'track2', label: 'Track 02', placeholder: 'Abyssal - 3:05' },
                { key: 'track3', label: 'Track 03', placeholder: 'Glitch - 1:58' }
            ],
            preview: (values, hex) => `
                <div style="background:#0a0a0a; border:1px solid #222; padding:12px; color:#ccc; font-family:monospace;">
                    <div style="color:${hex}; font-weight:bold; margin-bottom:10px;">EP: ${escapeHTML(values.album || 'ALBUM')}</div>
                    <div style="font-size:0.8em;">01. ${escapeHTML(values.track1 || 'Track')}</div>
                    <div style="font-size:0.8em; margin-top:4px;">02. ${escapeHTML(values.track2 || 'Track')}</div>
                </div>
            `,
            validate: values => values.album.trim() ? true : (showToast('Enter a project title.', 'error'), false),
            onSubmit: (values, hex) => {
                const trk = (num, text) => text.trim() ? `
                    <div style="display:flex; justify-content:space-between; border-bottom:1px dashed #222; padding:8px 0;">
                        <span style="color:#666;">0${num}.</span>
                        <span style="color:#bbb; flex:1; margin-left:12px; letter-spacing:1px;">${escapeHTML(text.split('-')[0].trim())}</span>
                        <span style="color:${hex}; font-size:0.9em;">${escapeHTML((text.split('-')[1] || '').trim())}</span>
                    </div>` : '';

                injectText(`
<div style="margin:24px auto; max-width:320px; background:#080808; border:1px solid #1a1a1a; padding:20px; border-radius:4px; box-shadow:0 10px 25px rgba(0,0,0,0.6); font-family:'Courier New', Courier, monospace;">
    <div style="text-align:center; margin-bottom:18px;">
        <div style="color:${hex}; font-weight:900; font-size:1.2em; letter-spacing:4px; text-transform:uppercase;">${escapeHTML(values.album.trim())}</div>
        <div style="color:#555; font-size:0.7em; letter-spacing:2px; margin-top:4px;">PROD. ${escapeHTML(values.artist.trim() || 'UNKNOWN')}</div>
    </div>
    ${trk(1, values.track1)}
    ${trk(2, values.track2)}
    ${trk(3, values.track3)}
</div>
`);
            }
        },

        // Mod Loadout
        {
            name: '⚙️ Mod Loadout',
            fields: [
                { key: 'title', label: 'Loadout Name', placeholder: 'Vortex Configuration // Active' },
                { key: 'node1', label: 'Core Framework', placeholder: 'TerraHearts Mechanics Core' },
                { key: 'node2', label: 'Dependency 01', placeholder: 'Type 4 - Body' },
                { key: 'node3', label: 'Dependency 02', placeholder: 'Custom UI Overhaul' }
            ],
            preview: (values, hex) => `
                <div style="background:#111; padding:12px; border-left:2px solid ${hex}; color:#ccc; font-size:10px;">
                    <strong>${escapeHTML(values.title || 'Loadout')}</strong>
                    <div style="margin-top:6px; margin-left:10px; border-left:1px solid #444; padding-left:8px;">
                        <div>├─ ${escapeHTML(values.node1 || 'Mod 1')}</div>
                        <div>└─ ${escapeHTML(values.node2 || 'Mod 2')}</div>
                    </div>
                </div>
            `,
            validate: values => values.title.trim() ? true : (showToast('Enter a loadout name.', 'error'), false),
            onSubmit: (values, hex) => {
                const node = (text, isLast) => text.trim() ? `
                    <div style="display:flex; align-items:center; margin-top:8px;">
                        <div style="color:#444; margin-right:8px;">${isLast ? '└─' : '├─'}</div>
                        <div style="background:#151515; border:1px solid #2a2a2a; padding:6px 12px; border-radius:4px; font-size:0.85em; color:#aaa; flex:1; box-shadow:0 2px 8px rgba(0,0,0,0.2);">
                            ${escapeHTML(text.trim())}
                        </div>
                    </div>` : '';

                injectText(`
<div style="margin:24px 0; background:#0d0d0d; border:1px solid #1a1a1a; border-top:3px solid ${hex}; padding:18px; border-radius:6px;">
    <div style="color:${hex}; font-weight:800; letter-spacing:1px; margin-bottom:12px; font-size:0.9em;">
        ${escapeHTML(values.title.trim().toUpperCase())}
    </div>
    <div style="margin-left:8px; border-left:2px solid #222; padding-left:12px; padding-bottom:4px;">
        ${node(values.node1, !values.node2 && !values.node3)}
        ${node(values.node2, !values.node3)}
        ${node(values.node3, true)}
    </div>
</div>
`);
            }
        },

        // SoundCloud Player
        {
            name: '🎵 SoundCloud Player',
            fields: [
                { key: 'url', label: 'SoundCloud Track URL', placeholder: 'https://soundcloud.com/artist/track' }
            ],
            preview: (values, hex) => `
                <div style="padding:12px; background:#111; border:1px dashed #ff5500; color:#ff5500; text-align:center; font-size:10px;">
                    Will attempt to inject SoundCloud iframe for:<br>
                    ${escapeHTML(values.url || 'URL')}
                </div>
            `,
            validate: values => values.url.trim() ? true : (showToast('Enter a SoundCloud URL.', 'error'), false),
            onSubmit: (values, hex) => {
                // SoundCloud's standard visual player iframe. 
                // We use the visual=true flag to get the nice square album art player.
                const encodedUrl = encodeURIComponent(values.url.trim());
                injectText(`
<div style="margin:24px auto; max-width:400px; box-shadow:0 8px 20px rgba(0,0,0,0.5); border-radius:8px; overflow:hidden;">
    <iframe width="100%" height="300" scrolling="no" frameborder="no" allow="autoplay" 
        src="https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23${hex.replace('#', '')}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true">
    </iframe>
</div>
`);
            }
        },
        // Sketchfab Model
        {
            name: '🧊 Sketchfab Model',
            fields: [
                { key: 'url', label: 'Sketchfab Model URL', placeholder: 'https://sketchfab.com/3d-models/your-model-abc123...' },
                {
                    key: 'layout',
                    label: 'Layout',
                    type: 'select',
                    options: ['Default', 'With Title']
                },
                { key: 'charTitle', label: 'Title (used when Layout is "With Title")', placeholder: 'Character Name' },
                { key: 'charDesc', label: 'Description (optional)', type: 'textarea', placeholder: 'A short line about this model...', rows: 3 }
            ],
            preview: (values, hex) => {
                const withTitle = values.layout === 'With Title';

                return `
                <div style="padding:12px; background:#111; border:1px dashed #29b7ff; color:#29b7ff; text-align:center; font-size:10px;">
                    Will attempt to inject Sketchfab iframe for:<br>
                    ${escapeHTML(values.url || 'URL')}
                </div>
                ${
                    withTitle
                        ? `
                            <div style="background:#0d0d0d; border:1px solid #1a1a1a; border-top:none; padding:10px 12px;">
                                <div style="color:${hex}; font-weight:800; font-size:0.85em;">
                                    ${escapeHTML(values.charTitle.trim() || 'Title goes here')}
                                </div>
                                ${
                                    values.charDesc.trim()
                                        ? `
                                            <div style="color:#999; font-size:0.75em; margin-top:4px;">
                                                ${escapeHTML(values.charDesc.trim())}
                                            </div>
                                        `
                                        : ''
                                }
                            </div>
                        `
                        : ''
                }
                `;
            },
            validate: values => {
                if (!values.url.trim()) {
                    showToast('Enter a Sketchfab URL.', 'error');
                    return false;
                }

                if (values.layout === 'With Title' && !values.charTitle.trim()) {
                    showToast('Enter a title, or switch Layout back to Default.', 'error');
                    return false;
                }

                return true;
            },
            onSubmit: (values, hex) => {
                /*
                 * Sketchfab model *page* URLs look like:
                 *   https://sketchfab.com/3d-models/some-title-<32-char-hex-uid>
                 * but the actual embeddable player needs the "/models/<uid>/embed"
                 * form. Pull the 32-char hex UID out of whatever was pasted (page
                 * link, share link, or an already-built embed link all contain it)
                 * and rebuild a clean embed URL from it. If no UID is found (e.g.
                 * a shortened link), fall back to injecting the raw pasted URL as
                 * the iframe src rather than failing silently.
                 */
                const raw = values.url.trim();
                const uidMatch = raw.match(/([0-9a-f]{32})/i);
                const embedSrc = uidMatch
                    ? `https://sketchfab.com/models/${uidMatch[1]}/embed?autostart=0&transparent=0&ui_theme=dark`
                    : raw;

                const withTitle = values.layout === 'With Title';
                const title = values.charTitle.trim();
                const desc = values.charDesc.trim();

                const captionBlock = withTitle ? `
    <div style="background:#0d0d0d; padding:14px 18px; border-top:1px solid #1a1a1a;">
        <div style="color:${hex}; font-weight:800; letter-spacing:0.5px; font-size:1em;">
            ${escapeHTML(title)}
        </div>
        ${desc ? `
        <div style="color:#999; font-size:0.85em; margin-top:6px; line-height:1.4;">
            ${escapeHTML(desc)}
        </div>` : ''}
    </div>` : '';

                injectText(`
<div style="margin:24px auto; max-width:640px; box-shadow:0 8px 20px rgba(0,0,0,0.5); border-radius:8px; overflow:hidden; border-top:3px solid ${hex};">
    <iframe title="Sketchfab Model" width="100%" height="400" src="${embedSrc}" frameborder="0"
        allow="autoplay; fullscreen; xr-spatial-tracking" allowfullscreen mozallowfullscreen="true" webkitallowfullscreen="true">
    </iframe>${captionBlock}
</div>
`);
            }
        },

        // Cinematic GIF Box
        {
            name: '🎇 Cinematic GIF Box',
            fields: [
                { 
                    key: 'effect', 
                    label: 'Background GIF URL', 
                    placeholder: 'https://... (Link to a looping GIF)' 
                },
                { key: 'title', label: 'Title', placeholder: 'ATMOSPHERE' },
                { key: 'content', label: 'Content', type: 'textarea', placeholder: 'The rain poured relentlessly...', rows: 4 }
            ],
            // ... (keep the rest of the preview, validate, and onSubmit exactly the same!)
            preview: (values, hex) => {
                const bgUrl = values.effect && values.effect.trim() !== '' ? escapeHTML(values.effect.trim()) : 'https://placehold.co/400x200/111/333?text=NO+GIF';
                return `
                <div style="position:relative; padding:12px; border:1px solid #333; overflow:hidden;">
                    <div style="position:absolute; inset:0; background:url('${bgUrl}') center/cover; opacity:0.3;"></div>
                    <div style="position:relative; color:#fff; z-index:1;"><strong>${escapeHTML(values.title || 'TITLE')}</strong><br><span style="font-size:0.8em;">${escapeHTML(values.content || 'Content')}</span></div>
                </div>
                `;
            },
            validate: values => {
                if (!values.effect.trim()) {
                    showToast('Enter a GIF URL', 'error');
                    return false;
                }
                if (!values.content.trim()) {
                    showToast('Enter text', 'error');
                    return false;
                }
                return true;
            },
            onSubmit: (values, hex) => {
                injectText(`
<div style="margin:24px 0; position:relative; padding:30px; border:1px solid #1a1a1a; border-radius:8px; overflow:hidden; box-shadow:0 10px 30px rgba(0,0,0,0.8);">
    <!-- The Animated Particle Layer -->
    <div style="position:absolute; inset:0; background:url('${escapeHTML(values.effect.trim())}') center/cover; opacity:0.25; mix-blend-mode:screen; pointer-events:none;"></div>
    <!-- The Darkening Gradient -->
    <div style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.9)); pointer-events:none;"></div>
    
    <!-- The Actual Content -->
    <div style="position:relative; z-index:1; text-align:center;">
        <div style="color:${hex}; font-size:1.1em; font-weight:900; letter-spacing:4px; margin-bottom:12px; text-shadow:0 2px 10px rgba(0,0,0,1);">
            ${escapeHTML(values.title.trim())}
        </div>
        <div style="color:#d9dadd; line-height:1.7; font-size:0.95em; text-shadow:0 1px 5px rgba(0,0,0,1);">
            ${escapeHTML(values.content.trim())}
        </div>
    </div>
</div>
`);
            }
        },

        // 3D Hologram Card
        {
            name: '🃏 3D Hologram Card',
            fields: [
                { key: 'url', label: 'Image URL', placeholder: 'https://...' },
                { key: 'caption', label: 'Card Name', placeholder: 'QUEEN OF CHAOS' }
            ],
            preview: (values, hex) => `
                <div style="text-align:center; color:${hex}; font-size:10px;">Will render tilted in 3D space!</div>
            `,
            validate: values => values.url.trim() ? true : (showToast('Enter image URL', 'error'), false),
            onSubmit: (values, hex) => {
                injectText(`
<div style="margin:40px auto; display:flex; justify-content:center; perspective:1000px;">
    <!-- 3D Transform Container -->
    <div style="transform:rotateY(-15deg) rotateX(10deg); transform-style:preserve-3d; position:relative; background:#000; padding:10px; border-radius:12px; border:2px solid ${hex}; box-shadow:-20px 20px 30px rgba(0,0,0,0.6), inset 0 0 20px ${hex}80;">
        <img src="${escapeHTML(values.url.trim())}" style="display:block; max-width:280px; width:100%; border-radius:6px; box-shadow:0 0 10px rgba(0,0,0,0.8);">
        
        <!-- Gloss Reflection Overlay -->
        <div style="position:absolute; inset:0; background:linear-gradient(115deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 40%, rgba(255,255,255,0) 100%); pointer-events:none; border-radius:12px;"></div>
        
        <div style="position:absolute; bottom:-12px; left:50%; transform:translateX(-50%) translateZ(20px); background:#111; border:1px solid ${hex}; color:#fff; padding:4px 12px; border-radius:4px; font-weight:900; letter-spacing:2px; font-size:0.8em; white-space:nowrap; box-shadow:0 5px 15px rgba(0,0,0,0.9);">
            ${escapeHTML(values.caption.trim())}
        </div>
    </div>
</div>
`);
            }
        },

        ]
    );

})();