/**
 * Studio visual profile editor.
 *
 * Builds and reorders Clank profile sections without requiring users to edit
 * generated markup directly. Studio supports themed components, layer groups,
 * built-in and Signature kits, portable custom kits, undo/redo, and Clank's
 * live profile renderer.
 *
 * Existing profiles are imported conservatively as a Raw Content layer.
 * Studio-generated documents add invisible HTML metadata so editable layers
 * and groups can be reconstructed in later sessions.
 */

(() => {

    'use strict';

    window.Obelisk = window.Obelisk || {};

    const core = window.Obelisk.core;
    const storage = window.Obelisk.storage;

    if (!core || !storage) {
        console.error('[Obelisk] core.js and storage.js must load before studio.js.');
        return;
    }

    const {
        escapeHTML,
        showToast,
        findAboutEditor,
        setAboutEditorValue,
        sanitizeMarkdownHtml,
        captureGeneratedMarkup
    } = core;

    const START_MARKER = '<!-- OBELISK-STUDIO:V1 -->';
    const END_MARKER = '<!-- /OBELISK-STUDIO -->';
    const BLOCK_RE = /<!-- OBELISK-BLOCK:([A-Za-z0-9+/=]+) -->\n?([\s\S]*?)\n?<!-- \/OBELISK-BLOCK -->/g;
    const DOC_META_RE = /<!-- OBELISK-DOC:([A-Za-z0-9+/=]+) -->/;

    const THEME_PRESETS = Object.freeze({
        database: {
            id: 'database', name: 'City Database', accent: '#5da9ff', surface: '#07111b', surface2: '#0a1724', text: '#d7e6f5', muted: '#6f8293', border: '#1b4f72', radius: 3
        },
        gothic: {
            id: 'gothic', name: 'Gothic Archive', accent: '#b78cff', surface: '#0e0a12', surface2: '#17101d', text: '#eee8f5', muted: '#8d7e99', border: '#594268', radius: 2
        },
        soft: {
            id: 'soft', name: 'Soft Panel', accent: '#9bc8ff', surface: '#181c22', surface2: '#222831', text: '#eef5ff', muted: '#a5b1bf', border: '#394452', radius: 14
        },
        terminal: {
            id: 'terminal', name: 'Terminal', accent: '#75f2b4', surface: '#050a08', surface2: '#08110d', text: '#cafbe1', muted: '#5b9074', border: '#174b34', radius: 0
        },
        minimal: {
            id: 'minimal', name: 'Minimal', accent: '#e6e8ec', surface: '#111214', surface2: '#17191c', text: '#f1f2f4', muted: '#92979f', border: '#2b2e33', radius: 8
        },
        fantasy: {
            id: 'fantasy', name: 'Fantasy Tome', accent: '#d0aa68', surface: '#17120b', surface2: '#211a10', text: '#f2e7d0', muted: '#9b8560', border: '#6b5432', radius: 4
        },
        visualnovel: {
            id: 'visualnovel', name: 'Visual Novel', accent: '#ff9bc7', surface: '#171119', surface2: '#241923', text: '#fff1f8', muted: '#b59aaa', border: '#5e4052', radius: 10
        },
        horror: {
            id: 'horror', name: 'Horror Case File', accent: '#d85b6a', surface: '#0d0b0e', surface2: '#171116', text: '#ecdee2', muted: '#92757d', border: '#5d2832', radius: 2
        },
        social: {
            id: 'social', name: 'Soft Social', accent: '#f0a6d0', surface: '#1a1720', surface2: '#27212e', text: '#fff0f8', muted: '#b8a4b4', border: '#4e3d56', radius: 16
        },
        y2k: {
            id: 'y2k', name: 'Y2K / Old Web', accent: '#72e7ff', surface: '#090d1f', surface2: '#16112f', text: '#f7f4ff', muted: '#a3a5d5', border: '#765cff', radius: 7
        },
        editorial: {
            id: 'editorial', name: 'Minimal Editorial', accent: '#e9e3d7', surface: '#111111', surface2: '#181818', text: '#f3f0e9', muted: '#8f8b83', border: '#38352f', radius: 0
        },
        broadcast: {
            id: 'broadcast', name: 'Emergency Broadcast', accent: '#37b9ff', surface: '#050b12', surface2: '#081522', text: '#eef8ff', muted: '#688399', border: '#1b5b80', radius: 2
        },
        vhs: {
            id: 'vhs', name: 'Haunted VHS', accent: '#e16f8c', surface: '#09070b', surface2: '#151018', text: '#f2e9ef', muted: '#917987', border: '#5a3342', radius: 1
        },
        rpg: {
            id: 'rpg', name: 'RPG Save File', accent: '#ffd56a', surface: '#0c1016', surface2: '#141b25', text: '#f8f2de', muted: '#9ca5af', border: '#685a32', radius: 4
        },
        cyberos: {
            id: 'cyberos', name: 'Cyber OS', accent: '#5df2e6', surface: '#03090b', surface2: '#071316', text: '#d8fff9', muted: '#5f9d98', border: '#145b5c', radius: 0
        },
        stage: {
            id: 'stage', name: 'Stage / Artist', accent: '#ff5ac8', surface: '#110915', surface2: '#1f0e28', text: '#fff0fb', muted: '#b28ba7', border: '#6f2e66', radius: 12
        },
        occult: {
            id: 'occult', name: 'Occult Archive', accent: '#c93b4d', surface: '#090708', surface2: '#130d0f', text: '#eee6e2', muted: '#8d7774', border: '#5c242d', radius: 2
        },
        dreamcore: {
            id: 'dreamcore', name: 'Dreamcore Scrapbook', accent: '#b9a7ff', surface: '#12101a', surface2: '#1d1827', text: '#f8f0ff', muted: '#a799b5', border: '#5e5278', radius: 16
        },
        fashion: {
            id: 'fashion', name: 'Dark Fashion Editorial', accent: '#f1ede5', surface: '#090909', surface2: '#141414', text: '#f7f4ef', muted: '#8a8781', border: '#3b3935', radius: 0
        },
        spacecraft: {
            id: 'spacecraft', name: 'Spacecraft AI', accent: '#64d8ff', surface: '#03080d', surface2: '#07131d', text: '#e7f8ff', muted: '#66899b', border: '#19536d', radius: 3
        },
        crimeboard: {
            id: 'crimeboard', name: 'Crime Scene Board', accent: '#e45e67', surface: '#0e0c0c', surface2: '#1a1414', text: '#f3e7e7', muted: '#9a7e7e', border: '#613137', radius: 2
        }
    });

    let root = null;
    let state = null;
    let committedAbout = '';
    let liveAbout = '';
    let dirty = false;
    let previewWasOpen = false;
    let previewAutoOpened = false;
    let previewWrapper = null;
    let previewFrame = null;
    let previewOriginalStyle = '';
    let previewSyncTimer = null;
    let previewResizeObserver = null;
    let previewMutationObserver = null;
    let studioSettings = null;
    let undoStack = [];
    let redoStack = [];
    let maxHistory = 60;
    let openToken = 0;


    // Generic helpers

    const deepClone = value =>
        JSON.parse(JSON.stringify(value));

    const makeId = () =>
        `ob-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

    const isFormControl = target =>
        Boolean(
            target?.closest?.(
                'input, textarea, select, [contenteditable="true"]'
            )
        );

    const encodeMeta = value => {
        const bytes = new TextEncoder().encode(JSON.stringify(value));
        let binary = '';
        bytes.forEach(byte => {
            binary += String.fromCharCode(byte);
        });
        return btoa(binary);
    };

    const decodeMeta = value => {
        try {
            const binary = atob(value);
            const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
            return JSON.parse(new TextDecoder().decode(bytes));
        } catch (error) {
            console.warn('[Obelisk Studio] Could not decode block metadata.', error);
            return null;
        }
    };

    const cssColor = (value, fallback) =>
        /^#[0-9a-f]{6}$/i.test(String(value || ''))
            ? value
            : fallback;

    const clamp = (value, min, max, fallback) => {
        const number = Number(value);
        return Number.isFinite(number)
            ? Math.max(min, Math.min(max, number))
            : fallback;
    };


    // Studio interface preferences

    const STUDIO_UI_DEFAULTS = Object.freeze({
        textScale: 1.25,
        leftWidth: 300,
        rightWidth: 350,
        skin: 'obsidian'
    });

    const STUDIO_FONT_BASES = Object.freeze([
        5.5, 6, 6.5, 7, 8, 9, 10, 11, 15, 16, 17
    ]);

    const studioFontVar = value =>
        `--studio-fs-${String(value).replace('.', '_')}`;

    const normalizeStudioUiSettings = settings => {
        const source = settings && typeof settings === 'object' ? settings : {};
        const skin = ['obsidian', 'midnight', 'graphite'].includes(source.studioSkin)
            ? source.studioSkin
            : STUDIO_UI_DEFAULTS.skin;

        return {
            textScale: clamp(source.studioTextScale, 0.9, 1.7, STUDIO_UI_DEFAULTS.textScale),
            leftWidth: clamp(source.studioLeftWidth, 220, 480, STUDIO_UI_DEFAULTS.leftWidth),
            rightWidth: clamp(source.studioRightWidth, 260, 540, STUDIO_UI_DEFAULTS.rightWidth),
            skin
        };
    };

    const applyStudioUiSettings = () => {
        if (!root) return;

        const ui = normalizeStudioUiSettings(studioSettings);
        studioSettings.studioTextScale = ui.textScale;
        studioSettings.studioLeftWidth = ui.leftWidth;
        studioSettings.studioRightWidth = ui.rightWidth;
        studioSettings.studioSkin = ui.skin;

        root.style.setProperty('--studio-left-width', `${ui.leftWidth}px`);
        root.style.setProperty('--studio-right-width', `${ui.rightWidth}px`);
        root.dataset.studioSkin = ui.skin;

        STUDIO_FONT_BASES.forEach(base => {
            root.style.setProperty(
                studioFontVar(base),
                `${Math.round(base * ui.textScale * 100) / 100}px`
            );
        });

        const scale = root.querySelector('[data-studio-ui-scale]');
        const scaleOut = root.querySelector('[data-studio-ui-scale-output]');
        const left = root.querySelector('[data-studio-ui-left-width]');
        const leftOut = root.querySelector('[data-studio-ui-left-output]');
        const right = root.querySelector('[data-studio-ui-right-width]');
        const rightOut = root.querySelector('[data-studio-ui-right-output]');
        const skin = root.querySelector('[data-studio-ui-skin]');

        if (scale) scale.value = String(Math.round(ui.textScale * 100));
        if (scaleOut) scaleOut.textContent = `${Math.round(ui.textScale * 100)}%`;
        if (left) left.value = String(Math.round(ui.leftWidth));
        if (leftOut) leftOut.textContent = `${Math.round(ui.leftWidth)}px`;
        if (right) right.value = String(Math.round(ui.rightWidth));
        if (rightOut) rightOut.textContent = `${Math.round(ui.rightWidth)}px`;
        if (skin) skin.value = ui.skin;
    };

    const saveStudioUiSettings = () => {
        storage.saveSettings(studioSettings || {});
    };

    const setStudioUiSetting = (key, value, { save = false } = {}) => {
        if (!studioSettings) return;
        studioSettings[key] = value;
        applyStudioUiSettings();
        if (save) saveStudioUiSettings();
    };

    const themeFromPreset = id =>
        deepClone(THEME_PRESETS[id] || THEME_PRESETS.database);

    const normalizeTheme = value => {
        const base = themeFromPreset(value?.id || 'database');
        const incoming = value && typeof value === 'object' ? value : {};
        return {
            ...base,
            ...incoming,
            id: THEME_PRESETS[incoming.id] ? incoming.id : base.id,
            name: incoming.name || base.name,
            accent: cssColor(incoming.accent, base.accent),
            surface: cssColor(incoming.surface, base.surface),
            surface2: cssColor(incoming.surface2, base.surface2),
            text: cssColor(incoming.text, base.text),
            muted: cssColor(incoming.muted, base.muted),
            border: cssColor(incoming.border, base.border),
            radius: clamp(incoming.radius, 0, 32, base.radius)
        };
    };

    const defaultCanvas = () => ({
        enabled: false,
        background: '#07111b',
        border: '#1b4f72',
        borderWidth: 1,
        radius: 3,
        padding: 14
    });

    const normalizeGroups = value =>
        Array.isArray(value)
            ? value
                .filter(group => group && typeof group.id === 'string')
                .map(group => ({
                    id: group.id,
                    name: String(group.name || 'Layer Group').slice(0, 64),
                    collapsed: Boolean(group.collapsed)
                }))
            : [];

    const normalizeDocumentMeta = value => ({
        theme: normalizeTheme(value?.theme),
        canvas: {
            ...defaultCanvas(),
            ...(value?.canvas && typeof value.canvas === 'object' ? value.canvas : {})
        },
        groups: normalizeGroups(value?.groups)
    });

    const themed = (block, key, fallback, theme = state?.theme) => {
        if (block?.data?.useTheme !== false && theme && key in theme) {
            return theme[key];
        }
        return block?.data?.[key] ?? fallback;
    };

    const themeableTypes = new Set([
        'text', 'divider', 'image', 'archive', 'input', 'card', 'stats', 'quote', 'badge', 'link', 'gallery', 'cast', 'music'
    ]);

    // Current compact-panel tool set exposed in Studio. Profile Canvas is the
    // one deliberate exception because Studio's Profile Frame is its native,
    // document-aware equivalent. This leaves 50 insertable panel tools.
    const PANEL_TOOL_NAMES = new Set([
        '✦ Divider', '▣ Framed Image', '▦ Card Grid', '◈ Stat / Skill Bar',
        '❝ Quote', '⌄ Accordion', '⚠ Warning Box', '🌌 Page Background',
        '💓 Pulse Indicator', '🖱️ Hover Reveal Card', '♡ Relationship',
        '◌ Dialogue', '♙ Character Header', '◆ Badge / Tag',
        '🌀 Spinning Photo Plane', '🗺️ Interactive Hotspot Image',
        '🎮 Engine Inspector', '▤ Lore Entry', '◷ Timeline Event',
        '✦ Scene Header', '>_ Terminal Log', '▥ Stat Sheet',
        '▣ Classified File', '💿 Now Playing', '✨ Gradient Text',
        '🚨 Scrolling Ticker', '🎛️ Producer Tracklist', '⚙️ Mod Loadout',
        '🎵 SoundCloud Player', '🧊 Sketchfab Model', '🎇 Cinematic GIF Box',
        '🃏 3D Hologram Card', '💬 Chat Thread', '📷 Memory Polaroid',
        '💞 Pet Name Tag', '💘 Compatibility Meter', '😂 Meme Caption',
        '🔔 Fake Notification', '🏆 Achievement Unlocked', '👁️‍🗨️ Spoiler Reveal',
        '🚩 Content Warning', '💭 OOC Note', '📌 Evidence Board',
        '📝 Styled Text', '🎀 Cutecore Box', '💌 Romance Letter', '👁️ Abyssal Log',
        '⌁ Section Header', '▤ Archive Group', '⌨ Live Input Field'
    ]);

    const compactTools = () =>
        (Array.isArray(window.Obelisk.tools) ? window.Obelisk.tools : [])
            .filter(tool => PANEL_TOOL_NAMES.has(tool?.name));

    const compactToolByName = name =>
        compactTools().find(tool => tool.name === name) || null;

    const compactToolMeta = name =>
        window.Obelisk.meta?.[name] || {
            category: 'TOOLS',
            icon: '◆',
            description: 'Original Obelisk component.'
        };

    const normalizeToolOption = option => {
        if (option && typeof option === 'object') {
            return {
                label: String(option.label ?? option.value ?? ''),
                value: String(option.value ?? option.label ?? '')
            };
        }
        return { label: String(option ?? ''), value: String(option ?? '') };
    };

    const defaultToolValues = tool => {
        const values = {};
        (tool?.fields || []).forEach(fieldDef => {
            if (fieldDef.default !== undefined) {
                values[fieldDef.key] = deepClone(fieldDef.default);
                return;
            }
            if (fieldDef.type === 'list') {
                values[fieldDef.key] = [];
                return;
            }
            if (fieldDef.type === 'select' && Array.isArray(fieldDef.options) && fieldDef.options.length) {
                values[fieldDef.key] = normalizeToolOption(fieldDef.options[0]).value;
                return;
            }
            if (fieldDef.type === 'range') {
                values[fieldDef.key] = fieldDef.min ?? 0;
                return;
            }
            values[fieldDef.key] = '';
        });
        return values;
    };

    const normalizeToolValues = (tool, incoming) => ({
        ...defaultToolValues(tool),
        ...(incoming && typeof incoming === 'object' ? incoming : {})
    });

    const blockLabel = block => {
        if (block?.type === 'tool') {
            return String(block.data?.name || block.data?.toolName || 'Obelisk Tool').slice(0, 42);
        }

        const custom = String(block?.data?.name || block?.data?.title || '').trim();
        if (custom) {
            return custom.slice(0, 42);
        }

        return ({
            raw: 'Imported Profile',
            text: 'Text Block',
            divider: 'Section Header',
            image: 'Image Frame',
            archive: 'Archive Group',
            input: 'Live Input',
            card: 'Info Card',
            stats: 'Stat Grid',
            quote: 'Quote Block',
            badge: 'Badge',
            link: 'Link Button',
            gallery: 'Gallery',
            cast: 'Character Cast',
            music: 'Theme Music',
            spacer: 'Spacer'
        })[block?.type] || 'Profile Block';
    };

    const blockIcon = (type, block = null) => {
        if (type === 'tool') {
            return compactToolMeta(block?.data?.toolName).icon || '◆';
        }

        return ({
            raw: '</>',
            text: 'Aa',
            divider: '⌁',
            image: '▣',
            archive: '▤',
            input: '⌨',
            card: '▰',
            stats: '▦',
            quote: '❞',
            badge: '◆',
            link: '↗',
            gallery: '▥',
            cast: '♟',
            music: '♫',
            spacer: '↕'
        })[type] || '◆';
    };


    // Studio component defaults

    const createBlock = type => {
        const base = {
            id: makeId(),
            type,
            data: {}
        };

        switch (type) {
            case 'text':
                base.data = {
                    name: 'Text Block',
                    useTheme: true,
                    eyebrow: 'PROFILE RECORD',
                    title: 'New Section',
                    body: 'Write something about your character here.',
                    align: 'left',
                    accent: '#5da9ff',
                    text: '#d7e6f5',
                    surface: '#07111b',
                    border: '#1b4f72',
                    radius: 4,
                    padding: 16
                };
                break;

            case 'divider':
                base.data = {
                    name: 'Section Header',
                    useTheme: true,
                    label: 'PUBLIC BULLETIN BOARD',
                    style: 'center',
                    accent: '#5da9ff',
                    muted: '#17354c'
                };
                break;

            case 'image':
                base.data = {
                    name: 'Image Frame',
                    useTheme: true,
                    url: '',
                    alt: 'Character image',
                    accent: '#5da9ff',
                    radius: 4,
                    borderWidth: 1,
                    maxWidth: 420
                };
                break;

            case 'archive':
                base.data = {
                    name: 'Archive Group',
                    useTheme: true,
                    accent: '#5da9ff',
                    surface: '#07111b',
                    columns: 1,
                    entries: [
                        {
                            title: 'RIVAL FILE',
                            content: 'Hidden information...'
                        },
                        {
                            title: 'PERSONAL RECORD',
                            content: 'Another expandable record.'
                        }
                    ]
                };
                break;

            case 'input':
                base.data = {
                    name: 'Live Input',
                    useTheme: true,
                    type: 'text',
                    placeholder: 'THIS IS ME TYPING!',
                    button: 'POST',
                    accent: '#5da9ff',
                    surface: '#07111b',
                    text: '#d7e6f5',
                    radius: 2
                };
                break;

            case 'card':
                base.data = {
                    name: 'Info Card', useTheme: true, eyebrow: 'CIVILIAN RECORD', title: 'Profile Card', body: 'A flexible information card for your character.', accent: '#5da9ff', text: '#d7e6f5', surface: '#07111b', border: '#1b4f72', radius: 3, padding: 14
                };
                break;

            case 'stats':
                base.data = {
                    name: 'Stat Grid', useTheme: true, accent: '#5da9ff', text: '#d7e6f5', surface: '#07111b', border: '#1b4f72', columns: 2, entries: [
                        { label: 'AGE', value: '22' },
                        { label: 'HEIGHT', value: `6'2"` },
                        { label: 'YEAR', value: '3rd Year' },
                        { label: 'MAJOR', value: 'Computer Engineering' }
                    ]
                };
                break;

            case 'quote':
                base.data = {
                    name: 'Quote Block', useTheme: true, quote: 'A line worth remembering.', attribution: 'Character Name', accent: '#5da9ff', text: '#d7e6f5', surface: '#07111b', border: '#1b4f72', align: 'left', radius: 3
                };
                break;

            case 'badge':
                base.data = {
                    name: 'Badge', useTheme: true, label: 'ONLINE', accent: '#5da9ff', text: '#d7e6f5', surface: '#07111b', radius: 999, align: 'left'
                };
                break;

            case 'link':
                base.data = {
                    name: 'Link Button', useTheme: true, label: 'OPEN FILE', url: 'https://', accent: '#5da9ff', text: '#d7e6f5', surface: '#07111b', border: '#1b4f72', radius: 3, align: 'left'
                };
                break;

            case 'gallery':
                base.data = {
                    name: 'Gallery', useTheme: true, accent: '#5da9ff', border: '#1b4f72', radius: 3, columns: 2, images: [
                        { url: '', alt: 'Gallery image 1' },
                        { url: '', alt: 'Gallery image 2' }
                    ]
                };
                break;

            case 'cast':
                base.data = {
                    name: 'Character Cast', useTheme: true, accent: '#5da9ff', text: '#d7e6f5', surface: '#07111b', border: '#1b4f72', radius: 6, columns: 2, entries: [
                        { name: 'CHARACTER ONE', role: 'LEAD', portrait: '', note: '' },
                        { name: 'CHARACTER TWO', role: 'PARTNER', portrait: '', note: '' }
                    ]
                };
                break;

            case 'music':
                base.data = {
                    name: 'Theme Music', useTheme: true, title: 'CHARACTER THEME', artist: 'Artist', cover: '', soundcloud: '', accent: '#5da9ff', text: '#d7e6f5', surface: '#07111b', border: '#1b4f72', radius: 10, compact: true
                };
                break;

            case 'spacer':
                base.data = {
                    name: 'Spacer',
                    height: 24
                };
                break;

            case 'raw':
            default:
                base.type = 'raw';
                base.data = {
                    name: 'Imported Profile',
                    raw: ''
                };
                break;
        }

        return base;
    };

    const createToolBlock = toolName => {
        const tool = compactToolByName(toolName);
        if (!tool) {
            return null;
        }

        const meta = compactToolMeta(toolName);
        const cleanName = String(toolName).replace(/^\S+\s+/, '').trim() || toolName;

        return {
            id: makeId(),
            type: 'tool',
            data: {
                name: cleanName,
                toolName,
                category: meta.category || 'TOOLS',
                followThemeAccent: true,
                accent: state?.theme?.accent || '#5da9ff',
                values: defaultToolValues(tool)
            }
        };
    };


    // Editable Profile Kits

    // Kits are recipes, not flattened markup. Every recipe item becomes a normal
    // Studio block, so users can reorder it, delete it, duplicate it, change its
    // inspector values, unlink it from the theme, or mix it with other kits.
    const CORE_KIT_DEFINITIONS = Object.freeze([
        {
            id: 'city-database',
            name: 'City Database',
            genre: 'DOSSIER',
            theme: 'database',
            description: 'A clean civilian/personnel record with database headers, identity fields, bulletin notes and expandable archives.',
            tags: ['DATABASE', 'LORE', 'STRUCTURED'],
            frame: { enabled: true, padding: 16, borderWidth: 1 },
            sections: [
                { id: 'identity', label: 'Identity Header', description: 'Record title and character introduction.', blocks: [
                    ['divider', { name: 'Database Header', label: 'CITY DATABASE // CIVILIAN RECORD', style: 'database' }],
                    ['text', { name: 'Identity Record', eyebrow: 'ACTIVE PERSONNEL FILE', title: 'CHARACTER NAME', body: 'Role · affiliation · short identity line', align: 'center', padding: 18 }]
                ]},
                { id: 'personnel', label: 'Personnel File', description: 'Portrait and quick facts.', blocks: [
                    ['divider', { name: 'Personnel Divider', label: 'CIVILIAN PERSONNEL FILE // PUBLIC INFORMATION', style: 'slash' }],
                    ['image', { name: 'Personnel Portrait', alt: 'Character portrait', maxWidth: 420, borderWidth: 1 }],
                    ['stats', { name: 'Personnel Stats', columns: 1, entries: [
                        { label: 'AGE', value: '—' }, { label: 'HEIGHT', value: '—' }, { label: 'YEAR / ERA', value: '—' }, { label: 'OCCUPATION', value: '—' }, { label: 'PUBLIC STATUS', value: '—' }
                    ]}]
                ]},
                { id: 'overview', label: 'Public Overview', description: 'Appearance, personality and public notes.', blocks: [
                    ['card', { name: 'Appearance Record', eyebrow: 'APPEARANCE', title: 'Observed Features', body: 'Describe the character’s appearance here.' }],
                    ['card', { name: 'Personality Record', eyebrow: 'BEHAVIORAL NOTES', title: 'Public Personality', body: 'Describe the character’s public-facing personality here.' }]
                ]},
                { id: 'bulletin', label: 'Bulletin Board', description: 'A dramatic public notice or current-event section.', blocks: [
                    ['divider', { name: 'Bulletin Divider', label: 'PUBLIC BULLETIN BOARD', style: 'center' }],
                    ['quote', { name: 'Public Notice', quote: 'Insert a report, rumor, headline or public notice.', attribution: 'CITY FEED', align: 'left' }]
                ]},
                { id: 'archives', label: 'Archive Files', description: 'Expandable lore and relationship files.', blocks: [
                    ['divider', { name: 'Archive Divider', label: 'ARCHIVE FILES', style: 'center' }],
                    ['archive', { name: 'Archive Files', columns: 2, entries: [
                        { title: 'RIVAL FILE', content: 'Add rival or enemy information.' },
                        { title: 'FAMILY / ALLIES', content: 'Add family or ally information.' },
                        { title: 'PRIVATE NOTES', content: 'Add additional lore.' },
                        { title: 'CLASSIFIED', content: 'Add hidden or spoiler-heavy information.' }
                    ]}]
                ]}
            ]
        },
        {
            id: 'gothic-archive',
            name: 'Gothic Archive',
            genre: 'GOTHIC',
            theme: 'gothic',
            description: 'An elegant dark archive for dramatic characters, old houses, supernatural lore and relationship records.',
            tags: ['GOTHIC', 'LORE', 'DARK'],
            frame: { enabled: true, padding: 18, borderWidth: 1 },
            sections: [
                { id: 'opening', label: 'Opening', description: 'Ornamental title and portrait.', blocks: [
                    ['divider', { name: 'Gothic Title', label: 'THE ARCHIVE OPENS', style: 'double' }],
                    ['text', { name: 'Character Introduction', eyebrow: 'PRIVATE ARCHIVE', title: 'Character Name', body: 'A short epithet, role, or atmospheric introduction.', align: 'center' }],
                    ['image', { name: 'Archive Portrait', alt: 'Character portrait', borderWidth: 1, maxWidth: 420 }]
                ]},
                { id: 'essence', label: 'Character Essence', description: 'Quote and core identity.', blocks: [
                    ['quote', { name: 'Signature Quote', quote: 'A line that immediately communicates who this character is.', attribution: 'CHARACTER NAME', align: 'center' }],
                    ['stats', { name: 'Archive Details', columns: 2, entries: [
                        { label: 'AGE', value: '—' }, { label: 'ROLE', value: '—' }, { label: 'ORIGIN', value: '—' }, { label: 'STATUS', value: '—' }
                    ]}]
                ]},
                { id: 'lore', label: 'Lore', description: 'Background and secrets.', blocks: [
                    ['divider', { name: 'Lore Divider', label: 'CHRONICLE', style: 'center' }],
                    ['card', { name: 'History', eyebrow: 'I. HISTORY', title: 'What Came Before', body: 'Write the character history here.' }],
                    ['card', { name: 'Present', eyebrow: 'II. PRESENT', title: 'What Remains', body: 'Write the character’s current situation here.' }]
                ]},
                { id: 'relations', label: 'Relations', description: 'Expandable relationship records.', blocks: [
                    ['archive', { name: 'Relationship Archive', columns: 1, entries: [
                        { title: 'THE BELOVED', content: 'Relationship notes.' }, { title: 'THE RIVAL', content: 'Relationship notes.' }, { title: 'THE LOST', content: 'Relationship notes.' }
                    ]}]
                ]},
                { id: 'closing', label: 'Closing', description: 'A restrained ending section.', blocks: [
                    ['divider', { name: 'Closing Divider', label: 'END OF RECORD', style: 'double' }]
                ]}
            ]
        },
        {
            id: 'fantasy-tome',
            name: 'Fantasy Tome',
            genre: 'FANTASY',
            theme: 'fantasy',
            description: 'A chapter-like fantasy profile for adventurers, nobles, mages, artifacts and world lore.',
            tags: ['FANTASY', 'WORLD', 'LORE'],
            frame: { enabled: true, padding: 18, borderWidth: 1 },
            sections: [
                { id: 'title', label: 'Title Page', description: 'Name, epithet and portrait.', blocks: [
                    ['divider', { name: 'Tome Header', label: 'THE CHRONICLE OF', style: 'double' }],
                    ['text', { name: 'Tome Title', eyebrow: 'VOLUME I', title: 'CHARACTER NAME', body: 'The title, epithet, house, order, or legend attached to them.', align: 'center' }],
                    ['image', { name: 'Tome Portrait', alt: 'Character portrait', borderWidth: 1 }]
                ]},
                { id: 'identity', label: 'Adventurer Record', description: 'Core RPG-like information.', blocks: [
                    ['stats', { name: 'Adventurer Record', columns: 2, entries: [
                        { label: 'CLASS', value: '—' }, { label: 'ORIGIN', value: '—' }, { label: 'ALLEGIANCE', value: '—' }, { label: 'RANK', value: '—' }, { label: 'WEAPON', value: '—' }, { label: 'MAGIC', value: '—' }
                    ]}]
                ]},
                { id: 'chronicle', label: 'Chronicle', description: 'Backstory and current quest.', blocks: [
                    ['divider', { name: 'Chronicle Divider', label: 'CHAPTER // HISTORY', style: 'slash' }],
                    ['card', { name: 'Origin Story', eyebrow: 'CHAPTER I', title: 'Origins', body: 'Write the beginning of the character’s story.' }],
                    ['card', { name: 'Current Quest', eyebrow: 'CHAPTER II', title: 'Current Quest', body: 'What are they doing now, and what are they seeking?' }]
                ]},
                { id: 'lore', label: 'Lore & Artifacts', description: 'Expandable lore records.', blocks: [
                    ['archive', { name: 'Lore Compendium', columns: 1, entries: [
                        { title: 'ABILITIES', content: 'Powers, techniques, magic or talents.' }, { title: 'ARTIFACTS', content: 'Weapons, relics or important objects.' }, { title: 'FACTIONS', content: 'Allies, enemies, houses or organizations.' }
                    ]}]
                ]},
                { id: 'gallery', label: 'Illustrations', description: 'Artwork or location gallery.', blocks: [
                    ['divider', { name: 'Illustration Divider', label: 'ILLUSTRATIONS', style: 'center' }],
                    ['gallery', { name: 'Illustration Gallery', columns: 2, images: [
                        { url: '', alt: 'Character artwork' }, { url: '', alt: 'Location or artifact artwork' }
                    ]}]
                ]}
            ]
        },
        {
            id: 'terminal-node',
            name: 'Cyber Terminal',
            genre: 'SCI-FI',
            theme: 'terminal',
            description: 'A system-node profile with diagnostics, access logs, status readouts and terminal-like archives.',
            tags: ['TERMINAL', 'SCI-FI', 'TECH'],
            frame: { enabled: true, padding: 14, borderWidth: 1 },
            sections: [
                { id: 'boot', label: 'Boot Record', description: 'System header and subject identity.', blocks: [
                    ['text', { name: 'System Identity', eyebrow: 'NODE // ONLINE', title: 'SUBJECT_NAME', body: 'IDENTITY RECORD LOADED\nACCESS LEVEL: USER', align: 'left', padding: 14 }],
                    ['badge', { name: 'Online Status', label: 'ONLINE', align: 'left' }]
                ]},
                { id: 'diagnostics', label: 'Diagnostics', description: 'Fast technical readouts.', blocks: [
                    ['divider', { name: 'Diagnostics Divider', label: 'SYSTEM DIAGNOSTICS', style: 'slash' }],
                    ['stats', { name: 'Diagnostics', columns: 2, entries: [
                        { label: 'STATUS', value: 'ONLINE' }, { label: 'CLEARANCE', value: 'LEVEL 03' }, { label: 'AFFILIATION', value: '—' }, { label: 'THREAT', value: 'UNKNOWN' }
                    ]}]
                ]},
                { id: 'logs', label: 'Logs', description: 'Expandable logs and records.', blocks: [
                    ['archive', { name: 'System Logs', columns: 1, entries: [
                        { title: 'LOG_001 // ORIGIN', content: 'Write origin data.' }, { title: 'LOG_002 // BEHAVIOR', content: 'Write behavior data.' }, { title: 'LOG_003 // REDACTED', content: 'Write secret data.' }
                    ]}]
                ]},
                { id: 'console', label: 'Console', description: 'Interactive-looking browser input.', blocks: [
                    ['divider', { name: 'Console Divider', label: 'USER CONSOLE', style: 'database' }],
                    ['input', { name: 'Terminal Input', type: 'text', placeholder: 'ENTER QUERY...', button: 'EXECUTE', radius: 0 }]
                ]}
            ]
        },
        {
            id: 'visual-novel',
            name: 'Visual Novel',
            genre: 'CHARACTER',
            theme: 'visualnovel',
            description: 'A character-first layout with a large portrait, profile facts, likes/dislikes, quotes and CG-style gallery.',
            tags: ['CHARACTER', 'ROMANCE', 'GALLERY'],
            frame: { enabled: true, padding: 16, borderWidth: 1 },
            sections: [
                { id: 'hero', label: 'Character Hero', description: 'Portrait and introductory title.', blocks: [
                    ['image', { name: 'Hero Portrait', alt: 'Character portrait', borderWidth: 0, radius: 10 }],
                    ['text', { name: 'Character Card', eyebrow: 'CHARACTER PROFILE', title: 'Character Name', body: 'A short hook or route description.', align: 'center' }]
                ]},
                { id: 'profile', label: 'Profile', description: 'Basic character data.', blocks: [
                    ['stats', { name: 'Profile Facts', columns: 2, entries: [
                        { label: 'AGE', value: '—' }, { label: 'BIRTHDAY', value: '—' }, { label: 'HEIGHT', value: '—' }, { label: 'OCCUPATION', value: '—' }
                    ]}]
                ]},
                { id: 'personality', label: 'Likes & Personality', description: 'Easy-to-edit personality cards.', blocks: [
                    ['card', { name: 'Likes', eyebrow: 'LIKES', title: 'Favorite Things', body: 'Music · food · places · hobbies · people' }],
                    ['card', { name: 'Dislikes', eyebrow: 'DISLIKES', title: 'Things To Avoid', body: 'Pet peeves · fears · rivals · bad habits' }]
                ]},
                { id: 'quote', label: 'Route Quote', description: 'Signature line or romance hook.', blocks: [
                    ['quote', { name: 'Route Quote', quote: 'A memorable line from this character.', attribution: 'CHARACTER NAME', align: 'center' }]
                ]},
                { id: 'cg', label: 'CG Gallery', description: 'Two-image gallery to replace with artwork.', blocks: [
                    ['divider', { name: 'Gallery Divider', label: 'MEMORIES // CG GALLERY', style: 'center' }],
                    ['gallery', { name: 'CG Gallery', columns: 2, images: [
                        { url: '', alt: 'Memory image one' }, { url: '', alt: 'Memory image two' }
                    ]}]
                ]}
            ]
        },
        {
            id: 'horror-case',
            name: 'Horror Case File',
            genre: 'HORROR',
            theme: 'horror',
            description: 'A clinical case file for horror, mystery, urban legend and dangerous-subject profiles.',
            tags: ['HORROR', 'CASE FILE', 'DARK'],
            frame: { enabled: true, padding: 15, borderWidth: 1 },
            sections: [
                { id: 'warning', label: 'Warning Header', description: 'Threat warning and case title.', blocks: [
                    ['badge', { name: 'Case Status', label: 'RESTRICTED', align: 'left', radius: 2 }],
                    ['text', { name: 'Case Header', eyebrow: 'CASE FILE // DO NOT DISTRIBUTE', title: 'SUBJECT UNKNOWN', body: 'Classification, location, and a one-line warning.', align: 'left' }]
                ]},
                { id: 'evidence', label: 'Primary Evidence', description: 'Image and core case facts.', blocks: [
                    ['image', { name: 'Evidence Image', alt: 'Evidence photograph', borderWidth: 1, radius: 2 }],
                    ['stats', { name: 'Case Facts', columns: 2, entries: [
                        { label: 'CASE', value: '#0000' }, { label: 'STATUS', value: 'OPEN' }, { label: 'LAST SEEN', value: '—' }, { label: 'RISK', value: 'SEVERE' }
                    ]}]
                ]},
                { id: 'report', label: 'Incident Report', description: 'Narrative report and witness quote.', blocks: [
                    ['divider', { name: 'Incident Divider', label: 'INCIDENT REPORT', style: 'database' }],
                    ['card', { name: 'Incident Summary', eyebrow: 'REPORT', title: 'Summary', body: 'Describe what happened, what was found, and what remains unexplained.' }],
                    ['quote', { name: 'Witness Statement', quote: 'I know what I saw. I just wish I did not.', attribution: 'WITNESS // REDACTED', align: 'left' }]
                ]},
                { id: 'files', label: 'Restricted Files', description: 'Expandable evidence and theories.', blocks: [
                    ['archive', { name: 'Restricted Files', columns: 1, entries: [
                        { title: 'KNOWN BEHAVIOR', content: 'Observed patterns.' }, { title: 'EVIDENCE', content: 'Recovered evidence.' }, { title: 'THEORIES', content: 'Unconfirmed theories.' }, { title: 'REDACTED', content: '[DATA EXPUNGED]' }
                    ]}]
                ]}
            ]
        },
        {
            id: 'soft-social',
            name: 'Soft Social',
            genre: 'SOCIAL',
            theme: 'social',
            description: 'A friendly rounded profile for modern characters, artists, slice-of-life RP and social-media-inspired pages.',
            tags: ['SOFT', 'SOCIAL', 'MODERN'],
            frame: { enabled: true, padding: 16, borderWidth: 0 },
            sections: [
                { id: 'intro', label: 'Social Intro', description: 'Friendly hero and short bio.', blocks: [
                    ['image', { name: 'Profile Photo', alt: 'Profile image', borderWidth: 0, radius: 18 }],
                    ['text', { name: 'Mini Bio', eyebrow: '@USERNAME', title: 'Character Name', body: 'Short bio · pronouns · location · vibe', align: 'center', padding: 16 }]
                ]},
                { id: 'status', label: 'Status & Facts', description: 'Status and quick information.', blocks: [
                    ['badge', { name: 'Current Status', label: 'ONLINE', align: 'center' }],
                    ['stats', { name: 'Quick Facts', columns: 2, entries: [
                        { label: 'AGE', value: '—' }, { label: 'SIGN', value: '—' }, { label: 'JOB', value: '—' }, { label: 'CITY', value: '—' }
                    ]}]
                ]},
                { id: 'favorites', label: 'Favorites', description: 'Likes and current mood.', blocks: [
                    ['card', { name: 'Favorites', eyebrow: 'CURRENTLY INTO', title: 'Favorites', body: 'Music · games · food · fashion · comfort things' }],
                    ['quote', { name: 'Status Quote', quote: 'Put a status, lyric-like original line, or character thought here.', attribution: 'STATUS', align: 'center' }]
                ]},
                { id: 'gallery', label: 'Photo Dump', description: 'Casual gallery and links.', blocks: [
                    ['gallery', { name: 'Photo Dump', columns: 2, images: [
                        { url: '', alt: 'Photo one' }, { url: '', alt: 'Photo two' }, { url: '', alt: 'Photo three' }, { url: '', alt: 'Photo four' }
                    ]}],
                    ['link', { name: 'External Link', label: 'MORE ABOUT ME', url: 'https://', align: 'center' }]
                ]}
            ]
        },
        {
            id: 'y2k-page',
            name: 'Y2K / Old Web',
            genre: 'RETRO WEB',
            theme: 'y2k',
            description: 'A playful personal-homepage layout with badges, chunky panels, links, a guestbook-like input and image grid.',
            tags: ['Y2K', 'RETRO', 'CHAOTIC'],
            frame: { enabled: true, padding: 12, borderWidth: 1 },
            sections: [
                { id: 'welcome', label: 'Welcome', description: 'Personal homepage header.', blocks: [
                    ['text', { name: 'Welcome Header', eyebrow: 'WELCOME TO MY PAGE', title: '★ CHARACTER.EXE ★', body: 'best viewed at 3AM // under construction forever', align: 'center' }],
                    ['badge', { name: 'Web Badge', label: 'ONLINE SINCE 2006', align: 'center', radius: 3 }]
                ]},
                { id: 'about', label: 'About Me', description: 'Chunky about and stats cards.', blocks: [
                    ['divider', { name: 'About Divider', label: '~* ABOUT ME *~', style: 'double' }],
                    ['stats', { name: 'About Stats', columns: 2, entries: [
                        { label: 'NAME', value: '—' }, { label: 'MOOD', value: '—' }, { label: 'OBSESSION', value: '—' }, { label: 'STATUS', value: '—' }
                    ]}],
                    ['card', { name: 'Blinkie Text', eyebrow: 'NOW LOADING', title: 'My Corner of the Web', body: 'Write an intentionally over-the-top personal blurb here.' }]
                ]},
                { id: 'links', label: 'Cool Links', description: 'Link-button section.', blocks: [
                    ['link', { name: 'Favorite Link', label: '★ COOL LINK ★', url: 'https://', align: 'center', radius: 4 }],
                    ['link', { name: 'Secret Link', label: 'ENTER SECRET PAGE', url: 'https://', align: 'center', radius: 4 }]
                ]},
                { id: 'gallery', label: 'Image Dump', description: 'Retro image grid.', blocks: [
                    ['gallery', { name: 'Image Dump', columns: 2, images: [
                        { url: '', alt: 'Image one' }, { url: '', alt: 'Image two' }, { url: '', alt: 'Image three' }, { url: '', alt: 'Image four' }
                    ]}]
                ]},
                { id: 'guestbook', label: 'Guestbook', description: 'A decorative typeable field.', blocks: [
                    ['input', { name: 'Guestbook Input', type: 'text', placeholder: 'SIGN MY GUESTBOOK...', button: 'POST', radius: 4 }]
                ]}
            ]
        },
        {
            id: 'minimal-editorial',
            name: 'Minimal Editorial',
            genre: 'EDITORIAL',
            theme: 'editorial',
            description: 'Typography-first, thin rules and restrained cards for profiles that should feel more like a magazine feature.',
            tags: ['MINIMAL', 'EDITORIAL', 'CLEAN'],
            frame: { enabled: false, padding: 0, borderWidth: 0 },
            sections: [
                { id: 'cover', label: 'Cover', description: 'Simple title and hero portrait.', blocks: [
                    ['divider', { name: 'Issue Header', label: 'PROFILE // FEATURE', style: 'database' }],
                    ['text', { name: 'Editorial Lead', eyebrow: 'AN INTERVIEW WITH', title: 'Character Name', body: 'A concise standfirst introducing the character.', align: 'left', padding: 12 }],
                    ['image', { name: 'Feature Portrait', alt: 'Feature portrait', borderWidth: 0, radius: 0 }]
                ]},
                { id: 'facts', label: 'Fast Facts', description: 'Quiet factual grid.', blocks: [
                    ['stats', { name: 'Fast Facts', columns: 2, entries: [
                        { label: 'AGE', value: '—' }, { label: 'ROLE', value: '—' }, { label: 'LOCATION', value: '—' }, { label: 'KNOWN FOR', value: '—' }
                    ]}]
                ]},
                { id: 'feature', label: 'Feature Story', description: 'Two editable text sections.', blocks: [
                    ['divider', { name: 'Feature Divider', label: 'THE STORY', style: 'center' }],
                    ['card', { name: 'Profile Story', eyebrow: '01', title: 'Background', body: 'Write the character’s background in a clean editorial block.', padding: 12 }],
                    ['card', { name: 'Character Study', eyebrow: '02', title: 'Character Study', body: 'Personality, contradictions, habits, and motivations.', padding: 12 }]
                ]},
                { id: 'pullquote', label: 'Pull Quote', description: 'Large finishing quote.', blocks: [
                    ['quote', { name: 'Pull Quote', quote: 'A concise line that deserves the whole page.', attribution: 'CHARACTER NAME', align: 'center', radius: 0 }]
                ]}
            ]
        },
        {
            id: 'character-wiki',
            name: 'Character Wiki',
            genre: 'REFERENCE',
            theme: 'minimal',
            description: 'A dense but readable reference layout for appearance, personality, history, abilities, trivia and relationships.',
            tags: ['WIKI', 'REFERENCE', 'DENSE'],
            frame: { enabled: true, padding: 14, borderWidth: 1 },
            sections: [
                { id: 'overview', label: 'Overview', description: 'Title, portrait and core information.', blocks: [
                    ['text', { name: 'Wiki Header', eyebrow: 'CHARACTER INDEX', title: 'Character Name', body: 'One-paragraph overview of the character.', align: 'left' }],
                    ['image', { name: 'Reference Portrait', alt: 'Character reference image', borderWidth: 1 }],
                    ['stats', { name: 'Infobox', columns: 2, entries: [
                        { label: 'FULL NAME', value: '—' }, { label: 'ALIASES', value: '—' }, { label: 'AGE', value: '—' }, { label: 'OCCUPATION', value: '—' }, { label: 'AFFILIATION', value: '—' }, { label: 'STATUS', value: '—' }
                    ]}]
                ]},
                { id: 'character', label: 'Character', description: 'Appearance and personality.', blocks: [
                    ['divider', { name: 'Character Divider', label: 'CHARACTER', style: 'database' }],
                    ['card', { name: 'Appearance', eyebrow: 'APPEARANCE', title: 'Appearance', body: 'Physical description, clothing, mannerisms, and notable features.' }],
                    ['card', { name: 'Personality', eyebrow: 'PERSONALITY', title: 'Personality', body: 'Temperament, values, habits, strengths, flaws, and motivations.' }]
                ]},
                { id: 'history', label: 'History', description: 'Expandable chronological/reference notes.', blocks: [
                    ['archive', { name: 'History Archive', columns: 1, entries: [
                        { title: 'EARLY LIFE', content: 'Write early history.' }, { title: 'MAJOR EVENTS', content: 'Write major events.' }, { title: 'PRESENT DAY', content: 'Write current status.' }
                    ]}]
                ]},
                { id: 'abilities', label: 'Abilities & Trivia', description: 'Skills, powers and extra details.', blocks: [
                    ['archive', { name: 'Abilities & Trivia', columns: 2, entries: [
                        { title: 'ABILITIES', content: 'Skills, powers, training, or talents.' }, { title: 'WEAKNESSES', content: 'Weaknesses and limitations.' }, { title: 'TRIVIA', content: 'Small facts and details.' }, { title: 'RELATIONSHIPS', content: 'Important people and dynamics.' }
                    ]}]
                ]},
                { id: 'gallery', label: 'Gallery', description: 'Reference images.', blocks: [
                    ['gallery', { name: 'Reference Gallery', columns: 2, images: [
                        { url: '', alt: 'Reference image one' }, { url: '', alt: 'Reference image two' }
                    ]}]
                ]}
            ]
        }
    ]);



    // Signature / Showcase Kits
    // These are intentionally more art-directed than the core templates. They
    // may mix native Studio blocks with original-panel effects, motion and
    // optional media. Every generated layer is still editable after insertion.
    const SIGNATURE_KIT_DEFINITIONS = Object.freeze([
        {
            id: 'sig-emergency-broadcast',
            name: 'Emergency Broadcast',
            genre: 'SIGNATURE // BROADCAST',
            tier: 'signature',
            theme: 'broadcast',
            description: 'A live city-alert profile with breaking-news hierarchy, threat telemetry, witness chatter and an optional character theme.',
            tags: ['SIGNATURE', 'MOTION', 'AUDIO', 'NEWS', 'DOSSIER'],
            features: ['MOTION', 'AUDIO', 'PANEL FX'],
            frame: { enabled: true, padding: 14, borderWidth: 1, radius: 2 },
            sections: [
                { id: 'alert', label: 'Breaking Alert', description: 'Ticker, live status and the main incident headline.', blocks: [
                    ['tool', { toolName: '🚨 Scrolling Ticker', name: 'Emergency Crawl', values: { style: 'alert', text: 'BREAKING // CITYWIDE SECURITY ALERT // DO NOT APPROACH', speed: 9 } }],
                    ['badge', { name: 'Live Indicator', label: 'LIVE // PRIORITY FEED', align: 'right', useTheme: false, accent: '#4dffac', text: '#dfffee', surface: '#07130f', radius: 999 }],
                    ['text', { name: 'Broadcast Headline', eyebrow: 'NATIONAL NETWORK // BREAKING NEWS', title: 'TARGET SPOTTED AGAIN', body: 'Authorities have issued a citywide alert. Replace this text with the current incident, rumor, mission, or public report.', align: 'left', padding: 16 }]
                ]},
                { id: 'visual', label: 'Main Broadcast Visual', description: 'Hero image, threat level and incident facts.', blocks: [
                    ['image', { name: 'Broadcast Hero', alt: 'Breaking news visual', borderWidth: 1, maxWidth: 420, radius: 2 }],
                    ['stats', { name: 'Threat Telemetry', columns: 2, entries: [
                        { label: 'THREAT LEVEL', value: '★★★★★' }, { label: 'STATUS', value: 'ACTIVE' }, { label: 'LAST SEEN', value: '—' }, { label: 'REWARD', value: '—' }
                    ]}]
                ]},
                { id: 'witness', label: 'Witness Feed', description: 'Rumors, public comments and evidence notes.', blocks: [
                    ['tool', { toolName: '💬 Chat Thread', name: 'Public Comment Feed', values: { style: 'theme', leftName: 'CITY FEED', rightName: 'ANONYMOUS', msg1: 'Did anyone else see that?', side1: 'left', msg2: 'The whole block lit up.', side2: 'left', msg3: 'Delete this before they trace it.', side3: 'right', msg4: '', side4: 'left', msg5: '', side5: 'right' } }],
                    ['tool', { toolName: '📌 Evidence Board', name: 'Incident Notes', values: { note1: 'Witness statement pending verification.', note2: 'Security footage recovered from sector 04.', note3: 'Unknown symbol found at the scene.', note4: '' } }]
                ]},
                { id: 'audio', label: 'Broadcast Theme', description: 'Optional soundtrack. Leave the SoundCloud URL blank for a decorative player.', blocks: [
                    ['music', { name: 'Broadcast Theme', title: 'EMERGENCY SIGNAL', artist: 'Character Theme', compact: true }]
                ]}
            ]
        },
        {
            id: 'sig-haunted-vhs',
            name: 'Haunted VHS',
            genre: 'SIGNATURE // HORROR',
            tier: 'signature',
            theme: 'vhs',
            description: 'A found-footage profile with tape labels, corrupted logs, redacted files, unsettling stills and optional ambient audio.',
            tags: ['SIGNATURE', 'HORROR', 'MOTION', 'AUDIO', 'FOUND FOOTAGE'],
            features: ['MOTION', 'AUDIO', 'LAB'],
            frame: { enabled: true, padding: 12, borderWidth: 1, radius: 1 },
            sections: [
                { id: 'tape', label: 'Tape Header', description: 'Boots the page like recovered footage.', blocks: [
                    ['tool', { toolName: '🚨 Scrolling Ticker', name: 'Tracking Noise', followThemeAccent: false, accent: '#e16f8c', values: { style: 'news', text: 'PLAY // TRACKING // RECOVERED TAPE 03 // DO NOT DUPLICATE', speed: 5 } }],
                    ['text', { name: 'Tape Label', useTheme: false, eyebrow: 'REC 00:13:47 // ARCHIVE COPY', title: 'SUBJECT UNKNOWN', body: 'Recovered from a damaged source. Some frames have been removed.', align: 'left', accent: '#e16f8c', text: '#f1e9ef', surface: '#09070b', border: '#4b2d38', radius: 1, padding: 14 }]
                ]},
                { id: 'footage', label: 'Recovered Footage', description: 'Portrait or still image with an observation log.', blocks: [
                    ['image', { name: 'Recovered Still', alt: 'Recovered footage still', borderWidth: 1, maxWidth: 420, radius: 0 }],
                    ['quote', { name: 'Observer Note', useTheme: false, quote: 'There is someone standing behind the camera.', attribution: 'TRANSCRIPT // 00:14:02', align: 'left', accent: '#e16f8c', text: '#f1e9ef', surface: '#0c090d', border: '#4b2d38', radius: 0 }]
                ]},
                { id: 'files', label: 'Corrupted Files', description: 'Classified notes and expandable recovered records.', blocks: [
                    ['tool', { toolName: '▣ Classified File', name: 'Recovered File', values: { classification: 'RECOVERED // DAMAGED', title: 'TAPE CONTENTS', content: 'Replace this with transcript fragments, warnings, redacted details, or notes about what was found.' } }],
                    ['archive', { name: 'Corrupted Chapters', columns: 1, entries: [
                        { title: '00:04:12 // FIRST APPEARANCE', content: 'Describe the first unusual event.' }, { title: '00:13:47 // SIGNAL LOSS', content: 'Describe what happened when the recording failed.' }, { title: '00:19:03 // FINAL FRAME', content: 'Describe the last recoverable image.' }
                    ]}]
                ]},
                { id: 'audio', label: 'Ambient Audio', description: 'Optional non-autoplay theme or ambience.', blocks: [
                    ['music', { name: 'Tape Audio', title: 'ROOM TONE // SIDE A', artist: 'Recovered Audio', compact: true }]
                ]}
            ]
        },
        {
            id: 'sig-rpg-save',
            name: 'RPG Save File',
            genre: 'SIGNATURE // RPG',
            tier: 'signature',
            theme: 'rpg',
            description: 'A game-menu profile with party roster, save-slot identity, stats, quest log, equipment records and optional area music.',
            tags: ['SIGNATURE', 'RPG', 'MULTI-CAST', 'AUDIO', 'GAME UI'],
            features: ['MULTI-CAST', 'AUDIO', 'GAME UI'],
            cast: { defaultCount: 3, max: 6, role: 'PARTY MEMBER' },
            frame: { enabled: true, padding: 14, borderWidth: 1, radius: 4 },
            sections: [
                { id: 'save', label: 'Save Slot', description: 'Main save information and player identity.', blocks: [
                    ['divider', { name: 'Save Header', label: 'SAVE DATA // SLOT 01', style: 'double' }],
                    ['text', { name: 'Save Identity', eyebrow: 'ACTIVE SAVE', title: 'PARTY NAME', body: 'Chapter / location / playtime / current objective', align: 'left' }],
                    ['stats', { name: 'Save Stats', columns: 2, entries: [
                        { label: 'LEVEL', value: '01' }, { label: 'PLAYTIME', value: '00:00' }, { label: 'LOCATION', value: '—' }, { label: 'DIFFICULTY', value: 'NORMAL' }
                    ]}]
                ]},
                { id: 'party', label: 'Party Roster', description: 'Choose the number of characters, names and portraits before or after insertion.', blocks: [
                    ['cast', { name: 'Active Party', useKitCast: true, columns: 2 }]
                ]},
                { id: 'quest', label: 'Quest Log', description: 'Main objective and optional side records.', blocks: [
                    ['divider', { name: 'Quest Divider', label: 'QUEST LOG', style: 'center' }],
                    ['card', { name: 'Main Quest', eyebrow: 'MAIN OBJECTIVE', title: 'The Current Quest', body: 'Describe the party’s current objective, stakes, and destination.' }],
                    ['archive', { name: 'Side Quests', columns: 1, entries: [
                        { title: 'SIDE QUEST 01', content: 'Optional objective.' }, { title: 'SIDE QUEST 02', content: 'Optional objective.' }, { title: 'COMPLETED', content: 'Previous milestones.' }
                    ]}]
                ]},
                { id: 'audio', label: 'Area Music', description: 'Optional soundtrack for the current zone or party.', blocks: [
                    ['music', { name: 'Area Theme', title: 'AREA THEME', artist: 'OST', compact: true }]
                ]}
            ]
        },
        {
            id: 'sig-cyber-os',
            name: 'Cyber OS',
            genre: 'SIGNATURE // SYSTEM',
            tier: 'signature',
            theme: 'cyberos',
            description: 'A fake operating-system profile with boot logs, identity modules, system loadout, command input and optional signal audio.',
            tags: ['SIGNATURE', 'CYBER', 'TERMINAL', 'MOTION', 'AUDIO'],
            features: ['MOTION', 'AUDIO', 'SYSTEM UI'],
            frame: { enabled: true, padding: 12, borderWidth: 1, radius: 0 },
            sections: [
                { id: 'boot', label: 'Boot Sequence', description: 'Status ticker and system boot log.', blocks: [
                    ['tool', { toolName: '🚨 Scrolling Ticker', name: 'System Bus', values: { style: 'matrix', text: 'OBELISK CORE ONLINE // IDENTITY MODULE MOUNTED // PROFILE CHANNEL OPEN', speed: 7 } }],
                    ['tool', { toolName: '>_ Terminal Log', name: 'Boot Log', values: { label: 'OBELISK.OS', message: 'Connection established. Loading identity package...\nProfile permissions verified.\nRender bridge online.', status: 'ONLINE' } }]
                ]},
                { id: 'identity', label: 'Identity Module', description: 'Profile card, telemetry and portrait.', blocks: [
                    ['text', { name: 'Identity Module', eyebrow: 'USER // ACTIVE SESSION', title: 'CHARACTER.NAME', body: 'Alias // occupation // affiliation // system designation', align: 'left' }],
                    ['image', { name: 'Identity Capture', alt: 'System identity portrait', borderWidth: 1, radius: 0 }],
                    ['stats', { name: 'Diagnostics', columns: 2, entries: [
                        { label: 'ACCESS', value: 'AUTHORIZED' }, { label: 'STATUS', value: 'ONLINE' }, { label: 'RISK', value: '—' }, { label: 'SYNC', value: '100%' }
                    ]}]
                ]},
                { id: 'modules', label: 'Modules', description: 'Loadout and command surface.', blocks: [
                    ['tool', { toolName: '⚙️ Mod Loadout', name: 'Installed Modules', values: { title: 'ACTIVE MODULES // LOADED', node1: 'Identity Core', node2: 'Relationship Index', node3: 'Restricted Memory Bank' } }],
                    ['input', { name: 'Command Line', type: 'text', placeholder: 'ENTER COMMAND...', button: 'EXECUTE', radius: 0 }]
                ]},
                { id: 'audio', label: 'Signal Audio', description: 'Optional system-theme music or ambience.', blocks: [
                    ['music', { name: 'Signal Audio', title: 'SYSTEM SIGNAL', artist: 'Channel 01', compact: true }]
                ]}
            ]
        },
        {
            id: 'sig-stage-profile',
            name: 'Stage / Artist Profile',
            genre: 'SIGNATURE // MUSIC',
            tier: 'signature',
            theme: 'stage',
            description: 'A glossy artist or idol profile with member roster, hero visuals, tracklist, spotlight quote and optional real music embed.',
            tags: ['SIGNATURE', 'MUSIC', 'MULTI-CAST', 'AUDIO', 'ARTIST'],
            features: ['MULTI-CAST', 'AUDIO', 'MEDIA'],
            cast: { defaultCount: 1, max: 8, role: 'MEMBER' },
            frame: { enabled: true, padding: 16, borderWidth: 1, radius: 12 },
            sections: [
                { id: 'cover', label: 'Cover Story', description: 'Artist title, image and signature line.', blocks: [
                    ['text', { name: 'Artist Header', eyebrow: 'OBELISK // FEATURE PRESENTATION', title: 'ARTIST NAME', body: 'Era / label / genre / release cycle', align: 'center', padding: 18 }],
                    ['image', { name: 'Cover Visual', alt: 'Artist cover image', borderWidth: 0, radius: 12 }],
                    ['quote', { name: 'Spotlight Quote', quote: 'A line from the artist, character, or current era.', attribution: 'ARTIST', align: 'center' }]
                ]},
                { id: 'members', label: 'Artist / Members', description: 'One solo portrait or an entire group roster.', blocks: [
                    ['cast', { name: 'Artist Lineup', useKitCast: true, columns: 2 }]
                ]},
                { id: 'music', label: 'Music', description: 'Tracklist plus optional playable SoundCloud embed.', blocks: [
                    ['tool', { toolName: '🎛️ Producer Tracklist', name: 'Current Release', values: { album: 'PROJECT TITLE', artist: 'ARTIST', track1: 'TRACK 01 — 2:14', track2: 'TRACK 02 — 3:05', track3: 'TRACK 03 — 1:58' } }],
                    ['music', { name: 'Featured Track', title: 'FEATURED TRACK', artist: 'ARTIST', compact: false }]
                ]},
                { id: 'gallery', label: 'Visual Era', description: 'Image grid for covers, stills or promotional shots.', blocks: [
                    ['gallery', { name: 'Era Gallery', columns: 2, images: [
                        { url: '', alt: 'Era image one' }, { url: '', alt: 'Era image two' }, { url: '', alt: 'Era image three' }, { url: '', alt: 'Era image four' }
                    ]}]
                ]}
            ]
        },
        {
            id: 'sig-occult-archive',
            name: 'Occult Archive',
            genre: 'SIGNATURE // OCCULT',
            tier: 'signature',
            theme: 'occult',
            description: 'A ritual dossier with entity classification, witness board, sealed chapters and optional ritual ambience.',
            tags: ['SIGNATURE', 'OCCULT', 'HORROR', 'LORE', 'AUDIO'],
            features: ['AUDIO', 'DOSSIER', 'PANEL FX'],
            frame: { enabled: true, padding: 16, borderWidth: 1, radius: 2 },
            sections: [
                { id: 'seal', label: 'Archive Seal', description: 'Classification and entity title.', blocks: [
                    ['divider', { name: 'Archive Seal', label: 'DEPARTMENT OF ANOMALOUS RECORDS', style: 'double' }],
                    ['text', { name: 'Entity Header', eyebrow: 'CASE // RESTRICTED', title: 'ENTITY NAME', body: 'Designation · manifestation · threat class', align: 'center' }],
                    ['badge', { name: 'Threat Seal', label: 'ACCESS // RESTRICTED', align: 'center', useTheme: false, accent: '#c93b4d', text: '#f7e5e1', surface: '#160b0d', radius: 2 }]
                ]},
                { id: 'evidence', label: 'Evidence', description: 'Portrait, evidence board and known properties.', blocks: [
                    ['image', { name: 'Evidence Image', alt: 'Entity evidence image', borderWidth: 1, radius: 1 }],
                    ['tool', { toolName: '📌 Evidence Board', name: 'Witness Board', followThemeAccent: false, accent: '#c93b4d', values: { note1: 'Do not look directly at the symbol.', note2: 'Witnesses report missing time.', note3: 'Audio continues after the tape ends.', note4: 'The fourth note was removed.' } }],
                    ['stats', { name: 'Entity Properties', columns: 2, entries: [
                        { label: 'CLASS', value: '—' }, { label: 'STATUS', value: 'UNCONTAINED' }, { label: 'ORIGIN', value: 'UNKNOWN' }, { label: 'RISK', value: 'SEVERE' }
                    ]}]
                ]},
                { id: 'sealed', label: 'Sealed Records', description: 'Expandable lore and classified archive.', blocks: [
                    ['tool', { toolName: '▣ Classified File', name: 'Restricted Record', values: { classification: 'SEALED // EYES ONLY', title: 'INCIDENT SUMMARY', content: 'Replace with the official account, redactions, ritual notes, or an unreliable transcript.' } }],
                    ['archive', { name: 'Sealed Chapters', columns: 1, entries: [
                        { title: 'MANIFESTATION', content: 'How the entity appears.' }, { title: 'KNOWN RULES', content: 'Observed rules and limitations.' }, { title: 'FAILED CONTAINMENT', content: 'What happened during the last attempt.' }
                    ]}]
                ]},
                { id: 'audio', label: 'Ritual Ambience', description: 'Optional music or ambient track.', blocks: [
                    ['music', { name: 'Ritual Ambience', title: 'ARCHIVE AMBIENCE', artist: 'Unknown Source', compact: true }]
                ]}
            ]
        },
        {
            id: 'sig-dreamcore-scrapbook',
            name: 'Dreamcore Scrapbook',
            genre: 'SIGNATURE // DREAMCORE',
            tier: 'signature',
            theme: 'dreamcore',
            description: 'A dreamy layered scrapbook with polaroids, soft notes, memory fragments, stickers, gallery pieces and optional music.',
            tags: ['SIGNATURE', 'DREAMCORE', 'SCRAPBOOK', 'AUDIO', 'MEMORIES'],
            features: ['AUDIO', 'MEDIA', 'MEMORY FX'],
            frame: { enabled: true, padding: 18, borderWidth: 1, radius: 16 },
            sections: [
                { id: 'cover', label: 'Dream Cover', description: 'Soft title, portrait and memory caption.', blocks: [
                    ['text', { name: 'Dream Header', eyebrow: 'MEMORY FILE // 00:00', title: 'CHARACTER NAME', body: 'Somewhere between a memory and a dream.', align: 'center', padding: 18 }],
                    ['tool', { toolName: '📷 Memory Polaroid', name: 'Main Memory', values: { caption: 'I remember this differently every time.' } }],
                    ['badge', { name: 'Memory Tag', label: 'DO NOT WAKE', align: 'center' }]
                ]},
                { id: 'fragments', label: 'Memory Fragments', description: 'Dream notes, quotes and image fragments.', blocks: [
                    ['quote', { name: 'Half-Remembered Line', quote: 'I know this happened. I just cannot prove when.', attribution: 'MEMORY 02', align: 'center' }],
                    ['gallery', { name: 'Fragment Gallery', columns: 2, images: [
                        { url: '', alt: 'Memory fragment one' }, { url: '', alt: 'Memory fragment two' }, { url: '', alt: 'Memory fragment three' }, { url: '', alt: 'Memory fragment four' }
                    ]}],
                    ['tool', { toolName: '💭 OOC Note', name: 'Margin Note', values: { title: 'scribbled in the margin', text: 'Replace this with a secret, creator note, or dream fragment.' } }]
                ]},
                { id: 'audio', label: 'Dream Audio', description: 'Optional music to anchor the atmosphere.', blocks: [
                    ['music', { name: 'Dream Track', title: 'MEMORY THEME', artist: 'Unknown', compact: true }]
                ]}
            ]
        },
        {
            id: 'sig-dark-fashion',
            name: 'Dark Fashion Editorial',
            genre: 'SIGNATURE // EDITORIAL',
            tier: 'signature',
            theme: 'fashion',
            description: 'A high-contrast fashion editorial with giant typography, issue-style metadata, credits, portraits and pull quotes.',
            tags: ['SIGNATURE', 'EDITORIAL', 'FASHION', 'PHOTO', 'MINIMAL'],
            features: ['MEDIA', 'TYPOGRAPHY', 'EDITORIAL'],
            frame: { enabled: true, padding: 14, borderWidth: 0, radius: 0 },
            sections: [
                { id: 'cover', label: 'Cover', description: 'Issue masthead and lead image.', blocks: [
                    ['divider', { name: 'Issue Line', label: 'OBELISK EDITORIAL // ISSUE 021', style: 'database' }],
                    ['text', { name: 'Cover Story', eyebrow: 'THE PROFILE ISSUE', title: 'CHARACTER NAME', body: 'A one-line cover story or era statement.', align: 'left', padding: 12 }],
                    ['image', { name: 'Lead Editorial', alt: 'Editorial portrait', borderWidth: 0, radius: 0 }]
                ]},
                { id: 'story', label: 'Feature Story', description: 'Pull quote, facts and editorial copy.', blocks: [
                    ['quote', { name: 'Pull Quote', quote: 'A sharp line that deserves its own page.', attribution: 'CHARACTER NAME', align: 'left', radius: 0 }],
                    ['stats', { name: 'Issue Credits', columns: 2, entries: [
                        { label: 'ROLE', value: '—' }, { label: 'ERA', value: '—' }, { label: 'LOCATION', value: '—' }, { label: 'STATUS', value: '—' }
                    ]}],
                    ['card', { name: 'Feature Copy', eyebrow: 'PROFILE', title: 'The Story', body: 'Write the editorial profile here.', radius: 0 }]
                ]},
                { id: 'credits', label: 'Credits', description: 'Gallery and closing credits.', blocks: [
                    ['gallery', { name: 'Editorial Contact Sheet', columns: 2, radius: 0, images: [
                        { url: '', alt: 'Editorial frame one' }, { url: '', alt: 'Editorial frame two' }, { url: '', alt: 'Editorial frame three' }, { url: '', alt: 'Editorial frame four' }
                    ]}],
                    ['divider', { name: 'Closing Rule', label: 'END OF FEATURE // CREDITS', style: 'double' }]
                ]}
            ]
        },
        {
            id: 'sig-spacecraft-ai',
            name: 'Spacecraft / AI Terminal',
            genre: 'SIGNATURE // SCI-FI',
            tier: 'signature',
            theme: 'spacecraft',
            description: 'A spacecraft intelligence dossier with crew roster, ship diagnostics, mission log, terminal feed and optional ambient signal.',
            tags: ['SIGNATURE', 'SCI-FI', 'AI', 'MULTI-CAST', 'AUDIO'],
            features: ['MULTI-CAST', 'AUDIO', 'TERMINAL', 'SYSTEM UI'],
            cast: { defaultCount: 3, max: 8, role: 'CREW' },
            frame: { enabled: true, padding: 16, borderWidth: 1, radius: 3 },
            sections: [
                { id: 'ship', label: 'Ship Core', description: 'Mission title, vessel identity and diagnostics.', blocks: [
                    ['text', { name: 'Vessel Header', eyebrow: 'DEEP SPACE NETWORK // LINK ESTABLISHED', title: 'VESSEL NAME', body: 'Mission designation · current sector · ship intelligence', align: 'left' }],
                    ['stats', { name: 'Ship Diagnostics', columns: 2, entries: [
                        { label: 'HULL', value: '92%' }, { label: 'OXYGEN', value: '78%' }, { label: 'POWER', value: '64%' }, { label: 'SIGNAL', value: 'DEGRADED' }
                    ]}],
                    ['tool', { toolName: '>_ Terminal Log', name: 'Ship Log', values: { label: 'VESSEL CORE', message: '[00:14:03] NAV CORE ONLINE\n[00:14:07] UNKNOWN SIGNAL DETECTED\n[00:14:12] CREW CHANNEL OPEN', status: 'WARNING' } }]
                ]},
                { id: 'crew', label: 'Crew Manifest', description: 'Editable multi-character crew roster.', blocks: [
                    ['cast', { name: 'Crew Manifest', useKitCast: true, columns: 2 }]
                ]},
                { id: 'mission', label: 'Mission Files', description: 'Expandable mission objectives and restricted records.', blocks: [
                    ['archive', { name: 'Mission Archive', columns: 1, entries: [
                        { title: 'PRIMARY OBJECTIVE', content: 'Describe the mission.' }, { title: 'LAST TRANSMISSION', content: 'Add a recovered transmission.' }, { title: 'RESTRICTED DIRECTIVE', content: 'Add sealed orders or AI instructions.' }
                    ]}],
                    ['input', { name: 'Ship Command', placeholder: 'QUERY SHIP INTELLIGENCE...', button: 'SEND', radius: 0 }]
                ]},
                { id: 'audio', label: 'Ambient Signal', description: 'Optional ship ambience or character theme.', blocks: [
                    ['music', { name: 'Ambient Signal', title: 'DEEP SPACE SIGNAL', artist: 'VESSEL CORE', compact: true }]
                ]}
            ]
        },
        {
            id: 'sig-crime-scene-board',
            name: 'Crime Scene Board',
            genre: 'SIGNATURE // INVESTIGATION',
            tier: 'signature',
            theme: 'crimeboard',
            description: 'An investigation-heavy profile with suspect records, evidence notes, case timeline, witness feed and expandable leads.',
            tags: ['SIGNATURE', 'CRIME', 'INVESTIGATION', 'EVIDENCE', 'LORE'],
            features: ['DOSSIER', 'PANEL FX', 'TIMELINE'],
            frame: { enabled: true, padding: 16, borderWidth: 1, radius: 2 },
            sections: [
                { id: 'case', label: 'Case Header', description: 'Case number, subject and status.', blocks: [
                    ['divider', { name: 'Case Header', label: 'ACTIVE INVESTIGATION // EVIDENCE CONTROL', style: 'slash' }],
                    ['text', { name: 'Case Subject', eyebrow: 'CASE 021-A', title: 'SUBJECT NAME', body: 'Primary suspect · witness · investigator · person of interest', align: 'left' }],
                    ['badge', { name: 'Case Status', label: 'CASE OPEN', align: 'left' }]
                ]},
                { id: 'evidence', label: 'Evidence Wall', description: 'Photos, board notes and recovered evidence.', blocks: [
                    ['image', { name: 'Primary Evidence', alt: 'Primary evidence image', borderWidth: 1, radius: 1 }],
                    ['tool', { toolName: '📌 Evidence Board', name: 'Evidence Board', values: { note1: 'Lead A', note2: 'Witness statement', note3: 'Missing connection', note4: 'Check timeline again' } }],
                    ['gallery', { name: 'Evidence Photos', columns: 2, images: [
                        { url: '', alt: 'Evidence one' }, { url: '', alt: 'Evidence two' }, { url: '', alt: 'Evidence three' }, { url: '', alt: 'Evidence four' }
                    ]}]
                ]},
                { id: 'timeline', label: 'Timeline / Leads', description: 'Timeline and expandable lead files.', blocks: [
                    ['tool', { toolName: '◷ Timeline Event', name: 'Critical Event', values: { date: '00:42', title: 'LAST CONFIRMED SIGHTING', description: 'Replace with the key event.' } }],
                    ['archive', { name: 'Open Leads', columns: 1, entries: [
                        { title: 'LEAD 01', content: 'Unresolved lead.' }, { title: 'WITNESS FILE', content: 'Witness notes.' }, { title: 'MOTIVE', content: 'Known or suspected motive.' }
                    ]}]
                ]},
                { id: 'feed', label: 'Witness Feed', description: 'Public chatter or investigator notes.', blocks: [
                    ['tool', { toolName: '💬 Chat Thread', name: 'Witness Feed', values: { style: 'theme', leftName: 'Witness_A', rightName: 'Investigator', msg1: 'I heard something around midnight.', side1: 'left', msg2: 'Stay available for follow-up.', side2: 'right', msg3: 'I will. Something still feels wrong.', side3: 'left' } }]
                ]}
            ]
        }

    ]);

    const KIT_DEFINITIONS = Object.freeze([
        ...CORE_KIT_DEFINITIONS,
        ...SIGNATURE_KIT_DEFINITIONS
    ]);

    const CUSTOM_KIT_FORMAT = 'obelisk-custom-kit';
    const CUSTOM_KIT_VERSION = 1;
    let customKits = [];
    let activeKitId = KIT_DEFINITIONS[0].id;
    let activeKitTier = 'core';
    let previewOverlayVisibility = null;
    const kitDrafts = new Map();

    // Clank's renderer sits above the Studio root so it can remain interactive.
    // Full-screen Studio overlays temporarily hide it to keep their controls on top.
    const syncPreviewOverlayVisibility = () => {
        if (!root || !previewWrapper) return;

        const shouldHide = Boolean(
            root.querySelector('[data-studio-kit-browser].is-open, [data-studio-ui-popover].is-open')
        );

        if (shouldHide) {
            if (!previewOverlayVisibility) {
                previewOverlayVisibility = {
                    value: previewWrapper.style.getPropertyValue('visibility'),
                    priority: previewWrapper.style.getPropertyPriority('visibility')
                };
            }
            previewWrapper.style.setProperty('visibility', 'hidden', 'important');
            return;
        }

        if (previewOverlayVisibility) {
            if (previewOverlayVisibility.value) {
                previewWrapper.style.setProperty(
                    'visibility',
                    previewOverlayVisibility.value,
                    previewOverlayVisibility.priority || ''
                );
            } else {
                previewWrapper.style.removeProperty('visibility');
            }
            previewOverlayVisibility = null;
            syncPreviewDock();
        }
    };

    const allKits = () => [...KIT_DEFINITIONS, ...customKits];
    const kitById = id => allKits().find(kit => kit.id === id) || KIT_DEFINITIONS[0];

    const normalizeCustomKit = value => {
        if (!value || typeof value !== 'object' || !Array.isArray(value.blocks)) return null;
        const blocks = value.blocks
            .filter(block => block && typeof block.type === 'string' && block.data && typeof block.data === 'object')
            .map(block => ({
                id: typeof block.id === 'string' ? block.id : makeId(),
                type: block.type,
                hidden: Boolean(block.hidden),
                groupId: typeof block.groupId === 'string' ? block.groupId : null,
                data: deepClone(block.data)
            }));
        if (!blocks.length) return null;
        return {
            format: CUSTOM_KIT_FORMAT,
            version: CUSTOM_KIT_VERSION,
            id: typeof value.id === 'string' && value.id ? value.id : `custom-${makeId()}`,
            tier: 'custom',
            name: String(value.name || 'Custom Kit').slice(0, 80),
            genre: 'MY KITS',
            description: String(value.description || 'Saved from Obelisk Studio.').slice(0, 300),
            tags: Array.isArray(value.tags) ? value.tags.map(tag => String(tag).slice(0, 24)).slice(0, 8) : ['CUSTOM', 'SHAREABLE'],
            createdAt: value.createdAt || new Date().toISOString(),
            updatedAt: value.updatedAt || new Date().toISOString(),
            theme: normalizeTheme(value.theme),
            canvas: { ...defaultCanvas(), ...(value.canvas && typeof value.canvas === 'object' ? value.canvas : {}) },
            groups: normalizeGroups(value.groups),
            blocks
        };
    };

    const loadCustomKits = () => {
        customKits = (storage.getCustomKits?.() || [])
            .map(normalizeCustomKit)
            .filter(Boolean);
    };

    const saveCustomKits = () => {
        storage.saveCustomKits?.(customKits);
    };

    const freshCustomKitInstance = kit => {
        const normalized = normalizeCustomKit(kit);
        if (!normalized) return null;
        const groupMap = new Map();
        const groups = normalized.groups.map(group => {
            const id = makeId();
            groupMap.set(group.id, id);
            return { ...group, id, collapsed: false };
        });
        const blocks = normalized.blocks.map(block => ({
            ...deepClone(block),
            id: makeId(),
            groupId: block.groupId && groupMap.has(block.groupId) ? groupMap.get(block.groupId) : null
        }));
        return { blocks, groups, theme: normalizeTheme(normalized.theme), canvas: { ...defaultCanvas(), ...normalized.canvas } };
    };

    const createCustomKitFromState = (name, description) => normalizeCustomKit({
        id: `custom-${makeId()}`,
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        theme: deepClone(state.theme),
        canvas: deepClone(state.canvas),
        groups: deepClone(state.groups || []),
        blocks: deepClone(state.blocks)
    });

    const customKitShareCode = kit =>
        `OBELISK-KIT-V1:${encodeMeta(normalizeCustomKit(kit))}`;

    const parseImportedKit = raw => {
        const source = String(raw || '').trim();
        if (!source) return null;
        try {
            const parsed = source.startsWith('OBELISK-KIT-V1:')
                ? decodeMeta(source.slice('OBELISK-KIT-V1:'.length))
                : JSON.parse(source);
            return normalizeCustomKit(parsed);
        } catch (error) {
            console.warn('[Obelisk Studio] Could not import custom kit.', error);
            return null;
        }
    };

    const uniqueCustomKitName = name => {
        const base = String(name || 'Custom Kit').trim() || 'Custom Kit';
        const names = new Set(customKits.map(kit => kit.name.toLowerCase()));
        if (!names.has(base.toLowerCase())) return base;
        let index = 2;
        while (names.has(`${base} ${index}`.toLowerCase())) index += 1;
        return `${base} ${index}`;
    };

    const storeImportedCustomKit = kit => {
        const normalized = normalizeCustomKit(kit);
        if (!normalized) return null;
        normalized.id = `custom-${makeId()}`;
        normalized.name = uniqueCustomKitName(normalized.name);
        normalized.createdAt = new Date().toISOString();
        normalized.updatedAt = normalized.createdAt;
        customKits.unshift(normalized);
        saveCustomKits();
        return normalized;
    };

    const downloadCustomKit = kit => {
        const normalized = normalizeCustomKit(kit);
        if (!normalized) return;
        const safeName = normalized.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'obelisk-kit';
        const blob = new Blob([JSON.stringify(normalized, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${safeName}.obelisk-kit.json`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const kitDraft = kit => {
        if (!kit?.cast) return null;
        if (!kitDrafts.has(kit.id)) {
            const count = clamp(kit.cast.defaultCount, 1, kit.cast.max || 8, 2);
            kitDrafts.set(kit.id, {
                cast: Array.from({ length: count }, (_, index) => ({
                    name: count === 1 ? 'CHARACTER NAME' : `CHARACTER ${index + 1}`,
                    role: kit.cast.role || 'MEMBER',
                    portrait: '',
                    note: ''
                }))
            });
        }
        return kitDrafts.get(kit.id);
    };

    const buildKitBlock = (descriptor, kitId, sectionId, draft = null) => {
        const [type, incoming = {}] = descriptor;
        const overrides = deepClone(incoming);
        let block = null;

        if (type === 'tool') {
            block = createToolBlock(overrides.toolName);
            if (!block) {
                block = createBlock('raw');
                block.data.raw = `<div style="padding:12px;border:1px dashed #6a3f49;color:#d98a9b;">Missing Obelisk tool: ${escapeHTML(overrides.toolName || 'Unknown')}</div>`;
            } else {
                const toolValues = overrides.values && typeof overrides.values === 'object' ? overrides.values : {};
                block.data = {
                    ...block.data,
                    ...overrides,
                    values: { ...block.data.values, ...toolValues }
                };
            }
        } else {
            block = createBlock(type);
            block.data = {
                ...block.data,
                ...overrides
            };

            if (type === 'cast' && overrides.useKitCast && draft?.cast?.length) {
                block.data.entries = deepClone(draft.cast);
                delete block.data.useKitCast;
            }
        }

        block.data = {
            ...block.data,
            kitOrigin: kitId,
            kitSection: sectionId
        };
        return block;
    };

    const buildKitBlocks = (kit, sectionIds = null) => {
        const selected = sectionIds instanceof Set ? sectionIds : new Set(kit.sections.map(section => section.id));
        const draft = kitDraft(kit);
        return kit.sections
            .filter(section => selected.has(section.id))
            .flatMap(section => section.blocks.map(descriptor => buildKitBlock(descriptor, kit.id, section.id, draft)));
    };

    const groupBuiltInKitBlocks = (kit, blocks) => {
        const groups = [];
        kit.sections.forEach(section => {
            const members = blocks.filter(block => block.data?.kitSection === section.id);
            if (!members.length) return;
            const group = { id: makeId(), name: section.label, collapsed: false };
            members.forEach(block => { block.groupId = group.id; });
            groups.push(group);
        });
        return groups;
    };

    const kitTheme = kit => kit?.tier === 'custom'
        ? normalizeTheme(kit.theme)
        : themeFromPreset(kit.theme || 'database');

    const kitCanvas = kit => {
        const theme = kitTheme(kit);
        return {
            ...defaultCanvas(),
            ...(kit.frame || {}),
            background: kit.frame?.background || theme.surface,
            border: kit.frame?.border || theme.border,
            radius: kit.frame?.radius ?? theme.radius
        };
    };

    // Compile blocks into Clank-compatible markup

    const compileText = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const text = cssColor(data.text, '#d7e6f5');
        const surface = cssColor(data.surface, '#07111b');
        const border = cssColor(data.border, '#1b4f72');
        const radius = clamp(data.radius, 0, 32, 4);
        const padding = clamp(data.padding, 4, 48, 16);
        const align = ['left', 'center', 'right'].includes(data.align)
            ? data.align
            : 'left';

        return sanitizeMarkdownHtml(`
<div style="box-sizing:border-box;width:100%;padding:${padding}px;background:${surface};border:1px solid ${border};border-radius:${radius}px;text-align:${align};color:${text};">
<div style="margin-bottom:7px;color:${accent};font-size:8px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;">${escapeHTML(data.eyebrow || '')}</div>
<div style="margin-bottom:10px;color:${text};font-size:20px;font-weight:800;line-height:1.15;">${escapeHTML(data.title || 'Untitled')}</div>
<div style="color:${text};font-size:12px;line-height:1.7;white-space:pre-line;">${escapeHTML(data.body || '')}</div>
</div>`);
    };

    const compileDivider = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const muted = cssColor(data.muted, '#17354c');
        const label = escapeHTML(data.label || 'SECTION');

        if (data.style === 'database') {
            return sanitizeMarkdownHtml(`
<div style="width:100%;margin:24px 0 14px 0;box-sizing:border-box;">
<div style="color:${accent};font-size:8px;font-weight:800;letter-spacing:3px;text-transform:uppercase;">${label}</div>
<div style="height:1px;margin-top:10px;background:${muted};"></div>
</div>`);
        }

        if (data.style === 'double') {
            return sanitizeMarkdownHtml(`
<div style="width:100%;margin:22px 0;box-sizing:border-box;">
<div style="height:1px;background:${muted};"></div>
<div style="padding:8px 0;color:${accent};font-size:8px;font-weight:800;letter-spacing:3px;text-align:center;text-transform:uppercase;">${label}</div>
<div style="height:1px;background:${muted};"></div>
</div>`);
        }

        if (data.style === 'slash') {
            return sanitizeMarkdownHtml(`
<div style="display:flex;align-items:center;gap:10px;width:100%;margin:22px 0;color:${accent};font-size:8px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;box-sizing:border-box;">
<span style="color:${muted};">//</span><span>${label}</span><span style="height:1px;flex:1;background:${muted};"></span>
</div>`);
        }

        return sanitizeMarkdownHtml(`
<div style="display:flex;align-items:center;gap:13px;width:100%;margin:22px 0;box-sizing:border-box;">
<span style="height:1px;flex:1;background:${muted};"></span>
<span style="color:${accent};font-size:8px;font-weight:800;letter-spacing:3px;text-transform:uppercase;white-space:nowrap;">${label}</span>
<span style="height:1px;flex:1;background:${muted};"></span>
</div>`);
    };

    const compileImage = data => {
        const url = String(data.url || '').trim();
        if (!url) {
            return sanitizeMarkdownHtml(`
<div style="display:flex;align-items:center;justify-content:center;width:100%;min-height:130px;border:1px dashed #39414b;color:#6f7781;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;box-sizing:border-box;">IMAGE URL NEEDED</div>`);
        }

        const accent = cssColor(data.accent, '#5da9ff');
        const radius = clamp(data.radius, 0, 32, 4);
        const borderWidth = clamp(data.borderWidth, 0, 4, 1);
        const maxWidth = clamp(data.maxWidth, 180, 1200, 420);

        return `<img src="${escapeHTML(url)}" alt="${escapeHTML(data.alt || '')}" style="display:block;width:100%;max-width:${maxWidth}px;height:auto;margin:0 auto;box-sizing:border-box;border:${borderWidth}px solid ${accent};border-radius:${radius}px;object-fit:cover;">`;
    };

    const compileArchive = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const surface = cssColor(data.surface, '#07111b');
        const text = cssColor(data.text, '#c8d5e2');
        const border = cssColor(data.border, '#1b4f72');
        const radius = clamp(data.radius, 0, 32, 2);
        const columns = clamp(data.columns, 1, 2, 1);
        const entries = Array.isArray(data.entries) && data.entries.length
            ? data.entries
            : [{ title: 'UNTITLED FILE', content: 'Hidden information...' }];

        const details = entries.map(entry => sanitizeMarkdownHtml(`
<details style="background:${surface};border:1px solid ${border};border-radius:${radius}px;overflow:hidden;">
<summary style="padding:11px 13px;color:${accent};cursor:pointer;font-size:9px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;background:${accent}0d;">${escapeHTML(entry.title || 'UNTITLED FILE')}</summary>
<div style="padding:12px 14px;color:${text};font-size:12px;line-height:1.65;white-space:pre-line;border-top:1px solid ${border};">${escapeHTML(entry.content || '')}</div>
</details>`)).join('\n');

        return sanitizeMarkdownHtml(`
<div style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:8px;width:100%;box-sizing:border-box;">
${details}
</div>`);
    };

    const compileInput = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const surface = cssColor(data.surface, '#07111b');
        const text = cssColor(data.text, '#d7e6f5');
        const radius = clamp(data.radius, 0, 24, 2);
        const type = ['text', 'search', 'password'].includes(data.type)
            ? data.type
            : 'text';

        return sanitizeMarkdownHtml(`
<div style="display:flex;gap:7px;width:100%;box-sizing:border-box;">
<input type="${type}" placeholder="${escapeHTML(data.placeholder || '')}" style="min-width:0;flex:1;padding:10px 12px;color:${text};background:${surface};border:1px solid ${accent}99;border-radius:${radius}px;outline:none;font:inherit;box-sizing:border-box;">
<button type="button" style="padding:0 14px;color:${accent};background:${accent}12;border:1px solid ${accent};border-radius:${radius}px;font-size:8px;font-weight:800;letter-spacing:1.3px;">${escapeHTML(data.button || 'POST')}</button>
</div>`);
    };

    const resolveBlockData = (block, theme) => {
        const data = deepClone(block?.data || {});
        if (data.useTheme === false || !themeableTypes.has(block?.type)) {
            return data;
        }
        ['accent', 'surface', 'text', 'border', 'muted', 'radius'].forEach(key => {
            if (key in theme) {
                data[key] = theme[key];
            }
        });
        return data;
    };

    const compileCard = data => sanitizeMarkdownHtml(`
<div style="width:100%;box-sizing:border-box;padding:${clamp(data.padding, 6, 48, 14)}px;background:${cssColor(data.surface, '#07111b')};border:1px solid ${cssColor(data.border, '#1b4f72')};border-radius:${clamp(data.radius, 0, 32, 3)}px;color:${cssColor(data.text, '#d7e6f5')};">
<div style="margin-bottom:6px;color:${cssColor(data.accent, '#5da9ff')};font-size:8px;font-weight:800;letter-spacing:2.2px;text-transform:uppercase;">${escapeHTML(data.eyebrow || '')}</div>
<div style="margin-bottom:8px;font-size:16px;font-weight:800;line-height:1.25;">${escapeHTML(data.title || 'Profile Card')}</div>
<div style="font-size:11px;line-height:1.65;white-space:pre-line;">${escapeHTML(data.body || '')}</div>
</div>`);

    const compileStats = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const text = cssColor(data.text, '#d7e6f5');
        const surface = cssColor(data.surface, '#07111b');
        const border = cssColor(data.border, '#1b4f72');
        const columns = clamp(data.columns, 1, 2, 2);
        const entries = Array.isArray(data.entries) && data.entries.length ? data.entries : [{ label: 'STAT', value: 'VALUE' }];
        const cells = entries.map(entry => `<div style="box-sizing:border-box;padding:10px 11px;background:${surface};border:1px solid ${border};"><div style="margin-bottom:4px;color:${accent};font-size:7px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;">${escapeHTML(entry.label || 'STAT')}</div><div style="color:${text};font-size:11px;line-height:1.35;">${escapeHTML(entry.value || '')}</div></div>`).join('\n');
        return sanitizeMarkdownHtml(`<div style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:6px;width:100%;box-sizing:border-box;">${cells}</div>`);
    };

    const compileQuote = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const text = cssColor(data.text, '#d7e6f5');
        const surface = cssColor(data.surface, '#07111b');
        const border = cssColor(data.border, '#1b4f72');
        const align = ['left', 'center', 'right'].includes(data.align) ? data.align : 'left';
        return sanitizeMarkdownHtml(`<div style="box-sizing:border-box;width:100%;padding:15px 16px;background:${surface};border-left:3px solid ${accent};border-top:1px solid ${border};border-right:1px solid ${border};border-bottom:1px solid ${border};border-radius:${clamp(data.radius,0,32,3)}px;text-align:${align};color:${text};"><div style="font-size:16px;line-height:1.55;font-style:italic;">“${escapeHTML(data.quote || '')}”</div><div style="margin-top:8px;color:${accent};font-size:8px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;">— ${escapeHTML(data.attribution || '')}</div></div>`);
    };

    const compileBadge = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const text = cssColor(data.text, '#d7e6f5');
        const surface = cssColor(data.surface, '#07111b');
        const align = ['left', 'center', 'right'].includes(data.align) ? data.align : 'left';
        const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
        return sanitizeMarkdownHtml(`<div style="display:flex;justify-content:${justify};width:100%;box-sizing:border-box;"><span style="display:inline-flex;align-items:center;gap:6px;padding:6px 9px;color:${text};background:${surface};border:1px solid ${accent};border-radius:${clamp(data.radius,0,999,999)}px;font-size:8px;font-weight:800;letter-spacing:1.3px;text-transform:uppercase;"><span style="width:5px;height:5px;border-radius:999px;background:${accent};"></span>${escapeHTML(data.label || 'BADGE')}</span></div>`);
    };

    const compileLink = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const text = cssColor(data.text, '#d7e6f5');
        const surface = cssColor(data.surface, '#07111b');
        const border = cssColor(data.border, '#1b4f72');
        const align = ['left', 'center', 'right'].includes(data.align) ? data.align : 'left';
        const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
        const url = String(data.url || '#').trim() || '#';
        return sanitizeMarkdownHtml(`<div style="display:flex;justify-content:${justify};width:100%;box-sizing:border-box;"><a href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:9px 12px;color:${text};background:${surface};border:1px solid ${border};border-radius:${clamp(data.radius,0,32,3)}px;text-decoration:none;font-size:8px;font-weight:800;letter-spacing:1.4px;text-transform:uppercase;">${escapeHTML(data.label || 'OPEN LINK')} <span style="color:${accent};">↗</span></a></div>`);
    };

    const compileGallery = data => {
        const border = cssColor(data.border, '#1b4f72');
        const radius = clamp(data.radius, 0, 32, 3);
        const columns = clamp(data.columns, 1, 3, 2);
        const images = Array.isArray(data.images) ? data.images : [];
        const cells = images.map((image, index) => {
            const url = String(image.url || '').trim();
            if (!url) {
                return `<div style="display:flex;align-items:center;justify-content:center;min-height:110px;border:1px dashed ${border};border-radius:${radius}px;color:#6f7781;font-size:8px;letter-spacing:1px;">IMAGE ${index + 1}</div>`;
            }
            return `<img src="${escapeHTML(url)}" alt="${escapeHTML(image.alt || '')}" style="display:block;width:100%;height:100%;min-height:110px;max-height:260px;object-fit:cover;box-sizing:border-box;border:1px solid ${border};border-radius:${radius}px;">`;
        }).join('\n');
        return sanitizeMarkdownHtml(`<div style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:7px;width:100%;box-sizing:border-box;">${cells}</div>`);
    };

    const compileCast = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const text = cssColor(data.text, '#d7e6f5');
        const surface = cssColor(data.surface, '#07111b');
        const border = cssColor(data.border, '#1b4f72');
        const radius = clamp(data.radius, 0, 32, 6);
        const columns = clamp(data.columns, 1, 3, 2);
        const entries = Array.isArray(data.entries) && data.entries.length
            ? data.entries.slice(0, 8)
            : [{ name: 'CHARACTER', role: 'MEMBER', portrait: '', note: '' }];

        const cards = entries.map((entry, index) => {
            const portrait = String(entry.portrait || '').trim();
            const media = portrait
                ? `<img src="${escapeHTML(portrait)}" alt="${escapeHTML(entry.name || `Character ${index + 1}`)}" style="display:block;width:100%;aspect-ratio:4/5;object-fit:cover;border-bottom:1px solid ${border};">`
                : `<div style="display:flex;align-items:center;justify-content:center;width:100%;aspect-ratio:4/5;background:${accent}08;border-bottom:1px dashed ${border};color:${accent};font-size:8px;letter-spacing:1.5px;">PORTRAIT ${String(index + 1).padStart(2, '0')}</div>`;
            return `<div style="overflow:hidden;background:${surface};border:1px solid ${border};border-radius:${radius}px;color:${text};box-sizing:border-box;">${media}<div style="padding:10px 11px;"><div style="color:${accent};font-size:7px;font-weight:800;letter-spacing:1.7px;text-transform:uppercase;">${escapeHTML(entry.role || 'MEMBER')}</div><div style="margin-top:4px;font-size:13px;font-weight:800;line-height:1.25;">${escapeHTML(entry.name || `CHARACTER ${index + 1}`)}</div>${entry.note ? `<div style="margin-top:7px;color:${text};opacity:.78;font-size:10px;line-height:1.5;white-space:pre-line;">${escapeHTML(entry.note)}</div>` : ''}</div></div>`;
        }).join('\n');

        return sanitizeMarkdownHtml(`<div style="display:grid;grid-template-columns:repeat(${columns},minmax(0,1fr));gap:8px;width:100%;box-sizing:border-box;">${cards}</div>`);
    };

    const compileMusic = data => {
        const accent = cssColor(data.accent, '#5da9ff');
        const text = cssColor(data.text, '#d7e6f5');
        const surface = cssColor(data.surface, '#07111b');
        const border = cssColor(data.border, '#1b4f72');
        const radius = clamp(data.radius, 0, 32, 10);
        const cover = String(data.cover || '').trim();
        const rawSoundCloud = String(data.soundcloud || '').trim();
        const title = escapeHTML(data.title || 'CHARACTER THEME');
        const artist = escapeHTML(data.artist || 'Artist');
        const art = cover
            ? `<img src="${escapeHTML(cover)}" alt="Cover art" style="width:58px;height:58px;flex:0 0 58px;object-fit:cover;border-radius:${Math.min(radius, 8)}px;border:1px solid ${border};">`
            : `<div style="display:flex;align-items:center;justify-content:center;width:58px;height:58px;flex:0 0 58px;border-radius:${Math.min(radius, 8)}px;border:1px solid ${border};background:${accent}12;color:${accent};font-size:20px;">♫</div>`;
        const player = `<div style="display:flex;gap:12px;align-items:center;padding:12px;background:${surface};border:1px solid ${border};border-radius:${radius}px;color:${text};box-sizing:border-box;">${art}<div style="min-width:0;flex:1;"><div style="color:${accent};font-size:7px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;">NOW PLAYING // OPTIONAL AUDIO</div><div style="margin-top:5px;font-size:13px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${title}</div><div style="margin-top:2px;font-size:9px;opacity:.68;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${artist}</div><div style="height:3px;margin-top:8px;background:${border};border-radius:99px;overflow:hidden;"><div style="width:38%;height:100%;background:${accent};"></div></div></div></div>`;

        if (!rawSoundCloud) {
            return sanitizeMarkdownHtml(player);
        }

        const encodedUrl = encodeURIComponent(rawSoundCloud);
        const largePlayer = data.compact === false || data.compact === 'false';
        const iframeHeight = largePlayer ? 300 : 166;
        return sanitizeMarkdownHtml(`${player}<div style="margin-top:8px;overflow:hidden;border:1px solid ${border};border-radius:${radius}px;"><iframe width="100%" height="${iframeHeight}" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=${encodedUrl}&color=%23${accent.replace('#', '')}&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=${largePlayer ? 'true' : 'false'}"></iframe></div>`);
    };

    const compileOriginalTool = (block, theme) => {
        const toolName = block?.data?.toolName;
        const tool = compactToolByName(toolName);
        if (!tool || typeof tool.onSubmit !== 'function' || typeof captureGeneratedMarkup !== 'function') {
            return sanitizeMarkdownHtml(`<div style="padding:12px;border:1px dashed #6a3f49;color:#d98a9b;font-size:10px;">TOOL UNAVAILABLE · ${escapeHTML(toolName || 'Unknown tool')}</div>`);
        }

        const values = normalizeToolValues(tool, block.data?.values);
        const accent = block.data?.followThemeAccent === false
            ? cssColor(block.data?.accent, theme?.accent || '#5da9ff')
            : cssColor(theme?.accent, '#5da9ff');

        try {
            let generated = captureGeneratedMarkup(() => {
                if (typeof tool.validate === 'function' && tool.validate(values) === false) {
                    return;
                }
                tool.onSubmit(values, accent);
            });

            if (toolName === '🖱️ Hover Reveal Card') {
                const stableClass = `obstudio-${String(block.id || 'hover').replace(/[^a-z0-9_-]/gi, '')}`;
                generated = generated.replace(/ob[a-z0-9]{7}/gi, stableClass);
            }

            if (!String(generated || '').trim()) {
                return sanitizeMarkdownHtml(`<div style="padding:12px;border:1px dashed #39414b;color:#7d8791;font-size:9px;letter-spacing:1px;">${escapeHTML(toolName)} · COMPLETE ITS FIELDS IN THE INSPECTOR</div>`);
            }

            return generated;
        } catch (error) {
            console.warn('[Obelisk Studio] Original tool compile failed:', toolName, error);
            return sanitizeMarkdownHtml(`<div style="padding:12px;border:1px dashed #6a3f49;color:#d98a9b;font-size:9px;line-height:1.5;">${escapeHTML(toolName || 'Tool')} could not render yet. Fill in its required fields.</div>`);
        }
    };

    const compileBlockBody = (block, theme = state?.theme || themeFromPreset('database')) => {
        const data = resolveBlockData(block, theme);
        let body = '';
        switch (block.type) {
            case 'text': body = compileText(data); break;
            case 'divider': body = compileDivider(data); break;
            case 'image': body = compileImage(data); break;
            case 'archive': body = compileArchive(data); break;
            case 'input': body = compileInput(data); break;
            case 'card': body = compileCard(data); break;
            case 'stats': body = compileStats(data); break;
            case 'quote': body = compileQuote(data); break;
            case 'badge': body = compileBadge(data); break;
            case 'link': body = compileLink(data); break;
            case 'gallery': body = compileGallery(data); break;
            case 'cast': body = compileCast(data); break;
            case 'music': body = compileMusic(data); break;
            case 'spacer': body = `<div aria-hidden="true" style="height:${clamp(data.height, 4, 180, 24)}px;"></div>`; break;
            case 'tool': body = compileOriginalTool(block, theme); break;
            case 'raw':
            default: body = String(data?.raw || ''); break;
        }
        return block.hidden ? `<div style="display:none !important;">${body}</div>` : body;
    };


    const parseDocumentMeta = text => {
        const source = String(text || '');
        const match = source.match(DOC_META_RE);
        if (!match) {
            return normalizeDocumentMeta(null);
        }
        return normalizeDocumentMeta(decodeMeta(match[1]));
    };

    const compileDocument = (blocks, documentMeta = null) => {
        const metaState = normalizeDocumentMeta(documentMeta || {
            theme: state?.theme,
            canvas: state?.canvas,
            groups: state?.groups
        });
        const parts = [START_MARKER];
        parts.push(`<!-- OBELISK-DOC:${encodeMeta(metaState)} -->`);

        const blockParts = [];
        blocks.forEach(block => {
            const meta = {
                id: block.id,
                type: block.type,
                groupId: block.groupId || null,
                hidden: Boolean(block.hidden),
                data: block.type === 'raw'
                    ? { name: block.data?.name || 'Imported Profile' }
                    : block.data
            };

            blockParts.push(`<!-- OBELISK-BLOCK:${encodeMeta(meta)} -->`);
            blockParts.push(compileBlockBody(block, metaState.theme));
            blockParts.push('<!-- /OBELISK-BLOCK -->');
        });

        if (metaState.canvas.enabled) {
            const canvas = metaState.canvas;
            const background = cssColor(canvas.background, metaState.theme.surface);
            const border = cssColor(canvas.border, metaState.theme.border);
            const borderWidth = clamp(canvas.borderWidth, 0, 4, 1);
            const radius = clamp(canvas.radius, 0, 32, metaState.theme.radius);
            const padding = clamp(canvas.padding, 0, 48, 14);
            parts.push(`<div style="box-sizing:border-box;width:100%;padding:${padding}px;background:${background};border:${borderWidth}px solid ${border};border-radius:${radius}px;color:${metaState.theme.text};">`);
            parts.push(...blockParts);
            parts.push('</div>');
        } else {
            parts.push(...blockParts);
        }

        parts.push(END_MARKER);
        return parts.join('\n');
    };

    const parseDocument = text => {
        const source = String(text || '');

        if (
            source.includes(START_MARKER) &&
            source.includes(END_MARKER)
        ) {
            const blocks = [];
            BLOCK_RE.lastIndex = 0;
            let match = null;

            while ((match = BLOCK_RE.exec(source))) {
                const meta = decodeMeta(match[1]);
                if (!meta?.id || !meta?.type) {
                    continue;
                }

                const block = {
                    id: meta.id,
                    type: meta.type,
                    groupId: typeof meta.groupId === 'string' ? meta.groupId : null,
                    hidden: Boolean(meta.hidden),
                    data: meta.data && typeof meta.data === 'object'
                        ? meta.data
                        : {}
                };

                if (block.type === 'raw') {
                    let rawBody = match[2];
                    const hiddenMatch = rawBody.match(/^<div style="display:none !important;">([\s\S]*)<\/div>$/);
                    if (block.hidden && hiddenMatch) {
                        rawBody = hiddenMatch[1];
                    }
                    block.data.raw = rawBody;
                }

                blocks.push(block);
            }

            if (blocks.length) {
                return blocks;
            }
        }

        if (source.trim()) {
            const raw = createBlock('raw');
            raw.data.raw = source;
            return [raw];
        }

        return [];
    };


    // Layer groups organize Studio without changing the generated profile markup.
    // Group membership is stored only in Obelisk metadata comments.
    const groupById = id =>
        state?.groups?.find(group => group.id === id) || null;

    const pruneEmptyGroups = () => {
        if (!state) return;
        state.groups = normalizeGroups(state.groups || []);
        const valid = new Set(state.groups.map(group => group.id));
        state.blocks.forEach(block => {
            if (block.groupId && !valid.has(block.groupId)) block.groupId = null;
        });
        const used = new Set(state.blocks.map(block => block.groupId).filter(Boolean));
        state.groups = state.groups.filter(group => used.has(group.id));
    };

    const groupMembers = groupId =>
        state?.blocks?.filter(block => block.groupId === groupId) || [];

    const makeGroupsContiguous = () => {
        if (!state?.blocks?.length) return;
        const seen = new Set();
        const result = [];
        for (const block of state.blocks) {
            if (!block.groupId) {
                result.push(block);
                continue;
            }
            if (seen.has(block.groupId)) continue;
            seen.add(block.groupId);
            result.push(...state.blocks.filter(item => item.groupId === block.groupId));
        }
        state.blocks = result;
    };

    const topLevelUnits = () => {
        const units = [];
        const seen = new Set();
        state.blocks.forEach(block => {
            if (!block.groupId) {
                units.push({ type: 'block', id: block.id, blocks: [block] });
                return;
            }
            if (seen.has(block.groupId)) return;
            seen.add(block.groupId);
            units.push({ type: 'group', id: block.groupId, blocks: groupMembers(block.groupId) });
        });
        return units;
    };

    const flattenUnits = units => {
        state.blocks = units.flatMap(unit => unit.blocks);
    };

    const moveGroup = (groupId, direction) => {
        const units = topLevelUnits();
        const index = units.findIndex(unit => unit.type === 'group' && unit.id === groupId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= units.length) return;
        pushUndo();
        const [unit] = units.splice(index, 1);
        units.splice(target, 0, unit);
        flattenUnits(units);
        state.selectedId = unit.blocks[0]?.id || state.selectedId;
        renderLayers();
        renderInspector();
        syncLiveDocument();
    };

    const createGroupFromSelected = () => {
        const block = state?.blocks?.find(item => item.id === state.selectedId);
        if (!block) {
            showToast('Select a layer before creating a group.', 'error');
            return;
        }
        const proposed = window.prompt('Name this layer group:', 'New Section');
        if (proposed === null) return;
        const name = proposed.trim() || 'New Section';
        pushUndo();
        const group = { id: makeId(), name, collapsed: false };
        state.groups.push(group);
        block.groupId = group.id;
        makeGroupsContiguous();
        renderAll();
        syncLiveDocument();
        showToast(`Created group “${name}”.`);
    };

    const assignBlockToGroup = (blockId, groupId) => {
        const block = state?.blocks?.find(item => item.id === blockId);
        if (!block) return;
        const next = groupId && groupById(groupId) ? groupId : null;
        if ((block.groupId || null) === next) return;
        pushUndo();
        block.groupId = next;
        makeGroupsContiguous();
        pruneEmptyGroups();
        renderAll();
        syncLiveDocument();
    };

    const renameGroup = groupId => {
        const group = groupById(groupId);
        if (!group) return;
        const value = window.prompt('Rename layer group:', group.name);
        if (value === null) return;
        const name = value.trim();
        if (!name || name === group.name) return;
        pushUndo();
        group.name = name.slice(0, 64);
        renderLayers();
        syncLiveDocument();
    };

    const dissolveGroup = groupId => {
        const group = groupById(groupId);
        if (!group) return;
        pushUndo();
        state.blocks.forEach(block => {
            if (block.groupId === groupId) block.groupId = null;
        });
        state.groups = state.groups.filter(item => item.id !== groupId);
        renderAll();
        syncLiveDocument();
    };

    const toggleGroupHidden = groupId => {
        const members = groupMembers(groupId);
        if (!members.length) return;
        pushUndo();
        const hide = members.some(block => !block.hidden);
        members.forEach(block => { block.hidden = hide; });
        renderLayers();
        syncLiveDocument();
    };

    const toggleGroupCollapsed = groupId => {
        const group = groupById(groupId);
        if (!group) return;
        group.collapsed = !group.collapsed;
        renderLayers();
    };


    // History

    const historySnapshot = () => ({
        blocks: deepClone(state.blocks),
        selectedId: state.selectedId,
        theme: deepClone(state.theme),
        canvas: deepClone(state.canvas),
        groups: deepClone(state.groups || [])
    });

    const restoreSnapshot = snapshot => {
        state.blocks = deepClone(snapshot.blocks || []);
        state.selectedId = snapshot.selectedId && state.blocks.some(block => block.id === snapshot.selectedId)
            ? snapshot.selectedId
            : state.blocks[0]?.id || null;
        state.theme = normalizeTheme(snapshot.theme || state.theme);
        state.canvas = { ...defaultCanvas(), ...(snapshot.canvas || state.canvas || {}) };
        state.groups = normalizeGroups(snapshot.groups || state.groups || []);
        pruneEmptyGroups();
        renderAll();
        syncLiveDocument();
    };

    const pushUndo = snapshot => {
        undoStack.push(snapshot || historySnapshot());
        if (undoStack.length > maxHistory) {
            undoStack.shift();
        }
        redoStack = [];
        updateHistoryButtons();
    };

    const undo = () => {
        if (!undoStack.length) {
            return;
        }
        redoStack.push(historySnapshot());
        const previous = undoStack.pop();
        restoreSnapshot(previous);
        updateHistoryButtons();
    };

    const redo = () => {
        if (!redoStack.length) {
            return;
        }
        undoStack.push(historySnapshot());
        const next = redoStack.pop();
        restoreSnapshot(next);
        updateHistoryButtons();
    };

    const updateHistoryButtons = () => {
        root?.querySelector('[data-studio-undo]')?.toggleAttribute('disabled', !undoStack.length);
        root?.querySelector('[data-studio-redo]')?.toggleAttribute('disabled', !redoStack.length);
    };


    // Clank preview docking

    const findPreviewFrame = () =>
        document.querySelector(
            '.editor-markdown-preview iframe[src*="frames.clank.world/render"], iframe[src*="frames.clank.world/render"]'
        );

    const findPreviewWrapper = frame => {
        const previewInner = frame?.closest?.('.editor-markdown-preview');
        if (previewInner?.parentElement?.parentElement) {
            return previewInner.parentElement.parentElement;
        }
        return frame?.parentElement || null;
    };

    const waitForPreview = async token => {
        for (let attempt = 0; attempt < 30; attempt += 1) {
            if (token !== openToken || !root) {
                return null;
            }
            const frame = findPreviewFrame();
            if (frame) {
                return frame;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return null;
    };

    const ensurePreview = async token => {
        let frame = findPreviewFrame();
        previewWasOpen = Boolean(frame);
        previewAutoOpened = false;

        if (!frame) {
            const toggle = document.querySelector('[data-name="toggle-preview"]');
            if (toggle) {
                previewAutoOpened = true;
                toggle.click();
                frame = await waitForPreview(token);
            }
        }

        if (!frame || token !== openToken || !root) {
            root?.classList.add('obelisk-studio-preview-unavailable');
            const message = root?.querySelector('[data-studio-preview-message]');
            if (message) {
                message.textContent = 'CLANK PREVIEW NOT FOUND';
            }
            return;
        }

        previewFrame = frame;
        previewWrapper = findPreviewWrapper(frame);

        if (!previewWrapper) {
            return;
        }

        previewOriginalStyle = previewWrapper.getAttribute('style') || '';
        previewWrapper.classList.add('obelisk-studio-preview-source');

        const sync = () => syncPreviewDock();

        previewResizeObserver = new ResizeObserver(sync);
        const host = root.querySelector('[data-studio-preview-host]');
        if (host) {
            previewResizeObserver.observe(host);
        }

        previewMutationObserver = new MutationObserver(() => {
            updatePreviewReadout();
            syncPreviewDock();
        });

        previewMutationObserver.observe(frame, {
            attributes: true,
            attributeFilter: ['style']
        });

        window.addEventListener('resize', syncPreviewDock);
        root.querySelector('[data-studio-center-scroll]')?.addEventListener('scroll', syncPreviewDock);

        previewSyncTimer = window.setInterval(syncPreviewDock, 250);

        root.classList.add('obelisk-studio-preview-ready');
        if (root.querySelector('[data-studio-kit-browser]')?.classList.contains('is-open')) {
            previewWrapper.style.setProperty('visibility', 'hidden', 'important');
        }
        syncPreviewDock();
        updatePreviewReadout();
    };

    const syncPreviewDock = () => {
        if (!root || !previewWrapper) {
            return;
        }

        const host = root.querySelector('[data-studio-preview-host]');
        if (!host) {
            return;
        }

        const rect = host.getBoundingClientRect();
        if (rect.width < 50 || rect.height < 50) {
            return;
        }

        previewWrapper.style.setProperty('position', 'fixed', 'important');
        previewWrapper.style.setProperty('left', `${Math.round(rect.left)}px`, 'important');
        previewWrapper.style.setProperty('top', `${Math.round(rect.top)}px`, 'important');
        previewWrapper.style.setProperty('width', `${Math.round(rect.width)}px`, 'important');
        previewWrapper.style.setProperty('height', `${Math.round(rect.height)}px`, 'important');
        previewWrapper.style.setProperty('max-width', 'none', 'important');
        previewWrapper.style.setProperty('margin', '0', 'important');
        previewWrapper.style.setProperty('padding', '0', 'important');
        previewWrapper.style.setProperty('border', '0', 'important');
        previewWrapper.style.setProperty('border-radius', '0', 'important');
        previewWrapper.style.setProperty('background', '#07090c', 'important');
        previewWrapper.style.setProperty('overflow', 'auto', 'important');
        previewWrapper.style.setProperty('box-sizing', 'border-box', 'important');
        previewWrapper.style.setProperty('z-index', '2147483646', 'important');
    };

    const updatePreviewReadout = () => {
        if (!root || !previewFrame) {
            return;
        }

        const height = parseInt(previewFrame.style.height || '0', 10) || previewFrame.getBoundingClientRect().height || 0;
        const readout = root.querySelector('[data-studio-preview-height]');
        if (readout) {
            readout.textContent = `${Math.round(height)} PX`;
        }
    };

    const restorePreview = () => {
        if (previewSyncTimer) {
            clearInterval(previewSyncTimer);
            previewSyncTimer = null;
        }

        previewResizeObserver?.disconnect();
        previewResizeObserver = null;

        previewMutationObserver?.disconnect();
        previewMutationObserver = null;

        window.removeEventListener('resize', syncPreviewDock);

        if (previewWrapper) {
            previewWrapper.classList.remove('obelisk-studio-preview-source');

            if (previewOriginalStyle) {
                previewWrapper.setAttribute('style', previewOriginalStyle);
            } else {
                previewWrapper.removeAttribute('style');
            }
        }

        previewOverlayVisibility = null;
        previewWrapper = null;
        previewFrame = null;
        previewOriginalStyle = '';

        if (previewAutoOpened && !previewWasOpen) {
            document.querySelector('[data-name="toggle-preview"]')?.click();
        }

        previewAutoOpened = false;
        previewWasOpen = false;
    };


    // Live document synchronization

    const syncLiveDocument = () => {
        if (!root || !state) {
            return;
        }

        const compiled = compileDocument(state.blocks);
        liveAbout = compiled;
        dirty = compiled !== committedAbout;

        setAboutEditorValue(compiled, { sanitize: false });
        updateDirtyState();
        window.setTimeout(updatePreviewReadout, 120);
    };

    const updateDirtyState = () => {
        root?.classList.toggle('obelisk-studio-dirty', dirty);

        const stateNode = root?.querySelector('[data-studio-save-state]');
        if (stateNode) {
            stateNode.textContent = dirty
                ? 'UNAPPLIED CHANGES'
                : 'SYNCED';
        }
    };

    const applyToClank = () => {
        if (!state) {
            return;
        }

        const compiled = compileDocument(state.blocks);
        setAboutEditorValue(compiled, { sanitize: false });
        committedAbout = compiled;
        liveAbout = compiled;
        dirty = false;
        updateDirtyState();
        showToast('Studio layout applied to Edit about.');

        const button = root?.querySelector('[data-studio-apply]');
        button?.classList.add('obelisk-studio-apply-flash');
        setTimeout(() => button?.classList.remove('obelisk-studio-apply-flash'), 650);
    };


    // Layer operations

    const selectBlock = id => {
        state.selectedId = id;
        renderLayers();
        renderInspector();
    };

    const addBlock = type => {
        pushUndo();
        const block = createBlock(type);

        const currentIndex = state.blocks.findIndex(item => item.id === state.selectedId);
        const insertIndex = currentIndex >= 0
            ? currentIndex + 1
            : state.blocks.length;

        const selected = state.blocks.find(item => item.id === state.selectedId);
        if (selected?.groupId) block.groupId = selected.groupId;
        state.blocks.splice(insertIndex, 0, block);
        makeGroupsContiguous();
        state.selectedId = block.id;
        renderAll();
        syncLiveDocument();
    };

    const addOriginalTool = toolName => {
        const block = createToolBlock(toolName);
        if (!block) {
            showToast('That Obelisk tool is not available in Studio yet.', 'error');
            return;
        }

        pushUndo();
        const currentIndex = state.blocks.findIndex(item => item.id === state.selectedId);
        const insertIndex = currentIndex >= 0
            ? currentIndex + 1
            : state.blocks.length;

        const selected = state.blocks.find(item => item.id === state.selectedId);
        if (selected?.groupId) block.groupId = selected.groupId;
        state.blocks.splice(insertIndex, 0, block);
        makeGroupsContiguous();
        state.selectedId = block.id;
        renderAll();
        syncLiveDocument();
    };

    const deleteSelected = () => {
        const index = state.blocks.findIndex(block => block.id === state.selectedId);
        if (index < 0) {
            return;
        }

        pushUndo();
        state.blocks.splice(index, 1);
        pruneEmptyGroups();
        state.selectedId = state.blocks[index]?.id || state.blocks[index - 1]?.id || null;
        renderAll();
        syncLiveDocument();
    };

    const duplicateSelected = () => {
        const index = state.blocks.findIndex(block => block.id === state.selectedId);
        if (index < 0) {
            return;
        }

        pushUndo();
        const copy = deepClone(state.blocks[index]);
        copy.id = makeId();
        copy.data.name = `${blockLabel(copy)} Copy`;
        state.blocks.splice(index + 1, 0, copy);
        makeGroupsContiguous();
        state.selectedId = copy.id;
        renderAll();
        syncLiveDocument();
    };

    const moveSelected = direction => {
        const index = state.blocks.findIndex(block => block.id === state.selectedId);
        if (index < 0) return;
        const selected = state.blocks[index];

        if (selected.groupId) {
            const members = groupMembers(selected.groupId);
            const memberIndex = members.findIndex(block => block.id === selected.id);
            const targetMember = memberIndex + direction;
            if (targetMember >= 0 && targetMember < members.length) {
                pushUndo();
                const targetId = members[targetMember].id;
                const targetIndex = state.blocks.findIndex(block => block.id === targetId);
                [state.blocks[index], state.blocks[targetIndex]] = [state.blocks[targetIndex], state.blocks[index]];
                renderLayers();
                syncLiveDocument();
                return;
            }
            moveGroup(selected.groupId, direction);
            return;
        }

        const target = index + direction;
        if (target < 0 || target >= state.blocks.length) return;
        pushUndo();
        const [block] = state.blocks.splice(index, 1);
        state.blocks.splice(target, 0, block);
        renderLayers();
        syncLiveDocument();
    };

    const reorderByIds = ids => {
        const map = new Map(state.blocks.map(block => [block.id, block]));
        const ordered = ids.map(id => map.get(id)).filter(Boolean);
        if (ordered.length !== state.blocks.length) {
            return;
        }
        state.blocks = ordered;
    };


    // Rendering: Theme console

    const renderThemeConsole = () => {
        if (!root || !state) return;

        const select = root.querySelector('[data-studio-theme-preset]');
        if (select) select.value = state.theme.id || 'database';

        root.querySelectorAll('[data-theme-key]').forEach(control => {
            const key = control.dataset.themeKey;
            if (key in state.theme) control.value = state.theme[key];
        });

        const radius = root.querySelector('[data-theme-radius]');
        if (radius) radius.value = state.theme.radius;
        const radiusOut = root.querySelector('[data-theme-radius-output]');
        if (radiusOut) radiusOut.textContent = `${state.theme.radius}px`;

        const canvasButton = root.querySelector('[data-studio-canvas-toggle]');
        if (canvasButton) {
            canvasButton.classList.toggle('is-on', Boolean(state.canvas.enabled));
            canvasButton.textContent = state.canvas.enabled ? 'PROFILE FRAME ON' : 'PROFILE FRAME OFF';
        }

        const name = root.querySelector('[data-studio-theme-name]');
        if (name) name.textContent = state.theme.name || 'Custom Theme';
    };

    const applyThemePreset = id => {
        if (!state) return;
        pushUndo();
        state.theme = themeFromPreset(id);
        if (state.canvas.enabled) {
            state.canvas.background = state.theme.surface;
            state.canvas.border = state.theme.border;
            state.canvas.radius = state.theme.radius;
        }
        renderAll();
        syncLiveDocument();
    };

    // Rendering: Layers

    const renderLayers = () => {
        if (!root) return;

        const list = root.querySelector('[data-studio-layers]');
        const count = root.querySelector('[data-studio-layer-count]');
        if (!list) return;

        pruneEmptyGroups();
        makeGroupsContiguous();

        if (count) {
            const groups = state.groups.length;
            count.textContent = groups
                ? `${String(state.blocks.length).padStart(2, '0')} · ${groups}G`
                : String(state.blocks.length).padStart(2, '0');
        }

        if (!state.blocks.length) {
            list.innerHTML = `
                <div class="obelisk-studio-empty-layers">
                    <span>◇</span>
                    <strong>EMPTY PROFILE</strong>
                    <small>Add a component below.</small>
                </div>`;
            return;
        }

        const layerHtml = (block, index) => `
            <button
                type="button"
                class="obelisk-studio-layer ${block.id === state.selectedId ? 'is-selected' : ''} ${block.hidden ? 'is-hidden' : ''} ${block.groupId ? 'is-grouped' : ''}"
                data-layer-id="${escapeHTML(block.id)}"
                draggable="true"
            >
                <span class="obelisk-studio-layer-grip" title="Drag to reorder">⋮⋮</span>
                <span class="obelisk-studio-layer-index">${String(index + 1).padStart(2, '0')}</span>
                <span class="obelisk-studio-layer-icon">${escapeHTML(blockIcon(block.type, block))}</span>
                <span class="obelisk-studio-layer-copy">
                    <strong>${escapeHTML(blockLabel(block))}</strong>
                    <small>${escapeHTML(block.type === 'tool' ? `${block.data?.category || compactToolMeta(block.data?.toolName).category || 'TOOL'} · PANEL TOOL` : block.type.toUpperCase())}${block.data?.useTheme === false ? ' · CUSTOM' : themeableTypes.has(block.type) ? ' · THEMED' : ''}</small>
                </span>
                <span class="obelisk-studio-layer-visibility" data-layer-visibility="${escapeHTML(block.id)}" title="${block.hidden ? 'Show layer' : 'Hide layer'}">${block.hidden ? '○' : '●'}</span>
                <span class="obelisk-studio-layer-led"></span>
            </button>`;

        let html = '';
        const renderedGroups = new Set();
        state.blocks.forEach((block, index) => {
            if (!block.groupId) {
                html += layerHtml(block, index);
                return;
            }
            if (renderedGroups.has(block.groupId)) return;
            renderedGroups.add(block.groupId);
            const group = groupById(block.groupId);
            if (!group) {
                html += layerHtml(block, index);
                return;
            }
            const members = groupMembers(group.id);
            const allHidden = members.every(member => member.hidden);
            html += `
                <section class="obelisk-studio-layer-group ${group.collapsed ? 'is-collapsed' : ''}" data-layer-group="${escapeHTML(group.id)}">
                    <div class="obelisk-studio-layer-group-head" data-group-drag="${escapeHTML(group.id)}" draggable="true">
                        <button type="button" data-group-collapse="${escapeHTML(group.id)}" title="${group.collapsed ? 'Expand group' : 'Collapse group'}">${group.collapsed ? '▸' : '▾'}</button>
                        <span class="obelisk-studio-layer-group-grip" title="Drag whole group">⋮⋮</span>
                        <div><small>GROUP · ${members.length} LAYER${members.length === 1 ? '' : 'S'}</small><strong>${escapeHTML(group.name)}</strong></div>
                        <button type="button" data-group-hide="${escapeHTML(group.id)}" title="${allHidden ? 'Show group' : 'Hide group'}">${allHidden ? '○' : '●'}</button>
                        <button type="button" data-group-up="${escapeHTML(group.id)}" title="Move group up">↑</button>
                        <button type="button" data-group-down="${escapeHTML(group.id)}" title="Move group down">↓</button>
                        <button type="button" data-group-rename="${escapeHTML(group.id)}" title="Rename group">✎</button>
                        <button type="button" data-group-dissolve="${escapeHTML(group.id)}" title="Ungroup layers">×</button>
                    </div>
                    <div class="obelisk-studio-layer-group-body">
                        ${members.map(member => layerHtml(member, state.blocks.indexOf(member))).join('')}
                    </div>
                </section>`;
        });
        list.innerHTML = html;

        const dropBlockOn = (draggedId, targetId, after) => {
            const dragged = state.blocks.find(block => block.id === draggedId);
            const target = state.blocks.find(block => block.id === targetId);
            if (!dragged || !target || dragged === target) return;
            pushUndo();
            const from = state.blocks.indexOf(dragged);
            state.blocks.splice(from, 1);
            let to = state.blocks.indexOf(target) + (after ? 1 : 0);
            dragged.groupId = target.groupId || null;
            state.blocks.splice(to, 0, dragged);
            makeGroupsContiguous();
            pruneEmptyGroups();
            state.selectedId = dragged.id;
            renderAll();
            syncLiveDocument();
        };

        const moveGroupToTarget = (groupId, targetBlockId, after) => {
            const members = groupMembers(groupId);
            const target = state.blocks.find(block => block.id === targetBlockId);
            if (!members.length || !target || target.groupId === groupId) return;
            pushUndo();
            const remaining = state.blocks.filter(block => block.groupId !== groupId);
            let targetIndex = remaining.findIndex(block => block.id === target.id);
            if (targetIndex < 0) return;
            if (target.groupId) {
                const targetMembers = remaining.filter(block => block.groupId === target.groupId);
                const anchor = after ? targetMembers[targetMembers.length - 1] : targetMembers[0];
                targetIndex = remaining.findIndex(block => block.id === anchor.id) + (after ? 1 : 0);
            } else if (after) {
                targetIndex += 1;
            }
            remaining.splice(targetIndex, 0, ...members);
            state.blocks = remaining;
            state.selectedId = members[0]?.id || state.selectedId;
            renderAll();
            syncLiveDocument();
        };

        list.querySelectorAll('[data-layer-id]').forEach(button => {
            const id = button.dataset.layerId;

            button.addEventListener('click', event => {
                if (event.target.closest('[data-layer-visibility]')) return;
                selectBlock(id);
            });

            button.querySelector('[data-layer-visibility]')?.addEventListener('click', event => {
                event.preventDefault();
                event.stopPropagation();
                const block = state.blocks.find(item => item.id === id);
                if (!block) return;
                pushUndo();
                block.hidden = !block.hidden;
                renderLayers();
                syncLiveDocument();
            });

            button.addEventListener('dragstart', event => {
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', `block:${id}`);
                button.classList.add('is-dragging');
            });
            button.addEventListener('dragend', () => {
                button.classList.remove('is-dragging');
                list.querySelectorAll('.is-drop-target').forEach(node => node.classList.remove('is-drop-target'));
            });
            button.addEventListener('dragover', event => {
                event.preventDefault();
                button.classList.add('is-drop-target');
            });
            button.addEventListener('dragleave', () => button.classList.remove('is-drop-target'));
            button.addEventListener('drop', event => {
                event.preventDefault();
                button.classList.remove('is-drop-target');
                const payload = event.dataTransfer.getData('text/plain');
                const after = event.clientY > button.getBoundingClientRect().top + button.getBoundingClientRect().height / 2;
                if (payload.startsWith('group:')) moveGroupToTarget(payload.slice(6), id, after);
                if (payload.startsWith('block:')) dropBlockOn(payload.slice(6), id, after);
            });
        });

        list.querySelectorAll('[data-layer-group]').forEach(section => {
            const groupId = section.dataset.layerGroup;
            section.querySelector('[data-group-collapse]')?.addEventListener('click', () => toggleGroupCollapsed(groupId));
            section.querySelector('[data-group-hide]')?.addEventListener('click', () => toggleGroupHidden(groupId));
            section.querySelector('[data-group-up]')?.addEventListener('click', () => moveGroup(groupId, -1));
            section.querySelector('[data-group-down]')?.addEventListener('click', () => moveGroup(groupId, 1));
            section.querySelector('[data-group-rename]')?.addEventListener('click', () => renameGroup(groupId));
            section.querySelector('[data-group-dissolve]')?.addEventListener('click', () => dissolveGroup(groupId));

            const head = section.querySelector('[data-group-drag]');
            head?.addEventListener('dragstart', event => {
                if (event.target.closest('button')) {
                    event.preventDefault();
                    return;
                }
                event.dataTransfer.effectAllowed = 'move';
                event.dataTransfer.setData('text/plain', `group:${groupId}`);
                section.classList.add('is-dragging');
            });
            head?.addEventListener('dragend', () => section.classList.remove('is-dragging'));
            head?.addEventListener('dragover', event => event.preventDefault());
            head?.addEventListener('drop', event => {
                event.preventDefault();
                const payload = event.dataTransfer.getData('text/plain');
                if (!payload.startsWith('block:')) return;
                const blockId = payload.slice(6);
                const block = state.blocks.find(item => item.id === blockId);
                if (!block || block.groupId === groupId) return;
                pushUndo();
                const from = state.blocks.indexOf(block);
                state.blocks.splice(from, 1);
                const members = groupMembers(groupId);
                const lastMember = members[members.length - 1];
                let insertAt = lastMember ? state.blocks.indexOf(lastMember) + 1 : state.blocks.length;
                block.groupId = groupId;
                state.blocks.splice(insertAt, 0, block);
                makeGroupsContiguous();
                pruneEmptyGroups();
                state.selectedId = block.id;
                renderAll();
                syncLiveDocument();
            });
        });
    };


    // Rendering: Inspector

    const inspectorHeader = block => `
        <div class="obelisk-studio-inspector-title">
            <span>${escapeHTML(blockIcon(block.type, block))}</span>
            <div>
                <small>SELECTED COMPONENT</small>
                <strong>${escapeHTML(blockLabel(block))}</strong>
            </div>
        </div>
    `;

    const field = (label, key, value, type = 'text', extra = '') => `
        <label class="obelisk-studio-field">
            <span>${escapeHTML(label)}</span>
            <input type="${type}" data-inspector-key="${escapeHTML(key)}" value="${escapeHTML(value ?? '')}" ${extra}>
        </label>
    `;

    const colorField = (label, key, value) => `
        <label class="obelisk-studio-field obelisk-studio-color-field">
            <span>${escapeHTML(label)}</span>
            <div>
                <input type="color" data-inspector-key="${escapeHTML(key)}" value="${escapeHTML(value || '#5da9ff')}">
                <code>${escapeHTML(value || '#5da9ff')}</code>
            </div>
        </label>
    `;

    const selectField = (label, key, value, options) => `
        <label class="obelisk-studio-field">
            <span>${escapeHTML(label)}</span>
            <select data-inspector-key="${escapeHTML(key)}">
                ${options.map(option => `
                    <option value="${escapeHTML(option.value)}" ${option.value === value ? 'selected' : ''}>
                        ${escapeHTML(option.label)}
                    </option>`).join('')}
            </select>
        </label>
    `;

    const rangeField = (label, key, value, min, max, step = 1, suffix = 'px') => `
        <label class="obelisk-studio-field obelisk-studio-range-field">
            <span>${escapeHTML(label)}</span>
            <div>
                <input type="range" data-inspector-key="${escapeHTML(key)}" min="${min}" max="${max}" step="${step}" value="${escapeHTML(value)}">
                <output>${escapeHTML(value)}${escapeHTML(suffix)}</output>
            </div>
        </label>
    `;

    const segmentField = (label, key, value, options) => `
        <div class="obelisk-studio-field obelisk-studio-segment-field">
            <span>${escapeHTML(label)}</span>
            <div class="obelisk-studio-segments">
                ${options.map(option => `<button type="button" data-segment-key="${escapeHTML(key)}" data-segment-value="${escapeHTML(option.value)}" class="${option.value === value ? 'is-active' : ''}">${escapeHTML(option.label)}</button>`).join('')}
            </div>
        </div>
    `;

    const themeBinding = block => `
        <label class="obelisk-studio-theme-binding ${block.data?.useTheme === false ? 'is-custom' : 'is-linked'}">
            <input type="checkbox" data-use-theme ${block.data?.useTheme === false ? '' : 'checked'}>
            <span><strong>${block.data?.useTheme === false ? 'CUSTOM VALUES' : 'LINKED TO GLOBAL THEME'}</strong><small>${block.data?.useTheme === false ? 'This component keeps its own colors and radius.' : 'Global theme colors and radius override local values.'}</small></span>
        </label>
    `;

    const renderArchiveEditor = block => {
        const entries = Array.isArray(block.data.entries) ? block.data.entries : [];
        return `
            <div class="obelisk-studio-subhead">
                <span>ARCHIVE RECORDS</span>
                <button type="button" data-archive-add>+ ADD</button>
            </div>
            <div class="obelisk-studio-archive-editor">
                ${entries.map((entry, index) => `
                    <div class="obelisk-studio-archive-entry" data-archive-index="${index}">
                        <div class="obelisk-studio-archive-entry-head">
                            <span>${String(index + 1).padStart(2, '0')}</span>
                            <div>
                                <button type="button" data-archive-move="${index}:-1" title="Move up">↑</button>
                                <button type="button" data-archive-move="${index}:1" title="Move down">↓</button>
                                <button type="button" data-archive-remove="${index}" title="Delete">×</button>
                            </div>
                        </div>
                        <input data-archive-title="${index}" value="${escapeHTML(entry.title || '')}" placeholder="Record title">
                        <textarea data-archive-content="${index}" placeholder="Record content">${escapeHTML(entry.content || '')}</textarea>
                    </div>
                `).join('')}
            </div>
        `;
    };

    const renderStatsEditor = block => {
        const entries = Array.isArray(block.data.entries) ? block.data.entries : [];
        return `
            <div class="obelisk-studio-subhead">
                <span>STAT ROWS</span>
                <button type="button" data-stats-add>+ ADD</button>
            </div>
            <div class="obelisk-studio-list-editor">
                ${entries.map((entry, index) => `
                    <div class="obelisk-studio-list-entry" data-stats-index="${index}">
                        <div class="obelisk-studio-list-entry-head">
                            <span>${String(index + 1).padStart(2, '0')}</span>
                            <div>
                                <button type="button" data-stats-move="${index}:-1">↑</button>
                                <button type="button" data-stats-move="${index}:1">↓</button>
                                <button type="button" data-stats-remove="${index}">×</button>
                            </div>
                        </div>
                        <input data-stats-label="${index}" value="${escapeHTML(entry.label || '')}" placeholder="Label">
                        <input data-stats-value="${index}" value="${escapeHTML(entry.value || '')}" placeholder="Value">
                    </div>
                `).join('')}
            </div>`;
    };

    const renderGalleryEditor = block => {
        const images = Array.isArray(block.data.images) ? block.data.images : [];
        return `
            <div class="obelisk-studio-subhead">
                <span>GALLERY IMAGES</span>
                <button type="button" data-gallery-add>+ ADD</button>
            </div>
            <div class="obelisk-studio-list-editor">
                ${images.map((image, index) => `
                    <div class="obelisk-studio-list-entry" data-gallery-index="${index}">
                        <div class="obelisk-studio-list-entry-head">
                            <span>${String(index + 1).padStart(2, '0')}</span>
                            <div>
                                <button type="button" data-gallery-move="${index}:-1">↑</button>
                                <button type="button" data-gallery-move="${index}:1">↓</button>
                                <button type="button" data-gallery-remove="${index}">×</button>
                            </div>
                        </div>
                        <input data-gallery-url="${index}" value="${escapeHTML(image.url || '')}" placeholder="Image URL">
                        <input data-gallery-alt="${index}" value="${escapeHTML(image.alt || '')}" placeholder="Alt text">
                    </div>
                `).join('')}
            </div>`;
    };

    const renderCastEditor = block => {
        const entries = Array.isArray(block.data.entries) ? block.data.entries : [];
        return `
            <div class="obelisk-studio-subhead obelisk-studio-cast-head">
                <span>CHARACTERS</span>
                <output>${entries.length}</output>
            </div>
            <label class="obelisk-studio-field obelisk-studio-range-field">
                <span>Character Count</span>
                <div>
                    <input type="range" min="1" max="8" step="1" value="${entries.length || 1}" data-cast-count>
                    <output>${entries.length || 1}</output>
                </div>
            </label>
            <div class="obelisk-studio-cast-editor">
                ${entries.map((entry, index) => `
                    <div class="obelisk-studio-cast-entry" data-cast-index="${index}">
                        <div class="obelisk-studio-list-entry-head">
                            <span>CAST ${String(index + 1).padStart(2, '0')}</span>
                            <div>
                                <button type="button" data-cast-move="${index}:-1">↑</button>
                                <button type="button" data-cast-move="${index}:1">↓</button>
                            </div>
                        </div>
                        <input data-cast-name="${index}" value="${escapeHTML(entry.name || '')}" placeholder="Character name">
                        <input data-cast-role="${index}" value="${escapeHTML(entry.role || '')}" placeholder="Role / label">
                        <input data-cast-portrait="${index}" value="${escapeHTML(entry.portrait || '')}" placeholder="Portrait image URL">
                        <textarea data-cast-note="${index}" placeholder="Optional short note">${escapeHTML(entry.note || '')}</textarea>
                    </div>
                `).join('')}
            </div>`;
    };

    const renderOriginalToolField = (fieldDef, values) => {
        const key = String(fieldDef?.key || '');
        if (!key) {
            return '';
        }

        const label = fieldDef.label || key;
        const type = fieldDef.type || 'text';
        const value = values?.[key] ?? '';
        const description = fieldDef.description
            ? `<small class="obelisk-studio-tool-field-note">${escapeHTML(fieldDef.description)}</small>`
            : '';

        if (type === 'textarea') {
            return `
                <label class="obelisk-studio-field obelisk-studio-tool-field">
                    <span>${escapeHTML(label)}</span>
                    <textarea data-tool-key="${escapeHTML(key)}" rows="${Number(fieldDef.rows) || 3}" placeholder="${escapeHTML(fieldDef.placeholder || '')}">${escapeHTML(value)}</textarea>
                    ${description}
                </label>`;
        }

        if (type === 'select') {
            const options = Array.isArray(fieldDef.options) ? fieldDef.options.map(normalizeToolOption) : [];
            return `
                <label class="obelisk-studio-field obelisk-studio-tool-field">
                    <span>${escapeHTML(label)}</span>
                    <select data-tool-key="${escapeHTML(key)}">
                        ${options.map(option => `<option value="${escapeHTML(option.value)}" ${String(option.value) === String(value) ? 'selected' : ''}>${escapeHTML(option.label)}</option>`).join('')}
                    </select>
                    ${description}
                </label>`;
        }

        if (type === 'range') {
            const min = fieldDef.min ?? 0;
            const max = fieldDef.max ?? 100;
            const step = fieldDef.step ?? 1;
            return `
                <label class="obelisk-studio-field obelisk-studio-range-field obelisk-studio-tool-field">
                    <span>${escapeHTML(label)}</span>
                    <div>
                        <input type="range" data-tool-key="${escapeHTML(key)}" min="${escapeHTML(min)}" max="${escapeHTML(max)}" step="${escapeHTML(step)}" value="${escapeHTML(value)}">
                        <output data-tool-output="${escapeHTML(key)}">${escapeHTML(value)}</output>
                    </div>
                    ${description}
                </label>`;
        }

        if (type === 'color') {
            const color = cssColor(value, '#5da9ff');
            return `
                <label class="obelisk-studio-field obelisk-studio-color-field obelisk-studio-tool-field">
                    <span>${escapeHTML(label)}</span>
                    <div>
                        <input type="color" data-tool-key="${escapeHTML(key)}" value="${escapeHTML(color)}">
                        <code>${escapeHTML(color)}</code>
                    </div>
                    ${description}
                </label>`;
        }

        return `
            <label class="obelisk-studio-field obelisk-studio-tool-field">
                <span>${escapeHTML(label)}</span>
                <input type="text" data-tool-key="${escapeHTML(key)}" value="${escapeHTML(value)}" placeholder="${escapeHTML(fieldDef.placeholder || '')}">
                ${description}
            </label>`;
    };

    const renderOriginalToolInspector = block => {
        const tool = compactToolByName(block.data?.toolName);
        const meta = compactToolMeta(block.data?.toolName);

        if (!tool) {
            return `<div class="obelisk-studio-raw-notice"><strong>TOOL NOT FOUND</strong><p>This layer references an Obelisk tool that is not loaded.</p></div>`;
        }

        block.data.values = normalizeToolValues(tool, block.data.values);
        const linked = block.data.followThemeAccent !== false;
        const experimental = /EXPERIMENTAL/i.test(meta.description || '') || ['🌌 Page Background', '🖱️ Hover Reveal Card'].includes(tool.name);

        return `
            <div class="obelisk-studio-tool-origin ${experimental ? 'is-experimental' : ''}">
                <div>
                    <small>${escapeHTML(meta.category || 'TOOLS')} · ORIGINAL PANEL TOOL</small>
                    <strong>${escapeHTML(tool.name)}</strong>
                    <p>${escapeHTML(meta.description || 'Original Obelisk component.')}</p>
                </div>
                <span>${experimental ? 'LAB' : '2.0'}</span>
            </div>
            ${field('Layer Name', 'name', block.data.name)}
            <label class="obelisk-studio-theme-binding ${linked ? 'is-linked' : 'is-custom'} obelisk-studio-tool-accent-binding">
                <input type="checkbox" data-tool-follow-accent ${linked ? 'checked' : ''}>
                <span><strong>${linked ? 'GLOBAL ACCENT' : 'CUSTOM ACCENT'}</strong><small>${linked ? 'This original tool follows the active Studio theme accent.' : 'This original tool keeps its own accent color.'}</small></span>
            </label>
            ${linked ? '' : colorField('Tool Accent', 'accent', block.data.accent || '#5da9ff')}
            <div class="obelisk-studio-tool-fields">
                ${(tool.fields || []).map(fieldDef => renderOriginalToolField(fieldDef, block.data.values)).join('')}
            </div>
        `;
    };

    const renderInspector = () => {
        if (!root) {
            return;
        }

        const inspector = root.querySelector('[data-studio-inspector]');
        if (!inspector) {
            return;
        }
        inspector.classList.remove('is-theme-linked');

        const block = state.blocks.find(item => item.id === state.selectedId);

        if (!block) {
            inspector.innerHTML = `
                <div class="obelisk-studio-inspector-empty">
                    <span>◇</span>
                    <strong>NO COMPONENT SELECTED</strong>
                    <small>Select a layer or add a new component.</small>
                </div>`;
            updateLayerActionButtons();
            return;
        }

        const data = block.data;
        let body = '';

        if (block.type === 'tool') {
            body = renderOriginalToolInspector(block);
        }

        if (block.type === 'raw') {
            body = `
                <div class="obelisk-studio-raw-notice">
                    <strong>IMPORTED CONTENT</strong>
                    <p>Studio preserves profiles it did not create as one safe movable block. The markup stays untouched unless you choose to edit it.</p>
                </div>
                <details class="obelisk-studio-raw-editor">
                    <summary>ADVANCED · EDIT RAW MARKUP</summary>
                    <textarea data-raw-editor spellcheck="false">${escapeHTML(data.raw || '')}</textarea>
                </details>
            `;
        }

        if (block.type === 'text') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${field('Eyebrow', 'eyebrow', data.eyebrow)}
                ${field('Title', 'title', data.title)}
                <label class="obelisk-studio-field">
                    <span>Body</span>
                    <textarea data-inspector-key="body">${escapeHTML(data.body || '')}</textarea>
                </label>
                ${segmentField('Alignment', 'align', data.align, [
                    { label: 'LEFT', value: 'left' },
                    { label: 'CENTER', value: 'center' },
                    { label: 'RIGHT', value: 'right' }
                ])}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text)}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Border', 'border', data.border)}
                ${rangeField('Radius', 'radius', data.radius, 0, 32)}
                ${rangeField('Padding', 'padding', data.padding, 4, 48)}
            `;
        }

        if (block.type === 'divider') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${field('Label', 'label', data.label)}
                ${selectField('Style', 'style', data.style, [
                    { label: 'Centered Hairlines', value: 'center' },
                    { label: 'Database Header', value: 'database' },
                    { label: 'Dossier Slash', value: 'slash' },
                    { label: 'Double Rule', value: 'double' }
                ])}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Line', 'muted', data.muted)}
            `;
        }

        if (block.type === 'image') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${field('Image URL', 'url', data.url)}
                ${field('Alt Text', 'alt', data.alt)}
                ${colorField('Border', 'accent', data.accent)}
                ${rangeField('Radius', 'radius', data.radius, 0, 32)}
                ${rangeField('Border Width', 'borderWidth', data.borderWidth, 0, 4)}
                ${rangeField('Maximum Width', 'maxWidth', data.maxWidth, 180, 900, 10)}
            `;
        }

        if (block.type === 'archive') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text || '#c8d5e2')}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Border', 'border', data.border || '#1b4f72')}
                ${rangeField('Radius', 'radius', data.radius ?? 2, 0, 24)}
                ${selectField('Columns', 'columns', String(data.columns), [
                    { label: 'One Column', value: '1' },
                    { label: 'Two Columns', value: '2' }
                ])}
                ${renderArchiveEditor(block)}
            `;
        }

        if (block.type === 'input') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${selectField('Input Type', 'type', data.type, [
                    { label: 'Text', value: 'text' },
                    { label: 'Search', value: 'search' },
                    { label: 'Password', value: 'password' }
                ])}
                ${field('Placeholder', 'placeholder', data.placeholder)}
                ${field('Button Text', 'button', data.button)}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Text', 'text', data.text)}
                ${rangeField('Radius', 'radius', data.radius, 0, 24)}
                <div class="obelisk-studio-hint">The input is real and typeable. The button is visual-only unless a hosted widget supplies logic.</div>
            `;
        }

        if (block.type === 'card') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${field('Eyebrow', 'eyebrow', data.eyebrow)}
                ${field('Title', 'title', data.title)}
                <label class="obelisk-studio-field"><span>Body</span><textarea data-inspector-key="body">${escapeHTML(data.body || '')}</textarea></label>
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text)}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Border', 'border', data.border)}
                ${rangeField('Radius', 'radius', data.radius, 0, 32)}
                ${rangeField('Padding', 'padding', data.padding, 6, 48)}
            `;
        }

        if (block.type === 'stats') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${selectField('Columns', 'columns', String(data.columns), [
                    { label: 'One Column', value: '1' },
                    { label: 'Two Columns', value: '2' }
                ])}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text)}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Border', 'border', data.border)}
                ${renderStatsEditor(block)}
            `;
        }

        if (block.type === 'quote') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                <label class="obelisk-studio-field"><span>Quote</span><textarea data-inspector-key="quote">${escapeHTML(data.quote || '')}</textarea></label>
                ${field('Attribution', 'attribution', data.attribution)}
                ${segmentField('Alignment', 'align', data.align, [
                    { label: 'LEFT', value: 'left' }, { label: 'CENTER', value: 'center' }, { label: 'RIGHT', value: 'right' }
                ])}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text)}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Border', 'border', data.border)}
                ${rangeField('Radius', 'radius', data.radius, 0, 32)}
            `;
        }

        if (block.type === 'badge') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${field('Label', 'label', data.label)}
                ${segmentField('Alignment', 'align', data.align, [
                    { label: 'LEFT', value: 'left' }, { label: 'CENTER', value: 'center' }, { label: 'RIGHT', value: 'right' }
                ])}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text)}
                ${colorField('Surface', 'surface', data.surface)}
                ${rangeField('Radius', 'radius', data.radius, 0, 48)}
            `;
        }

        if (block.type === 'link') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${field('Label', 'label', data.label)}
                ${field('URL', 'url', data.url)}
                ${segmentField('Alignment', 'align', data.align, [
                    { label: 'LEFT', value: 'left' }, { label: 'CENTER', value: 'center' }, { label: 'RIGHT', value: 'right' }
                ])}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text)}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Border', 'border', data.border)}
                ${rangeField('Radius', 'radius', data.radius, 0, 32)}
            `;
        }

        if (block.type === 'gallery') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${selectField('Columns', 'columns', String(data.columns), [
                    { label: 'One Column', value: '1' },
                    { label: 'Two Columns', value: '2' },
                    { label: 'Three Columns', value: '3' }
                ])}
                ${colorField('Border', 'border', data.border)}
                ${rangeField('Radius', 'radius', data.radius, 0, 32)}
                ${renderGalleryEditor(block)}
            `;
        }

        if (block.type === 'cast') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${selectField('Columns', 'columns', String(data.columns), [
                    { label: 'One Column', value: '1' },
                    { label: 'Two Columns', value: '2' },
                    { label: 'Three Columns', value: '3' }
                ])}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text)}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Border', 'border', data.border)}
                ${rangeField('Radius', 'radius', data.radius, 0, 32)}
                ${renderCastEditor(block)}
                <div class="obelisk-studio-hint">Set the character count first, then paste a portrait URL and type a name/role for each character.</div>
            `;
        }

        if (block.type === 'music') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${field('Track Title', 'title', data.title)}
                ${field('Artist / Source', 'artist', data.artist)}
                ${field('Cover Image URL', 'cover', data.cover)}
                ${field('SoundCloud URL (optional)', 'soundcloud', data.soundcloud)}
                ${selectField('Player Size', 'compact', String(data.compact !== false), [
                    { label: 'Compact Player', value: 'true' },
                    { label: 'Large Visual Player', value: 'false' }
                ])}
                ${colorField('Accent', 'accent', data.accent)}
                ${colorField('Text', 'text', data.text)}
                ${colorField('Surface', 'surface', data.surface)}
                ${colorField('Border', 'border', data.border)}
                ${rangeField('Radius', 'radius', data.radius, 0, 32)}
                <div class="obelisk-studio-hint">Audio never autoplays. Without a SoundCloud URL this remains a decorative “Now Playing” card.</div>
            `;
        }

        if (block.type === 'spacer') {
            body = `
                ${field('Layer Name', 'name', data.name)}
                ${rangeField('Height', 'height', data.height, 4, 180)}
            `;
        }

        const groupOptions = [
            '<option value="">NO GROUP</option>',
            ...state.groups.map(group => `<option value="${escapeHTML(group.id)}" ${block.groupId === group.id ? 'selected' : ''}>${escapeHTML(group.name)}</option>`)
        ].join('');
        body = `
            <label class="obelisk-studio-field obelisk-studio-group-field">
                <span>LAYER GROUP</span>
                <select data-layer-group-select>${groupOptions}</select>
                <small>Assign this layer to a collapsible section, or drag it onto a group header.</small>
            </label>
            ${body}
        `;

        if (themeableTypes.has(block.type)) {
            body = `${themeBinding(block)}${body}`;
        }

        inspector.innerHTML = `
            ${inspectorHeader(block)}
            <div class="obelisk-studio-inspector-scroll">
                ${body}
            </div>
        `;

        wireInspector(block);
        updateLayerActionButtons();
    };

    const wireInspector = block => {
        const inspector = root.querySelector('[data-studio-inspector]');
        if (!inspector) {
            return;
        }

        inspector.querySelector('[data-layer-group-select]')?.addEventListener('change', event => {
            assignBlockToGroup(block.id, event.target.value || null);
        });

        const themeToggle = inspector.querySelector('[data-use-theme]');
        if (themeToggle) {
            const themeKeys = new Set(['accent', 'surface', 'text', 'border', 'muted', 'radius']);
            if (block.data.useTheme !== false) {
                inspector.classList.add('is-theme-linked');
                inspector.querySelectorAll('[data-inspector-key]').forEach(control => {
                    const key = control.dataset.inspectorKey;
                    if (!themeKeys.has(key)) return;
                    if (key in state.theme) {
                        control.value = state.theme[key];
                        const code = control.parentElement?.querySelector('code');
                        if (code) code.textContent = state.theme[key];
                        const output = control.parentElement?.querySelector('output');
                        if (output && control.type === 'range') output.textContent = `${state.theme[key]}px`;
                    }
                    control.disabled = true;
                });
            }

            themeToggle.addEventListener('change', () => {
                pushUndo();
                const willUseTheme = themeToggle.checked;
                if (!willUseTheme) {
                    ['accent', 'surface', 'text', 'border', 'muted', 'radius'].forEach(key => {
                        if (key in state.theme && key in block.data) block.data[key] = state.theme[key];
                    });
                }
                block.data.useTheme = willUseTheme;
                renderInspector();
                renderLayers();
                syncLiveDocument();
            });
        }

        if (block.type === 'tool') {
            const followAccent = inspector.querySelector('[data-tool-follow-accent]');
            followAccent?.addEventListener('change', () => {
                pushUndo();
                if (!followAccent.checked) {
                    block.data.accent = state.theme.accent;
                }
                block.data.followThemeAccent = followAccent.checked;
                renderInspector();
                renderLayers();
                syncLiveDocument();
            });

            inspector.querySelectorAll('[data-tool-key]').forEach(control => {
                const key = control.dataset.toolKey;
                let initialSnapshot = null;

                control.addEventListener('focus', () => {
                    initialSnapshot = historySnapshot();
                });

                const applyToolValue = () => {
                    block.data.values = block.data.values && typeof block.data.values === 'object'
                        ? block.data.values
                        : {};
                    block.data.values[key] = control.value;

                    const output = inspector.querySelector(`[data-tool-output="${CSS.escape(key)}"]`);
                    if (output) {
                        output.textContent = control.value;
                    }

                    if (control.type === 'color') {
                        const code = control.parentElement?.querySelector('code');
                        if (code) code.textContent = control.value;
                    }

                    syncLiveDocument();
                };

                control.addEventListener('input', applyToolValue);
                control.addEventListener('change', applyToolValue);

                control.addEventListener('blur', () => {
                    if (initialSnapshot) {
                        const before = JSON.stringify(initialSnapshot.blocks);
                        const after = JSON.stringify(state.blocks);
                        if (before !== after) {
                            undoStack.push(initialSnapshot);
                            if (undoStack.length > maxHistory) undoStack.shift();
                            redoStack = [];
                            updateHistoryButtons();
                        }
                        initialSnapshot = null;
                    }
                });
            });
        }

        inspector.querySelectorAll('[data-segment-key]').forEach(button => {
            button.addEventListener('click', () => {
                const key = button.dataset.segmentKey;
                const value = button.dataset.segmentValue;
                if (block.data[key] === value) return;
                pushUndo();
                block.data[key] = value;
                renderInspector();
                syncLiveDocument();
            });
        });

        inspector.querySelectorAll('[data-inspector-key]').forEach(control => {
            const key = control.dataset.inspectorKey;
            let initialSnapshot = null;

            control.addEventListener('focus', () => {
                initialSnapshot = historySnapshot();
            });

            const apply = () => {
                let value = control.value;
                if (control.type === 'range' || key === 'columns') {
                    value = Number(value);
                }
                block.data[key] = value;

                const output = control.parentElement?.querySelector('output');
                if (output && control.type === 'range') {
                    output.textContent = `${control.value}px`;
                }

                const code = control.parentElement?.querySelector('code');
                if (code && control.type === 'color') {
                    code.textContent = control.value;
                }

                renderLayers();
                syncLiveDocument();
            };

            control.addEventListener('input', apply);
            control.addEventListener('change', apply);

            control.addEventListener('blur', () => {
                if (initialSnapshot) {
                    const before = JSON.stringify(initialSnapshot.blocks);
                    const after = JSON.stringify(state.blocks);
                    if (before !== after) {
                        undoStack.push(initialSnapshot);
                        if (undoStack.length > maxHistory) {
                            undoStack.shift();
                        }
                        redoStack = [];
                        updateHistoryButtons();
                    }
                    initialSnapshot = null;
                }
            });
        });

        const rawEditor = inspector.querySelector('[data-raw-editor]');
        if (rawEditor) {
            let initialSnapshot = null;
            rawEditor.addEventListener('focus', () => {
                initialSnapshot = historySnapshot();
            });
            rawEditor.addEventListener('input', () => {
                block.data.raw = rawEditor.value;
                syncLiveDocument();
            });
            rawEditor.addEventListener('blur', () => {
                if (initialSnapshot && JSON.stringify(initialSnapshot.blocks) !== JSON.stringify(state.blocks)) {
                    undoStack.push(initialSnapshot);
                    redoStack = [];
                    updateHistoryButtons();
                }
            });
        }

        inspector.querySelector('[data-archive-add]')?.addEventListener('click', () => {
            pushUndo();
            block.data.entries = Array.isArray(block.data.entries) ? block.data.entries : [];
            block.data.entries.push({ title: 'NEW RECORD', content: 'Hidden information...' });
            renderInspector();
            syncLiveDocument();
        });

        inspector.querySelectorAll('[data-archive-remove]').forEach(button => {
            button.addEventListener('click', () => {
                pushUndo();
                block.data.entries.splice(Number(button.dataset.archiveRemove), 1);
                renderInspector();
                syncLiveDocument();
            });
        });

        inspector.querySelectorAll('[data-archive-move]').forEach(button => {
            button.addEventListener('click', () => {
                const [indexText, directionText] = button.dataset.archiveMove.split(':');
                const index = Number(indexText);
                const target = index + Number(directionText);
                if (target < 0 || target >= block.data.entries.length) return;
                pushUndo();
                const [entry] = block.data.entries.splice(index, 1);
                block.data.entries.splice(target, 0, entry);
                renderInspector();
                syncLiveDocument();
            });
        });

        inspector.querySelectorAll('[data-archive-title], [data-archive-content]').forEach(control => {
            const index = Number(control.dataset.archiveTitle ?? control.dataset.archiveContent);
            const key = control.hasAttribute('data-archive-title') ? 'title' : 'content';
            let initialSnapshot = null;

            control.addEventListener('focus', () => {
                initialSnapshot = historySnapshot();
            });
            control.addEventListener('input', () => {
                if (!block.data.entries[index]) {
                    return;
                }
                block.data.entries[index][key] = control.value;
                syncLiveDocument();
            });
            control.addEventListener('blur', () => {
                if (initialSnapshot && JSON.stringify(initialSnapshot.blocks) !== JSON.stringify(state.blocks)) {
                    undoStack.push(initialSnapshot);
                    redoStack = [];
                    updateHistoryButtons();
                }
            });
        });
        const wirePairList = ({ prefix, arrayKey, firstKey, secondKey, firstSelector, secondSelector, defaults }) => {
            inspector.querySelector(`[data-${prefix}-add]`)?.addEventListener('click', () => {
                pushUndo();
                block.data[arrayKey] = Array.isArray(block.data[arrayKey]) ? block.data[arrayKey] : [];
                block.data[arrayKey].push(deepClone(defaults));
                renderInspector();
                syncLiveDocument();
            });

            inspector.querySelectorAll(`[data-${prefix}-remove]`).forEach(button => {
                button.addEventListener('click', () => {
                    pushUndo();
                    block.data[arrayKey].splice(Number(button.dataset[`${prefix}Remove`]), 1);
                    renderInspector();
                    syncLiveDocument();
                });
            });

            inspector.querySelectorAll(`[data-${prefix}-move]`).forEach(button => {
                button.addEventListener('click', () => {
                    const [indexText, directionText] = button.dataset[`${prefix}Move`].split(':');
                    const index = Number(indexText);
                    const target = index + Number(directionText);
                    if (target < 0 || target >= block.data[arrayKey].length) return;
                    pushUndo();
                    const [entry] = block.data[arrayKey].splice(index, 1);
                    block.data[arrayKey].splice(target, 0, entry);
                    renderInspector();
                    syncLiveDocument();
                });
            });

            inspector.querySelectorAll(`${firstSelector}, ${secondSelector}`).forEach(control => {
                const firstAttr = control.getAttribute(firstSelector.slice(1, -1));
                const secondAttr = control.getAttribute(secondSelector.slice(1, -1));
                const index = Number(firstAttr ?? secondAttr);
                const key = firstAttr !== null ? firstKey : secondKey;
                let initialSnapshot = null;
                control.addEventListener('focus', () => { initialSnapshot = historySnapshot(); });
                control.addEventListener('input', () => {
                    if (!block.data[arrayKey]?.[index]) return;
                    block.data[arrayKey][index][key] = control.value;
                    syncLiveDocument();
                });
                control.addEventListener('blur', () => {
                    if (initialSnapshot && JSON.stringify(initialSnapshot.blocks) !== JSON.stringify(state.blocks)) {
                        pushUndo(initialSnapshot);
                    }
                    initialSnapshot = null;
                });
            });
        };

        if (block.type === 'stats') {
            wirePairList({
                prefix: 'stats', arrayKey: 'entries', firstKey: 'label', secondKey: 'value',
                firstSelector: '[data-stats-label]', secondSelector: '[data-stats-value]',
                defaults: { label: 'NEW STAT', value: 'Value' }
            });
        }

        if (block.type === 'gallery') {
            wirePairList({
                prefix: 'gallery', arrayKey: 'images', firstKey: 'url', secondKey: 'alt',
                firstSelector: '[data-gallery-url]', secondSelector: '[data-gallery-alt]',
                defaults: { url: '', alt: 'Gallery image' }
            });
        }

        if (block.type === 'cast') {
            const ensureCast = count => {
                block.data.entries = Array.isArray(block.data.entries) ? block.data.entries : [];
                while (block.data.entries.length < count) {
                    const index = block.data.entries.length;
                    block.data.entries.push({ name: `CHARACTER ${index + 1}`, role: 'MEMBER', portrait: '', note: '' });
                }
                if (block.data.entries.length > count) {
                    block.data.entries.splice(count);
                }
            };

            const countControl = inspector.querySelector('[data-cast-count]');
            countControl?.addEventListener('change', () => {
                pushUndo();
                ensureCast(clamp(countControl.value, 1, 8, 1));
                renderInspector();
                syncLiveDocument();
            });

            inspector.querySelectorAll('[data-cast-move]').forEach(button => {
                button.addEventListener('click', () => {
                    const [indexText, directionText] = button.dataset.castMove.split(':');
                    const index = Number(indexText);
                    const target = index + Number(directionText);
                    if (target < 0 || target >= block.data.entries.length) return;
                    pushUndo();
                    const [entry] = block.data.entries.splice(index, 1);
                    block.data.entries.splice(target, 0, entry);
                    renderInspector();
                    syncLiveDocument();
                });
            });

            inspector.querySelectorAll('[data-cast-name], [data-cast-role], [data-cast-portrait], [data-cast-note]').forEach(control => {
                const attrs = ['name', 'role', 'portrait', 'note'];
                const key = attrs.find(item => control.hasAttribute(`data-cast-${item}`));
                const index = Number(control.getAttribute(`data-cast-${key}`));
                let initialSnapshot = null;
                control.addEventListener('focus', () => { initialSnapshot = historySnapshot(); });
                control.addEventListener('input', () => {
                    if (!block.data.entries?.[index]) return;
                    block.data.entries[index][key] = control.value;
                    syncLiveDocument();
                });
                control.addEventListener('blur', () => {
                    if (initialSnapshot && JSON.stringify(initialSnapshot.blocks) !== JSON.stringify(state.blocks)) {
                        pushUndo(initialSnapshot);
                    }
                    initialSnapshot = null;
                });
            });
        }
    };

    const updateLayerActionButtons = () => {
        const hasSelection = Boolean(state?.selectedId);
        root?.querySelectorAll('[data-studio-delete], [data-studio-duplicate], [data-studio-up], [data-studio-down]')
            .forEach(button => {
                button.disabled = !hasSelection;
            });
    };

    const renderAll = () => {
        renderThemeConsole();
        renderLayers();
        renderInspector();
        updateHistoryButtons();
        updateDirtyState();
    };


    // Original 2.0 Tool Vault

    const renderToolVault = () => {
        if (!root) return;

        const host = root.querySelector('[data-studio-tool-vault-grid]');
        const search = root.querySelector('[data-studio-tool-search]');
        const category = root.querySelector('[data-studio-tool-category]');
        const count = root.querySelector('[data-studio-tool-count]');
        if (!host || !search || !category) return;

        const allTools = compactTools();
        if (category.options.length <= 1) {
            const categories = [...new Set(allTools.map(tool => compactToolMeta(tool.name).category || 'TOOLS'))].sort();
            categories.forEach(name => {
                const option = document.createElement('option');
                option.value = name;
                option.textContent = name;
                category.appendChild(option);
            });
        }

        const query = search.value.trim().toLowerCase();
        const categoryValue = category.value;
        const filtered = allTools.filter(tool => {
            const meta = compactToolMeta(tool.name);
            const haystack = `${tool.name} ${meta.description || ''} ${meta.category || ''}`.toLowerCase();
            return (!query || haystack.includes(query)) && (!categoryValue || meta.category === categoryValue);
        });

        if (count) count.textContent = `${filtered.length}/${allTools.length}`;

        host.innerHTML = filtered.length
            ? filtered.map(tool => {
                const meta = compactToolMeta(tool.name);
                const clean = String(tool.name).replace(/^\S+\s+/, '').trim() || tool.name;
                return `
                    <button type="button" class="obelisk-studio-tool-vault-card" data-add-original-tool="${escapeHTML(tool.name)}" title="${escapeHTML(meta.description || '')}">
                        <span>${escapeHTML(meta.icon || '◆')}</span>
                        <div><strong>${escapeHTML(clean)}</strong><small>${escapeHTML(meta.category || 'TOOLS')}</small></div>
                        <i>+</i>
                    </button>`;
            }).join('')
            : `<div class="obelisk-studio-tool-vault-empty">NO TOOLS MATCH THIS FILTER</div>`;
    };


    const copyText = async text => {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (_) {
            try {
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                const ok = document.execCommand('copy');
                textarea.remove();
                return ok;
            } catch (_) {
                return false;
            }
        }
    };

    const openKitTransfer = mode => {
        const panel = root?.querySelector('[data-kit-transfer]');
        if (!panel) return;
        panel.dataset.mode = mode;
        panel.classList.add('is-open');
        panel.setAttribute('aria-hidden', 'false');
        const title = panel.querySelector('[data-kit-transfer-title]');
        const nameWrap = panel.querySelector('[data-kit-transfer-name-wrap]');
        const descriptionWrap = panel.querySelector('[data-kit-transfer-description-wrap]');
        const codeWrap = panel.querySelector('[data-kit-transfer-code-wrap]');
        const submit = panel.querySelector('[data-kit-transfer-submit]');
        if (mode === 'save') {
            if (title) title.textContent = 'SAVE CURRENT PROFILE AS KIT';
            nameWrap?.removeAttribute('hidden');
            descriptionWrap?.removeAttribute('hidden');
            codeWrap?.setAttribute('hidden', '');
            const name = panel.querySelector('[data-kit-transfer-name]');
            const description = panel.querySelector('[data-kit-transfer-description]');
            if (name) name.value = '';
            if (description) description.value = '';
            if (submit) submit.textContent = 'SAVE KIT';
            setTimeout(() => name?.focus(), 0);
        } else {
            if (title) title.textContent = 'IMPORT SHARED KIT';
            nameWrap?.setAttribute('hidden', '');
            descriptionWrap?.setAttribute('hidden', '');
            codeWrap?.removeAttribute('hidden');
            const code = panel.querySelector('[data-kit-transfer-code]');
            if (code) code.value = '';
            if (submit) submit.textContent = 'IMPORT KIT';
            setTimeout(() => code?.focus(), 0);
        }
    };

    const closeKitTransfer = () => {
        const panel = root?.querySelector('[data-kit-transfer]');
        if (!panel) return;
        panel.classList.remove('is-open');
        panel.setAttribute('aria-hidden', 'true');
    };

    const saveCurrentAsCustomKit = () => {
        const panel = root?.querySelector('[data-kit-transfer]');
        if (!panel || !state?.blocks?.length) {
            showToast('Add at least one layer before saving a kit.', 'error');
            return;
        }
        const name = String(panel.querySelector('[data-kit-transfer-name]')?.value || '').trim();
        const description = String(panel.querySelector('[data-kit-transfer-description]')?.value || '').trim();
        if (!name) {
            showToast('Give the custom kit a name.', 'error');
            return;
        }
        const kit = createCustomKitFromState(uniqueCustomKitName(name), description || 'Saved from Obelisk Studio.');
        if (!kit) return;
        customKits.unshift(kit);
        saveCustomKits();
        activeKitTier = 'custom';
        activeKitId = kit.id;
        closeKitTransfer();
        renderKitBrowser();
        showToast(`Saved “${kit.name}” to My Kits.`);
    };

    const importSharedKitText = raw => {
        const parsed = parseImportedKit(raw);
        if (!parsed) {
            showToast('That does not look like a valid Obelisk kit.', 'error');
            return null;
        }
        const stored = storeImportedCustomKit(parsed);
        if (!stored) return null;
        activeKitTier = 'custom';
        activeKitId = stored.id;
        renderKitBrowser();
        showToast(`Imported “${stored.name}”.`);
        return stored;
    };

    const importCustomKitFile = async file => {
        if (!file) return;
        try {
            const text = await file.text();
            importSharedKitText(text);
        } catch (error) {
            console.warn('[Obelisk Studio] Could not read imported kit file.', error);
            showToast('Could not read that kit file.', 'error');
        }
    };

    // Profile Kit browser

    const renderKitBrowser = () => {
        if (!root) return;

        const browser = root.querySelector('[data-studio-kit-browser]');
        const grid = root.querySelector('[data-studio-kit-grid]');
        const detail = root.querySelector('[data-studio-kit-detail]');
        const search = root.querySelector('[data-studio-kit-search]');
        const genre = root.querySelector('[data-studio-kit-genre]');
        if (!browser || !grid || !detail || !search || !genre) return;

        browser.querySelectorAll('[data-kit-tier]').forEach(button => {
            button.classList.toggle('is-active', button.dataset.kitTier === activeKitTier);
            const countNode = button.querySelector('[data-kit-tier-count]');
            if (countNode) {
                const tier = button.dataset.kitTier;
                countNode.textContent = tier === 'custom'
                    ? String(customKits.length)
                    : tier === 'signature'
                        ? String(SIGNATURE_KIT_DEFINITIONS.length)
                        : String(CORE_KIT_DEFINITIONS.length);
            }
        });
        const totalNode = browser.querySelector('[data-kit-total-count]');
        if (totalNode) totalNode.textContent = String(KIT_DEFINITIONS.length + customKits.length);

        const tierKits = activeKitTier === 'custom'
            ? customKits
            : KIT_DEFINITIONS.filter(kit => activeKitTier === 'signature' ? kit.tier === 'signature' : kit.tier !== 'signature');

        const previousGenre = genre.value;
        genre.innerHTML = '<option value="">ALL GENRES</option>';
        [...new Set(tierKits.map(kit => kit.genre || 'MY KITS'))].sort().forEach(value => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value;
            genre.appendChild(option);
        });
        if ([...genre.options].some(option => option.value === previousGenre)) genre.value = previousGenre;

        const query = search.value.trim().toLowerCase();
        const genreValue = genre.value;
        const filtered = tierKits.filter(kit => {
            const haystack = `${kit.name} ${kit.genre || ''} ${kit.description || ''} ${(kit.tags || []).join(' ')} ${(kit.features || []).join(' ')}`.toLowerCase();
            return (!query || haystack.includes(query)) && (!genreValue || kit.genre === genreValue);
        });

        if (!filtered.some(kit => kit.id === activeKitId) && filtered.length) activeKitId = filtered[0].id;

        grid.innerHTML = filtered.length
            ? filtered.map(kit => {
                const theme = kitTheme(kit);
                const isCustom = kit.tier === 'custom';
                const isSignature = kit.tier === 'signature';
                const sectionCount = isCustom ? Math.max(1, kit.groups?.length || 0) : kit.sections.length;
                const blockCount = isCustom ? kit.blocks.length : buildKitBlocks(kit).length;
                const featureTags = isSignature && kit.features?.length
                    ? `<div class="obelisk-studio-kit-card-features">${kit.features.map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div>`
                    : '';
                return `
                    <button type="button" class="obelisk-studio-kit-card ${isSignature ? 'is-signature' : ''} ${isCustom ? 'is-custom-kit' : ''} ${kit.id === activeKitId ? 'is-active' : ''}" data-kit-select="${escapeHTML(kit.id)}" style="--kit-accent:${theme.accent};--kit-surface:${theme.surface};--kit-border:${theme.border};">
                        <span class="obelisk-studio-kit-card-signal"></span>
                        <div class="obelisk-studio-kit-card-top"><small>${escapeHTML(kit.genre || 'MY KITS')}</small><i>${sectionCount} ${isCustom ? 'GROUPS' : 'SECTIONS'}</i></div>
                        <strong>${escapeHTML(kit.name)}</strong>
                        <p>${escapeHTML(kit.description || '')}</p>
                        ${featureTags}
                        <div class="obelisk-studio-kit-card-tags">${(kit.tags || []).map(tag => `<span>${escapeHTML(tag)}</span>`).join('')}</div>
                        <div class="obelisk-studio-kit-card-foot"><span>${blockCount} EDITABLE LAYERS</span><b>${isCustom ? 'MANAGE ◇' : isSignature ? 'ENTER ◆' : 'OPEN →'}</b></div>
                    </button>`;
            }).join('')
            : `<div class="obelisk-studio-kit-empty">${activeKitTier === 'custom' ? 'NO CUSTOM KITS YET — SAVE THIS PROFILE OR IMPORT ONE' : `NO ${activeKitTier === 'signature' ? 'SIGNATURE' : 'PROFILE'} KITS MATCH THIS FILTER`}</div>`;

        if (!filtered.length) {
            detail.removeAttribute('style');
            detail.innerHTML = activeKitTier === 'custom'
                ? `<div class="obelisk-studio-kit-empty"><b>MY KITS IS EMPTY</b><br><br>Use SAVE CURRENT to capture this Studio document, or import a .obelisk-kit.json file / share code.</div>`
                : '<div class="obelisk-studio-kit-empty">CLEAR THE FILTER TO VIEW A KIT</div>';
            return;
        }

        const kit = kitById(activeKitId);
        const theme = kitTheme(kit);
        detail.style.setProperty('--kit-accent', theme.accent);

        if (kit.tier === 'custom') {
            const groupCount = kit.groups?.length || 0;
            detail.innerHTML = `
                <div class="obelisk-studio-kit-detail-head is-custom-kit">
                    <div>
                        <small>MY KITS // LOCAL & SHAREABLE</small>
                        <strong>${escapeHTML(kit.name)}</strong>
                        <p>${escapeHTML(kit.description || 'Saved from Obelisk Studio.')}</p>
                    </div>
                    <div class="obelisk-studio-kit-theme-chip">
                        <span style="background:${theme.accent}"></span>
                        <span style="background:${theme.surface}"></span>
                        <span style="background:${theme.border}"></span>
                        <small>${escapeHTML(theme.name || 'Saved Theme')}</small>
                    </div>
                </div>
                <div class="obelisk-studio-custom-kit-summary">
                    <div><small>LAYERS</small><strong>${kit.blocks.length}</strong></div>
                    <div><small>GROUPS</small><strong>${groupCount}</strong></div>
                    <div><small>PROFILE FRAME</small><strong>${kit.canvas?.enabled ? 'ON' : 'OFF'}</strong></div>
                    <div><small>SAVED</small><strong>${escapeHTML(new Date(kit.createdAt).toLocaleDateString())}</strong></div>
                </div>
                <div class="obelisk-studio-kit-edit-note">
                    <b>PORTABLE STUDIO DOCUMENT</b>
                    <span>Custom kits preserve layers, groups, theme values, profile frame settings and original-tool configuration. New IDs are generated every time you insert one.</span>
                </div>
                <div class="obelisk-studio-kit-actions obelisk-studio-custom-kit-actions">
                    <button type="button" class="is-secondary" data-custom-kit-append><small>KEEP CURRENT PROFILE</small><strong>APPEND KIT</strong></button>
                    <button type="button" class="is-primary" data-custom-kit-replace><small>LOAD SAVED THEME + FRAME</small><strong>REPLACE DOCUMENT</strong></button>
                </div>
                <div class="obelisk-studio-custom-kit-share-actions">
                    <button type="button" data-custom-kit-copy>⧉ COPY SHARE CODE</button>
                    <button type="button" data-custom-kit-export>⇩ EXPORT JSON</button>
                    <button type="button" data-custom-kit-delete>× DELETE LOCAL KIT</button>
                </div>
                <div class="obelisk-studio-kit-action-note">Share codes contain only this kit data. They can be pasted into another Obelisk installation through IMPORT SHARE CODE.</div>
            `;
            return;
        }

        const allBlocks = buildKitBlocks(kit);
        const isSignature = kit.tier === 'signature';
        const draft = kitDraft(kit);
        const castSetup = kit.cast && draft
            ? `
                <div class="obelisk-studio-kit-cast-setup">
                    <div class="obelisk-studio-kit-section-head">
                        <div><small>MULTI-CHARACTER SETUP</small><strong>CAST / PORTRAITS</strong></div>
                        <output>${draft.cast.length} CHARACTER${draft.cast.length === 1 ? '' : 'S'}</output>
                    </div>
                    <label class="obelisk-studio-kit-cast-count">
                        <span>NUMBER OF CHARACTERS</span>
                        <input type="range" min="1" max="${kit.cast.max || 8}" step="1" value="${draft.cast.length}" data-kit-cast-count>
                    </label>
                    <div class="obelisk-studio-kit-cast-grid">
                        ${draft.cast.map((entry, index) => `
                            <div class="obelisk-studio-kit-cast-card">
                                <b>${String(index + 1).padStart(2, '0')}</b>
                                <input data-kit-cast-name="${index}" value="${escapeHTML(entry.name || '')}" placeholder="Character name">
                                <input data-kit-cast-role="${index}" value="${escapeHTML(entry.role || '')}" placeholder="Role / label">
                                <input data-kit-cast-portrait="${index}" value="${escapeHTML(entry.portrait || '')}" placeholder="Portrait image URL">
                            </div>`).join('')}
                    </div>
                    <small class="obelisk-studio-kit-cast-note">Quick setup only. After insertion, select the Cast layer to add notes, reorder people, change columns, or edit every portrait again.</small>
                </div>`
            : '';

        detail.innerHTML = `
            <div class="obelisk-studio-kit-detail-head ${isSignature ? 'is-signature' : ''}">
                <div>
                    <small>${escapeHTML(kit.genre)} // ${isSignature ? 'SHOWCASE KIT' : 'PROFILE KIT'}</small>
                    <strong>${escapeHTML(kit.name)}</strong>
                    <p>${escapeHTML(kit.description)}</p>
                </div>
                <div class="obelisk-studio-kit-theme-chip">
                    <span style="background:${theme.accent}"></span>
                    <span style="background:${theme.surface}"></span>
                    <span style="background:${theme.border}"></span>
                    <small>${escapeHTML(theme.name)}</small>
                </div>
            </div>
            ${isSignature ? `
                <div class="obelisk-studio-signature-banner">
                    <b>◆ SIGNATURE / SHOWCASE</b>
                    <span>More art-directed than normal kits. May combine motion, original panel effects, optional media and custom-styled layers.</span>
                    <div>${(kit.features || []).map(feature => `<i>${escapeHTML(feature)}</i>`).join('')}</div>
                </div>` : ''}
            <div class="obelisk-studio-kit-edit-note">
                <b>FULLY EDITABLE + AUTO-GROUPED</b>
                <span>This kit creates ${allBlocks.length} ordinary Studio layers. Each selected section also becomes a collapsible Layer Group that can be moved as one unit or dissolved later.</span>
            </div>
            ${castSetup}
            <div class="obelisk-studio-kit-section-head">
                <div><small>BUILD MATRIX</small><strong>CHOOSE SECTIONS</strong></div>
                <button type="button" data-kit-toggle-all>TOGGLE ALL</button>
            </div>
            <div class="obelisk-studio-kit-sections">
                ${kit.sections.map((section, index) => {
                    const icons = section.blocks.map(descriptor => descriptor[0] === 'tool'
                        ? blockIcon('tool', { data: { toolName: descriptor[1]?.toolName } })
                        : blockIcon(descriptor[0])).join(' ');
                    return `
                        <label class="obelisk-studio-kit-section">
                            <input type="checkbox" data-kit-section="${escapeHTML(section.id)}" checked>
                            <span class="obelisk-studio-kit-section-index">${String(index + 1).padStart(2, '0')}</span>
                            <span class="obelisk-studio-kit-section-copy">
                                <strong>${escapeHTML(section.label)}</strong>
                                <small>${escapeHTML(section.description)}</small>
                                <i>${escapeHTML(icons)} · ${section.blocks.length} LAYER${section.blocks.length === 1 ? '' : 'S'}</i>
                            </span>
                        </label>`;
                }).join('')}
            </div>
            <div class="obelisk-studio-kit-actions">
                <button type="button" class="is-secondary" data-kit-append><small>KEEP CURRENT PROFILE</small><strong>APPEND SELECTED</strong></button>
                <button type="button" class="is-primary ${isSignature ? 'is-signature' : ''}" data-kit-replace><small>${isSignature ? 'LOAD SHOWCASE SYSTEM' : 'START FROM THIS KIT'}</small><strong>REPLACE DOCUMENT</strong></button>
            </div>
            <div class="obelisk-studio-kit-action-note">Append keeps your current global theme. Replace loads the kit theme and Profile Frame. All inserted layers remain editable and Undo works for both.</div>
        `;
    };

    const openKitBrowser = () => {
        if (!root) return;
        const browser = root.querySelector('[data-studio-kit-browser]');
        if (!browser) return;

        renderKitBrowser();
        browser.classList.add('is-open');
        browser.setAttribute('aria-hidden', 'false');
        root.querySelector('[data-studio-kits]')?.classList.add('is-active');

        syncPreviewOverlayVisibility();
    };

    const closeKitBrowser = () => {
        if (!root) return;
        const browser = root.querySelector('[data-studio-kit-browser]');
        browser?.classList.remove('is-open');
        browser?.setAttribute('aria-hidden', 'true');
        root.querySelector('[data-studio-kits]')?.classList.remove('is-active');

        syncPreviewOverlayVisibility();
    };

    const selectedKitSections = () => {
        const checked = root?.querySelectorAll('[data-studio-kit-detail] [data-kit-section]:checked') || [];
        return new Set([...checked].map(input => input.dataset.kitSection));
    };

    const applyKit = mode => {
        if (!root || !state) return;
        const kit = kitById(activeKitId);

        if (kit.tier === 'custom') {
            const instance = freshCustomKitInstance(kit);
            if (!instance?.blocks?.length) {
                showToast('That custom kit is empty or invalid.', 'error');
                return;
            }
            if (mode === 'replace' && state.blocks.length) {
                const confirmed = window.confirm(`Replace the current Studio document with “${kit.name}”?\n\nUndo will still be available.`);
                if (!confirmed) return;
            }
            pushUndo();
            if (mode === 'replace') {
                state.blocks = instance.blocks;
                state.groups = instance.groups;
                state.theme = instance.theme;
                state.canvas = instance.canvas;
                state.selectedId = instance.blocks[0]?.id || null;
            } else {
                const currentIndex = state.blocks.findIndex(item => item.id === state.selectedId);
                const insertIndex = currentIndex >= 0 ? currentIndex + 1 : state.blocks.length;
                state.blocks.splice(insertIndex, 0, ...instance.blocks);
                state.groups.push(...instance.groups);
                state.selectedId = instance.blocks[0]?.id || state.selectedId;
            }
            makeGroupsContiguous();
            renderAll();
            syncLiveDocument();
            closeKitBrowser();
            showToast(mode === 'replace' ? `${kit.name} loaded.` : `${kit.name} appended.`);
            return;
        }

        const selectedSections = selectedKitSections();
        const blocks = buildKitBlocks(kit, selectedSections);
        if (!blocks.length) {
            showToast('Select at least one kit section.', 'error');
            return;
        }
        const groups = groupBuiltInKitBlocks(kit, blocks);

        if (mode === 'replace' && state.blocks.length) {
            const confirmed = window.confirm(`Replace the current Studio document with “${kit.name}”?\n\nThis creates normal editable layers, and you can Undo the replacement.`);
            if (!confirmed) return;
        }

        pushUndo();
        if (mode === 'replace') {
            state.blocks = blocks;
            state.groups = groups;
            state.theme = kitTheme(kit);
            state.canvas = kitCanvas(kit);
            state.selectedId = blocks[0]?.id || null;
        } else {
            const currentIndex = state.blocks.findIndex(item => item.id === state.selectedId);
            const insertIndex = currentIndex >= 0 ? currentIndex + 1 : state.blocks.length;
            state.blocks.splice(insertIndex, 0, ...blocks);
            state.groups.push(...groups);
            state.selectedId = blocks[0]?.id || state.selectedId;
        }

        makeGroupsContiguous();
        renderAll();
        syncLiveDocument();
        closeKitBrowser();
        showToast(mode === 'replace'
            ? `${kit.name} loaded as editable grouped Studio layers.`
            : `${kit.name} sections appended as editable groups.`);
    };

    const wireKitBrowser = () => {
        const browser = root?.querySelector('[data-studio-kit-browser]');
        if (!browser) return;

        root.querySelector('[data-studio-kits]')?.addEventListener('click', openKitBrowser);
        browser.querySelector('[data-kit-close]')?.addEventListener('click', closeKitBrowser);
        browser.querySelector('[data-studio-kit-search]')?.addEventListener('input', renderKitBrowser);
        browser.querySelector('[data-studio-kit-genre]')?.addEventListener('change', renderKitBrowser);

        browser.querySelectorAll('[data-kit-tier]').forEach(button => {
            button.addEventListener('click', () => {
                const tier = button.dataset.kitTier;
                if (!['core', 'signature', 'custom'].includes(tier) || tier === activeKitTier) return;
                activeKitTier = tier;
                const candidates = tier === 'custom'
                    ? customKits
                    : KIT_DEFINITIONS.filter(kit => tier === 'signature' ? kit.tier === 'signature' : kit.tier !== 'signature');
                activeKitId = candidates[0]?.id || KIT_DEFINITIONS[0].id;
                const genre = browser.querySelector('[data-studio-kit-genre]');
                if (genre) genre.value = '';
                renderKitBrowser();
            });
        });

        browser.querySelector('[data-studio-kit-grid]')?.addEventListener('click', event => {
            const card = event.target.closest('[data-kit-select]');
            if (!card) return;
            activeKitId = card.dataset.kitSelect;
            renderKitBrowser();
        });

        const detail = browser.querySelector('[data-studio-kit-detail]');
        detail?.addEventListener('click', async event => {
            if (event.target.closest('[data-kit-toggle-all]')) {
                const boxes = [...browser.querySelectorAll('[data-kit-section]')];
                const shouldCheck = boxes.some(box => !box.checked);
                boxes.forEach(box => { box.checked = shouldCheck; });
                return;
            }
            if (event.target.closest('[data-kit-append]')) {
                applyKit('append');
                return;
            }
            if (event.target.closest('[data-kit-replace]')) {
                applyKit('replace');
                return;
            }
            if (event.target.closest('[data-custom-kit-append]')) {
                applyKit('append');
                return;
            }
            if (event.target.closest('[data-custom-kit-replace]')) {
                applyKit('replace');
                return;
            }
            if (event.target.closest('[data-custom-kit-export]')) {
                const kit = kitById(activeKitId);
                if (kit?.tier === 'custom') {
                    downloadCustomKit(kit);
                    showToast(`Exported “${kit.name}”.`);
                }
                return;
            }
            if (event.target.closest('[data-custom-kit-copy]')) {
                const kit = kitById(activeKitId);
                if (kit?.tier === 'custom') {
                    const ok = await copyText(customKitShareCode(kit));
                    showToast(ok ? 'Custom kit share code copied.' : 'Could not copy the share code.', ok ? undefined : 'error');
                }
                return;
            }
            if (event.target.closest('[data-custom-kit-delete]')) {
                const kit = kitById(activeKitId);
                if (kit?.tier !== 'custom') return;
                if (!window.confirm(`Delete “${kit.name}” from My Kits?\n\nExport it first if you want a backup.`)) return;
                customKits = customKits.filter(item => item.id !== kit.id);
                saveCustomKits();
                activeKitId = customKits[0]?.id || KIT_DEFINITIONS[0].id;
                renderKitBrowser();
                showToast('Custom kit deleted.');
            }
        });

        detail?.addEventListener('input', event => {
            const kit = kitById(activeKitId);
            const draft = kitDraft(kit);
            if (!draft) return;

            if (event.target.matches('[data-kit-cast-count]')) {
                const count = clamp(event.target.value, 1, kit.cast?.max || 8, kit.cast?.defaultCount || 1);
                while (draft.cast.length < count) {
                    const index = draft.cast.length;
                    draft.cast.push({ name: `CHARACTER ${index + 1}`, role: kit.cast?.role || 'MEMBER', portrait: '', note: '' });
                }
                if (draft.cast.length > count) draft.cast.splice(count);
                renderKitBrowser();
                return;
            }

            const castFields = [
                ['name', 'data-kit-cast-name'],
                ['role', 'data-kit-cast-role'],
                ['portrait', 'data-kit-cast-portrait']
            ];
            for (const [key, attr] of castFields) {
                if (!event.target.hasAttribute(attr)) continue;
                const index = Number(event.target.getAttribute(attr));
                if (draft.cast[index]) draft.cast[index][key] = event.target.value;
                break;
            }
        });

        browser.querySelector('[data-kit-save-current]')?.addEventListener('click', () => openKitTransfer('save'));
        browser.querySelector('[data-kit-import-code]')?.addEventListener('click', () => openKitTransfer('import'));
        browser.querySelector('[data-kit-import-file]')?.addEventListener('click', () => browser.querySelector('[data-kit-file-input]')?.click());
        browser.querySelector('[data-kit-file-input]')?.addEventListener('change', async event => {
            const file = event.target.files?.[0];
            await importCustomKitFile(file);
            event.target.value = '';
        });

        const transfer = browser.querySelector('[data-kit-transfer]');
        transfer?.querySelector('[data-kit-transfer-close]')?.addEventListener('click', closeKitTransfer);
        transfer?.querySelector('[data-kit-transfer-cancel]')?.addEventListener('click', closeKitTransfer);
        transfer?.querySelector('[data-kit-transfer-submit]')?.addEventListener('click', () => {
            if (transfer.dataset.mode === 'save') {
                saveCurrentAsCustomKit();
            } else {
                const raw = transfer.querySelector('[data-kit-transfer-code]')?.value || '';
                const imported = importSharedKitText(raw);
                if (imported) closeKitTransfer();
            }
        });
        transfer?.addEventListener('pointerdown', event => {
            if (event.target === transfer) closeKitTransfer();
        });

        browser.addEventListener('pointerdown', event => {
            if (event.target === browser) closeKitBrowser();
        });
    };

    // Studio shell

    const studioMarkup = accent => `
        <div class="obelisk-studio-atmosphere" aria-hidden="true">
            <div class="obelisk-studio-orbit"></div>
            <div class="obelisk-studio-grid"></div>
            <div class="obelisk-studio-scan"></div>
        </div>

        <div class="obelisk-studio-frame">
            <header class="obelisk-studio-topbar">
                <div class="obelisk-studio-branding">
                    <span class="obelisk-studio-glyph">◆</span>
                    <div>
                        <small>OBELISK // VISUAL PROFILE SYSTEM</small>
                        <strong>STUDIO</strong>
                    </div>
                    <span class="obelisk-studio-version">2.1</span>
                </div>

                <div class="obelisk-studio-route">
                    <span>ACTIVE RECORD</span>
                    <strong>${escapeHTML(window.location.pathname.split('/').filter(Boolean).pop() || 'CHARACTER')}</strong>
                </div>

                <div class="obelisk-studio-top-actions">
                    <button type="button" data-studio-undo title="Undo (Ctrl+Z)">↶</button>
                    <button type="button" data-studio-redo title="Redo (Ctrl+Shift+Z)">↷</button>
                    <span class="obelisk-studio-save-state" data-studio-save-state>SYNCED</span>
                    <button type="button" class="obelisk-studio-kits-button" data-studio-kits title="Open editable Profile Kits">KITS</button>
                    <button type="button" class="obelisk-studio-ui-button" data-studio-ui-settings title="Customize Studio interface" aria-expanded="false">Aa</button>
                    <button type="button" class="obelisk-studio-motion" data-studio-motion title="Toggle Studio animation effects">FX</button>
                    <button type="button" class="obelisk-studio-apply" data-studio-apply>APPLY TO CLANK</button>
                    <button type="button" class="obelisk-studio-close" data-studio-close title="Close Studio">×</button>

                    <div class="obelisk-studio-ui-popover" data-studio-ui-popover>
                        <div class="obelisk-studio-ui-popover-head">
                            <div><small>WORKSPACE</small><strong>STUDIO APPEARANCE</strong></div>
                            <button type="button" data-studio-ui-popover-close aria-label="Close appearance settings">×</button>
                        </div>

                        <label class="obelisk-studio-ui-setting">
                            <span><strong>INTERFACE TEXT</strong><output data-studio-ui-scale-output>125%</output></span>
                            <input type="range" min="90" max="170" step="5" value="125" data-studio-ui-scale>
                            <small>Only Studio changes. Character profile text is untouched.</small>
                        </label>

                        <label class="obelisk-studio-ui-setting">
                            <span><strong>LAYERS WIDTH</strong><output data-studio-ui-left-output>300px</output></span>
                            <input type="range" min="220" max="480" step="10" value="300" data-studio-ui-left-width>
                        </label>

                        <label class="obelisk-studio-ui-setting">
                            <span><strong>INSPECTOR WIDTH</strong><output data-studio-ui-right-output>350px</output></span>
                            <input type="range" min="260" max="540" step="10" value="350" data-studio-ui-right-width>
                        </label>

                        <label class="obelisk-studio-ui-setting">
                            <span><strong>INTERFACE SKIN</strong></span>
                            <select data-studio-ui-skin>
                                <option value="obsidian">Obsidian</option>
                                <option value="midnight">Midnight</option>
                                <option value="graphite">Graphite</option>
                            </select>
                        </label>

                        <div class="obelisk-studio-ui-popover-actions">
                            <button type="button" data-studio-ui-reset>RESET WORKSPACE</button>
                        </div>
                    </div>
                </div>
            </header>

            <section class="obelisk-studio-kit-browser" data-studio-kit-browser aria-hidden="true">
                <div class="obelisk-studio-kit-shell">
                    <header class="obelisk-studio-kit-browser-head">
                        <div class="obelisk-studio-kit-browser-title">
                            <span>◇</span>
                            <div><small>OBELISK // PROFILE ASSEMBLY LIBRARY</small><strong>PROFILE KITS</strong></div>
                        </div>
                        <div class="obelisk-studio-kit-browser-copy">Templates are starting points. Every inserted piece remains a normal editable Studio layer.</div>
                        <button type="button" data-kit-close aria-label="Close Profile Kits">×</button>
                    </header>
                    <div class="obelisk-studio-kit-tier-switch">
                        <button type="button" data-kit-tier="core" class="is-active"><span>PROFILE KITS</span><b data-kit-tier-count>${CORE_KIT_DEFINITIONS.length}</b><small>FLEXIBLE STARTING LAYOUTS</small></button>
                        <button type="button" data-kit-tier="signature"><span>◆ SIGNATURE / SHOWCASE</span><b data-kit-tier-count>${SIGNATURE_KIT_DEFINITIONS.length}</b><small>ART-DIRECTED · MOTION · MEDIA</small></button>
                        <button type="button" data-kit-tier="custom"><span>◇ MY KITS</span><b data-kit-tier-count>0</b><small>SAVED · IMPORTED · SHAREABLE</small></button>
                    </div>
                    <div class="obelisk-studio-kit-toolbar">
                        <input type="search" data-studio-kit-search placeholder="Search kits, genres, features..." autocomplete="off">
                        <select data-studio-kit-genre aria-label="Filter profile kits by genre"><option value="">ALL GENRES</option></select>
                        <button type="button" data-kit-save-current>SAVE CURRENT</button>
                        <button type="button" data-kit-import-file>IMPORT FILE</button>
                        <button type="button" data-kit-import-code>PASTE SHARE CODE</button>
                        <input type="file" accept=".json,.obelisk-kit.json,application/json" data-kit-file-input hidden>
                        <span><b data-kit-total-count>${KIT_DEFINITIONS.length}</b> TOTAL</span>
                    </div>
                    <div class="obelisk-studio-kit-content">
                        <div class="obelisk-studio-kit-grid" data-studio-kit-grid></div>
                        <aside class="obelisk-studio-kit-detail" data-studio-kit-detail></aside>
                    </div>
                    <div class="obelisk-studio-kit-transfer" data-kit-transfer aria-hidden="true">
                        <div class="obelisk-studio-kit-transfer-card">
                            <header><div><small>MY KITS // PORTABLE PROFILE RECIPES</small><strong data-kit-transfer-title>SAVE CURRENT PROFILE AS KIT</strong></div><button type="button" data-kit-transfer-close>×</button></header>
                            <label data-kit-transfer-name-wrap><span>KIT NAME</span><input type="text" data-kit-transfer-name maxlength="80" placeholder="My Character Layout"></label>
                            <label data-kit-transfer-description-wrap><span>DESCRIPTION</span><textarea data-kit-transfer-description maxlength="300" rows="3" placeholder="What is this kit for?"></textarea></label>
                            <label data-kit-transfer-code-wrap hidden><span>SHARE CODE OR JSON</span><textarea data-kit-transfer-code rows="10" spellcheck="false" placeholder="Paste OBELISK-KIT-V1:... or exported JSON here"></textarea></label>
                            <div class="obelisk-studio-kit-transfer-note">Custom kits preserve Studio layers, groups, theme values, Profile Frame settings, Cast entries and original panel-tool fields.</div>
                            <footer><button type="button" data-kit-transfer-cancel>CANCEL</button><button type="button" class="is-primary" data-kit-transfer-submit>SAVE KIT</button></footer>
                        </div>
                    </div>
                </div>
            </section>

            <main class="obelisk-studio-workspace">
                <aside class="obelisk-studio-layers-panel">
                    <div class="obelisk-studio-pane-head">
                        <div>
                            <small>DOCUMENT MATRIX</small>
                            <strong>LAYERS</strong>
                        </div>
                        <output data-studio-layer-count>00</output>
                    </div>

                    <div class="obelisk-studio-theme-console">
                        <div class="obelisk-studio-theme-console-head">
                            <span>GLOBAL THEME</span>
                            <strong data-studio-theme-name>CITY DATABASE</strong>
                        </div>
                        <select data-studio-theme-preset aria-label="Studio theme preset">
                            <option value="database">City Database</option>
                            <option value="gothic">Gothic Archive</option>
                            <option value="soft">Soft Panel</option>
                            <option value="terminal">Terminal</option>
                            <option value="minimal">Minimal</option>
                            <option value="fantasy">Fantasy Tome</option>
                            <option value="visualnovel">Visual Novel</option>
                            <option value="horror">Horror Case File</option>
                            <option value="social">Soft Social</option>
                            <option value="y2k">Y2K / Old Web</option>
                            <option value="editorial">Minimal Editorial</option>
                            <option value="broadcast">Emergency Broadcast</option>
                            <option value="vhs">Haunted VHS</option>
                            <option value="rpg">RPG Save File</option>
                            <option value="cyberos">Cyber OS</option>
                            <option value="stage">Stage / Artist</option>
                            <option value="occult">Occult Archive</option>
                            <option value="dreamcore">Dreamcore Scrapbook</option>
                            <option value="fashion">Dark Fashion Editorial</option>
                            <option value="spacecraft">Spacecraft AI</option>
                            <option value="crimeboard">Crime Scene Board</option>
                        </select>
                        <div class="obelisk-studio-theme-swatches">
                            <label title="Accent"><span>A</span><input type="color" data-theme-key="accent"></label>
                            <label title="Surface"><span>S</span><input type="color" data-theme-key="surface"></label>
                            <label title="Text"><span>T</span><input type="color" data-theme-key="text"></label>
                            <label title="Border"><span>B</span><input type="color" data-theme-key="border"></label>
                            <label title="Muted / Divider"><span>M</span><input type="color" data-theme-key="muted"></label>
                        </div>
                        <div class="obelisk-studio-theme-radius">
                            <span>RADIUS</span>
                            <input type="range" min="0" max="24" step="1" data-theme-radius>
                            <output data-theme-radius-output>3px</output>
                        </div>
                        <button type="button" class="obelisk-studio-canvas-toggle" data-studio-canvas-toggle>PROFILE FRAME OFF</button>
                    </div>

                    <div class="obelisk-studio-layer-actions">
                        <button type="button" data-studio-new-group title="Create a group from the selected layer">+ GROUP</button>
                        <button type="button" data-studio-up title="Move up">↑</button>
                        <button type="button" data-studio-down title="Move down">↓</button>
                        <button type="button" data-studio-duplicate title="Duplicate">⧉</button>
                        <button type="button" data-studio-delete title="Delete">×</button>
                    </div>

                    <div class="obelisk-studio-layers" data-studio-layers></div>

                    <div class="obelisk-studio-add-title">
                        <span>ADD COMPONENT</span>
                    </div>

                    <div class="obelisk-studio-component-palette">
                        <button type="button" data-add-block="text"><span>Aa</span><strong>TEXT</strong></button>
                        <button type="button" data-add-block="card"><span>▰</span><strong>CARD</strong></button>
                        <button type="button" data-add-block="stats"><span>▦</span><strong>STATS</strong></button>
                        <button type="button" data-add-block="quote"><span>❞</span><strong>QUOTE</strong></button>
                        <button type="button" data-add-block="divider"><span>⌁</span><strong>DIVIDER</strong></button>
                        <button type="button" data-add-block="image"><span>▣</span><strong>IMAGE</strong></button>
                        <button type="button" data-add-block="gallery"><span>▥</span><strong>GALLERY</strong></button>
                        <button type="button" data-add-block="archive"><span>▤</span><strong>ARCHIVE</strong></button>
                        <button type="button" data-add-block="badge"><span>◆</span><strong>BADGE</strong></button>
                        <button type="button" data-add-block="link"><span>↗</span><strong>LINK</strong></button>
                        <button type="button" data-add-block="input"><span>⌨</span><strong>INPUT</strong></button>
                        <button type="button" data-add-block="cast"><span>♟</span><strong>CAST</strong></button>
                        <button type="button" data-add-block="music"><span>♫</span><strong>MUSIC</strong></button>
                        <button type="button" data-add-block="spacer"><span>↕</span><strong>SPACER</strong></button>
                    </div>

                    <div class="obelisk-studio-tool-vault">
                        <div class="obelisk-studio-tool-vault-head">
                            <div><small>CURRENT PANEL LIBRARY</small><strong>TOOL VAULT</strong></div>
                            <output data-studio-tool-count>50/50</output>
                        </div>
                        <div class="obelisk-studio-tool-vault-controls">
                            <input type="search" data-studio-tool-search placeholder="Search all panel tools..." autocomplete="off">
                            <select data-studio-tool-category aria-label="Filter original tools by category">
                                <option value="">ALL CATEGORIES</option>
                            </select>
                        </div>
                        <div class="obelisk-studio-tool-vault-grid" data-studio-tool-vault-grid></div>
                    </div>
                    <div class="obelisk-studio-resizer obelisk-studio-resizer-left" data-studio-resize="left" title="Drag to resize Layers panel · double-click to reset"></div>
                </aside>

                <section class="obelisk-studio-center" data-studio-center-scroll>
                    <div class="obelisk-studio-center-head">
                        <div>
                            <small>CLANK RENDER CORE // LIVE</small>
                            <strong>PROFILE OUTPUT</strong>
                        </div>
                        <div class="obelisk-studio-render-readout">
                            <span><i></i> LIVE</span>
                            <span>WIDTH <b>420 PX</b></span>
                            <span>HEIGHT <b data-studio-preview-height>—</b></span>
                        </div>
                    </div>

                    <div class="obelisk-studio-preview-stage">
                        <div class="obelisk-studio-preview-bracket bracket-a"></div>
                        <div class="obelisk-studio-preview-bracket bracket-b"></div>
                        <div class="obelisk-studio-preview-bracket bracket-c"></div>
                        <div class="obelisk-studio-preview-bracket bracket-d"></div>

                        <div class="obelisk-studio-preview-host" data-studio-preview-host>
                            <div class="obelisk-studio-preview-wait">
                                <span>◆</span>
                                <strong data-studio-preview-message>LINKING CLANK RENDERER</strong>
                                <small>frames.clank.world/render</small>
                            </div>
                        </div>
                    </div>

                    <div class="obelisk-studio-center-footer">
                        <span>DRAG LAYERS TO REORDER</span>
                        <span>CTRL+S APPLY</span>
                        <span>ESC CLOSE</span>
                    </div>
                </section>

                <aside class="obelisk-studio-inspector-panel">
                    <div class="obelisk-studio-resizer obelisk-studio-resizer-right" data-studio-resize="right" title="Drag to resize Inspector · double-click to reset"></div>
                    <div class="obelisk-studio-pane-head">
                        <div>
                            <small>COMPONENT CONTROL</small>
                            <strong>INSPECTOR</strong>
                        </div>
                        <output>EDIT</output>
                    </div>
                    <div class="obelisk-studio-inspector" data-studio-inspector></div>
                </aside>
            </main>

            <footer class="obelisk-studio-statusbar">
                <span><i></i> CLANK LINK ONLINE</span>
                <span>MARKUP ENGINE: INLINE / REHYPE SAFE</span>
                <span>ACCENT <b>${escapeHTML(accent)}</b></span>
            </footer>
        </div>
    `;

    const wireStudioResizeHandle = handle => {
        if (!handle) return;

        const side = handle.dataset.studioResize;
        if (!['left', 'right'].includes(side)) return;

        handle.addEventListener('dblclick', event => {
            event.preventDefault();
            const key = side === 'left' ? 'studioLeftWidth' : 'studioRightWidth';
            const value = side === 'left' ? STUDIO_UI_DEFAULTS.leftWidth : STUDIO_UI_DEFAULTS.rightWidth;
            setStudioUiSetting(key, value, { save: true });
        });

        handle.addEventListener('pointerdown', event => {
            if (event.button !== 0) return;
            event.preventDefault();

            const startX = event.clientX;
            const key = side === 'left' ? 'studioLeftWidth' : 'studioRightWidth';
            const startWidth = Number(studioSettings?.[key]) ||
                (side === 'left' ? STUDIO_UI_DEFAULTS.leftWidth : STUDIO_UI_DEFAULTS.rightWidth);

            handle.setPointerCapture?.(event.pointerId);
            root?.classList.add('obelisk-studio-is-resizing');

            const move = moveEvent => {
                const delta = side === 'left'
                    ? moveEvent.clientX - startX
                    : startX - moveEvent.clientX;
                const min = side === 'left' ? 220 : 260;
                const max = side === 'left' ? 480 : 540;
                setStudioUiSetting(key, clamp(startWidth + delta, min, max, startWidth));
            };

            const finish = finishEvent => {
                handle.releasePointerCapture?.(finishEvent.pointerId);
                handle.removeEventListener('pointermove', move);
                handle.removeEventListener('pointerup', finish);
                handle.removeEventListener('pointercancel', finish);
                root?.classList.remove('obelisk-studio-is-resizing');
                saveStudioUiSettings();
                applyStudioUiSettings();
                syncPreviewDock();
            };

            handle.addEventListener('pointermove', move);
            handle.addEventListener('pointerup', finish);
            handle.addEventListener('pointercancel', finish);
        });
    };

    const wireStudioUiCustomization = () => {
        const toggle = root?.querySelector('[data-studio-ui-settings]');
        const popover = root?.querySelector('[data-studio-ui-popover]');
        if (!toggle || !popover) return;

        const setOpen = open => {
            popover.classList.toggle('is-open', open);
            toggle.classList.toggle('is-active', open);
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            syncPreviewOverlayVisibility();
        };

        toggle.addEventListener('click', event => {
            event.stopPropagation();
            setOpen(!popover.classList.contains('is-open'));
        });

        popover.addEventListener('click', event => event.stopPropagation());
        popover.querySelector('[data-studio-ui-popover-close]')?.addEventListener('click', () => setOpen(false));

        root.addEventListener('pointerdown', event => {
            if (!popover.classList.contains('is-open')) return;
            if (event.target.closest('[data-studio-ui-popover], [data-studio-ui-settings]')) return;
            setOpen(false);
        });

        const scale = popover.querySelector('[data-studio-ui-scale]');
        scale?.addEventListener('input', () => {
            setStudioUiSetting('studioTextScale', Number(scale.value) / 100);
        });
        scale?.addEventListener('change', saveStudioUiSettings);

        const left = popover.querySelector('[data-studio-ui-left-width]');
        left?.addEventListener('input', () => {
            setStudioUiSetting('studioLeftWidth', Number(left.value));
            syncPreviewDock();
        });
        left?.addEventListener('change', saveStudioUiSettings);

        const right = popover.querySelector('[data-studio-ui-right-width]');
        right?.addEventListener('input', () => {
            setStudioUiSetting('studioRightWidth', Number(right.value));
            syncPreviewDock();
        });
        right?.addEventListener('change', saveStudioUiSettings);

        const skin = popover.querySelector('[data-studio-ui-skin]');
        skin?.addEventListener('change', () => {
            setStudioUiSetting('studioSkin', skin.value, { save: true });
        });

        popover.querySelector('[data-studio-ui-reset]')?.addEventListener('click', () => {
            studioSettings.studioTextScale = STUDIO_UI_DEFAULTS.textScale;
            studioSettings.studioLeftWidth = STUDIO_UI_DEFAULTS.leftWidth;
            studioSettings.studioRightWidth = STUDIO_UI_DEFAULTS.rightWidth;
            studioSettings.studioSkin = STUDIO_UI_DEFAULTS.skin;
            saveStudioUiSettings();
            applyStudioUiSettings();
            syncPreviewDock();
            showToast('Studio workspace reset.');
        });

        root.querySelectorAll('[data-studio-resize]').forEach(wireStudioResizeHandle);
    };

    const wireStudio = () => {
        wireStudioUiCustomization();
        wireKitBrowser();

        root.querySelectorAll('[data-add-block]').forEach(button => {
            button.addEventListener('click', () => addBlock(button.dataset.addBlock));
        });

        renderToolVault();

        root.querySelector('[data-studio-tool-search]')?.addEventListener('input', renderToolVault);
        root.querySelector('[data-studio-tool-category]')?.addEventListener('change', renderToolVault);
        root.querySelector('[data-studio-tool-vault-grid]')?.addEventListener('click', event => {
            const button = event.target.closest('[data-add-original-tool]');
            if (!button) return;
            addOriginalTool(button.dataset.addOriginalTool);
        });

        root.querySelector('[data-studio-theme-preset]')?.addEventListener('change', event => {
            applyThemePreset(event.target.value);
        });

        root.querySelectorAll('[data-theme-key]').forEach(control => {
            control.addEventListener('change', () => {
                pushUndo();
                state.theme[control.dataset.themeKey] = control.value;
                state.theme.name = `${THEME_PRESETS[state.theme.id]?.name || 'Theme'} · Custom`;
                if (state.canvas.enabled) {
                    if (control.dataset.themeKey === 'surface') state.canvas.background = control.value;
                    if (control.dataset.themeKey === 'border') state.canvas.border = control.value;
                }
                renderAll();
                syncLiveDocument();
            });
        });

        const themeRadius = root.querySelector('[data-theme-radius]');
        if (themeRadius) {
            let initialSnapshot = null;
            themeRadius.addEventListener('focus', () => { initialSnapshot = historySnapshot(); });
            themeRadius.addEventListener('input', () => {
                state.theme.radius = Number(themeRadius.value);
                state.theme.name = `${THEME_PRESETS[state.theme.id]?.name || 'Theme'} · Custom`;
                if (state.canvas.enabled) state.canvas.radius = state.theme.radius;
                const out = root.querySelector('[data-theme-radius-output]');
                if (out) out.textContent = `${themeRadius.value}px`;
                syncLiveDocument();
            });
            themeRadius.addEventListener('blur', () => {
                if (initialSnapshot && JSON.stringify(initialSnapshot) !== JSON.stringify(historySnapshot())) {
                    pushUndo(initialSnapshot);
                }
                initialSnapshot = null;
                renderAll();
            });
        }

        root.querySelector('[data-studio-canvas-toggle]')?.addEventListener('click', () => {
            pushUndo();
            state.canvas.enabled = !state.canvas.enabled;
            if (state.canvas.enabled) {
                state.canvas.background = state.theme.surface;
                state.canvas.border = state.theme.border;
                state.canvas.radius = state.theme.radius;
            }
            renderAll();
            syncLiveDocument();
        });

        root.querySelector('[data-studio-new-group]')?.addEventListener('click', createGroupFromSelected);
        root.querySelector('[data-studio-delete]')?.addEventListener('click', deleteSelected);
        root.querySelector('[data-studio-duplicate]')?.addEventListener('click', duplicateSelected);
        root.querySelector('[data-studio-up]')?.addEventListener('click', () => moveSelected(-1));
        root.querySelector('[data-studio-down]')?.addEventListener('click', () => moveSelected(1));
        root.querySelector('[data-studio-undo]')?.addEventListener('click', undo);
        root.querySelector('[data-studio-redo]')?.addEventListener('click', redo);
        root.querySelector('[data-studio-apply]')?.addEventListener('click', applyToClank);
        root.querySelector('[data-studio-close]')?.addEventListener('click', requestClose);

        root.querySelector('[data-studio-motion]')?.addEventListener('click', () => {
            studioSettings.studioAnimations = !studioSettings.studioAnimations;
            storage.saveSettings(studioSettings);
            root.classList.toggle('obelisk-studio-reduced-motion', !studioSettings.studioAnimations);
            root.querySelector('[data-studio-motion]').classList.toggle('is-off', !studioSettings.studioAnimations);
        });
    };

    const onStudioKeydown = event => {
        if (!root) {
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopImmediatePropagation();
            const kitBrowser = root.querySelector('[data-studio-kit-browser]');
            if (kitBrowser?.classList.contains('is-open')) {
                closeKitBrowser();
            } else {
                requestClose();
            }
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
            event.preventDefault();
            event.stopImmediatePropagation();
            applyToClank();
            return;
        }

        if (!isFormControl(event.target) && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
            event.preventDefault();
            event.stopImmediatePropagation();
            if (event.shiftKey) {
                redo();
            } else {
                undo();
            }
            return;
        }

        if (!isFormControl(event.target) && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
            event.preventDefault();
            event.stopImmediatePropagation();
            redo();
            return;
        }

        if (!isFormControl(event.target) && (event.key === 'Delete' || event.key === 'Backspace')) {
            event.preventDefault();
            deleteSelected();
        }
    };

    const open = async options => {
        if (root) {
            root.classList.add('obelisk-studio-attention');
            setTimeout(() => root?.classList.remove('obelisk-studio-attention'), 500);
            return;
        }

        const editor = findAboutEditor();
        if (!editor) {
            showToast('Could not find the Edit about editor.', 'error');
            return;
        }

        const token = ++openToken;
        committedAbout = String(editor.value || '');
        liveAbout = committedAbout;
        dirty = false;
        undoStack = [];
        redoStack = [];
        studioSettings = storage.getSettings();
        loadCustomKits();

        const blocks = parseDocument(committedAbout);
        const documentMeta = parseDocumentMeta(committedAbout);
        state = {
            blocks,
            selectedId: blocks[0]?.id || null,
            theme: documentMeta.theme,
            canvas: documentMeta.canvas,
            groups: documentMeta.groups
        };
        pruneEmptyGroups();

        root = document.createElement('div');
        root.id = 'obelisk-studio';
        root.className = 'obelisk-studio';
        root.style.setProperty('--obelisk-accent', options?.accent || storage.getAccent() || '#5da9ff');
        root.innerHTML = studioMarkup(options?.accent || storage.getAccent() || '#5da9ff');
        applyStudioUiSettings();

        if (!studioSettings.studioAnimations) {
            root.classList.add('obelisk-studio-reduced-motion');
            root.querySelector('[data-studio-motion]')?.classList.add('is-off');
        }

        document.body.appendChild(root);
        document.documentElement.classList.add('obelisk-studio-active');
        document.addEventListener('keydown', onStudioKeydown, true);

        wireStudio();
        renderAll();

        requestAnimationFrame(() => {
            root?.classList.add('obelisk-studio-visible');
        });

        await ensurePreview(token);
    };

    const requestClose = () => {
        if (!root) {
            return;
        }

        if (dirty) {
            const discard = window.confirm(
                'Obelisk Studio has unapplied changes.\n\nOK = discard them and restore the last applied Edit about content.\nCancel = keep Studio open.'
            );

            if (!discard) {
                return;
            }

            setAboutEditorValue(committedAbout, { sanitize: false });
        }

        close();
    };

    const close = () => {
        if (!root) {
            return;
        }

        if (root.querySelector('[data-studio-kit-browser]')?.classList.contains('is-open')) {
            closeKitBrowser();
        }

        const closingRoot = root;
        root = null;
        openToken += 1;

        restorePreview();
        document.removeEventListener('keydown', onStudioKeydown, true);
        document.documentElement.classList.remove('obelisk-studio-active');

        closingRoot.classList.remove('obelisk-studio-visible');
        closingRoot.classList.add('obelisk-studio-closing');

        const duration = studioSettings?.studioAnimations ? 360 : 0;
        setTimeout(() => closingRoot.remove(), duration);

        state = null;
        undoStack = [];
        redoStack = [];
    };


    window.Obelisk.studio = {
        open,
        close: requestClose,
        isOpen: () => Boolean(root),
        compileDocument,
        parseDocument
    };

})();
