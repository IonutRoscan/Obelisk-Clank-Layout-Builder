/**
 * Tool Metadata Registry
 *
 * Describes how tools appear inside the Obelisk interface.
 *
 * This file does not contain tool behavior or output generation.
 * It only provides the information the panel needs to organize,
 * display and search tools.
 *
 * Metadata fields:
 *
 *   category
 *     Determines which section the tool appears under.
 *
 *   icon
 *     Symbol shown on the tool card.
 *
 *   description
 *     Short explanation shown beneath the tool name and used by search.
 *
 * Future display-only metadata such as badges, keywords or capability
 * flags can also live here without changing the actual tool logic.
 *
 * Exposes:
 *   window.Obelisk.meta
 *
 * Loaded before:
 *   content.js
 */

(() => {

    'use strict';

    window.Obelisk =
        window.Obelisk || {};

    // Tool registry

    window.Obelisk.meta = {

        '✦ Divider': {
            category: 'DECORATION',
            icon: '✦',
            description:
                'Create an elegant visual section divider.'
        },

        '▰ Profile Canvas': {
            category: 'LAYOUT',
            icon: '▰',
            description:
                'Wrap the whole About profile in a safe inline-styled background shell with border, radius and spacing controls.'
        },

        '⌁ Section Header': {
            category: 'DECORATION',
            icon: '⌁',
            description:
                'Create database, dossier and centered hairline section dividers with real flexbox lines.'
        },

        '▤ Archive Group': {
            category: 'CONTENT',
            icon: '▤',
            description:
                'Build an ordered group of real click-to-open dropdowns, with up/down controls and responsive columns.'
        },

        '⌨ Live Input Field': {
            category: 'INTERACTIVE',
            icon: '⌨',
            description:
                'EXPERIMENTAL: Insert a real browser input visitors can type into. Its button is visual only and does not submit or save.'
        },

        '▣ Framed Image': {
            category: 'MEDIA',
            icon: '▣',
            description:
                'Create a polished framed image block.'
        },

        '▦ Card Grid': {
            category: 'LAYOUT',
            icon: '▦',
            description:
                'Build a grid of styled information cards.'
        },

        '◈ Stat / Skill Bar': {
            category: 'DATA',
            icon: '◈',
            description:
                'Create a visual stat or skill meter.'
        },

        '❝ Quote': {
            category: 'TEXT',
            icon: '❝',
            description:
                'Create a dramatic quote block.'
        },

        '⌄ Accordion': {
            category: 'CONTENT',
            icon: '⌄',
            description:
                'Create a collapsible lore section.'
        },

        '⚠ Warning Box': {
            category: 'CALLOUT',
            icon: '⚠',
            description:
                'Create a high-visibility warning panel.'
        },

        '♡ Relationship': {
            category: 'CHARACTERS',
            icon: '♡',
            description:
                'Create a character relationship card.'
        },

        '◌ Dialogue': {
            category: 'DIALOGUE',
            icon: '◌',
            description:
                'Build a two-sided dialogue exchange.'
        },

        '♙ Character Header': {
            category: 'CHARACTERS',
            icon: '♙',
            description:
                'Create a dramatic character introduction.'
        },

        '◆ Badge / Tag': {
            category: 'CHARACTERS',
            icon: '◆',
            description:
                'Create a compact title or classification tag.'
        },

        '▤ Lore Entry': {
            category: 'CONTENT',
            icon: '▤',
            description:
                'Create a polished lore or biography panel.'
        },

        '◷ Timeline Event': {
            category: 'CONTENT',
            icon: '◷',
            description:
                'Create a chronological story event.'
        },

        '✦ Scene Header': {
            category: 'DIALOGUE',
            icon: '✦',
            description:
                'Create a cinematic scene transition.'
        },

        '>_ Terminal Log': {
            category: 'CALLOUT',
            icon: '>_',
            description:
                'Create a futuristic system or terminal log.'
        },

        '▥ Stat Sheet': {
            category: 'DATA',
            icon: '▥',
            description:
                'Create a complete multi-stat character sheet.'
        },

        '▣ Classified File': {
            category: 'CALLOUT',
            icon: '▣',
            description:
                'Create a classified dossier-style information block.'
        },

        '🎀 Cutecore Box': {
            category: 'THEMES',
            icon: '🎀',
            description:
                'A soft, pastel panel with rounded edges and dotted borders.'
        },

        '💌 Romance Letter': {
            category: 'THEMES',
            icon: '💌',
            description:
                'An elegant, cursive love letter format with soft styling.'
        },

        '👁️ Abyssal Log': {
            category: 'THEMES',
            icon: '👁️',
            description:
                'A jarring, cosmic horror block with deep shadows and blood accents.'
        },

        '📝 Styled Text': {
            category: 'TEXT',
            icon: '📝',
            description:
                'A custom text block with font, size, and alignment controls.'
        },

        '💿 Now Playing': {
            category: 'MEDIA',
            icon: '💿',
            description:
                'A stylized visual music player for character theme songs.'
        },

        '✨ Gradient Text': {
            category: 'DECORATION',
            icon: '✨',
            description:
                'Create beautiful, multi-color holographic text effects.'
        },

        '🚨 Scrolling Ticker': {
            category: 'CALLOUT',
            icon: '🚨',
            description:
                'An animated, scrolling marquee banner for alerts or news.'
        },

        '🎛️ Producer Tracklist': {
            category: 'MEDIA',
            icon: '🎛️',
            description:
                'A stylized album tracklist for EPs or beat tapes.'
        },

        '⚙️ Mod Loadout': {
            category: 'DATA',
            icon: '⚙️',
            description:
                'A structured node tree for loadouts, mods, or cybernetics.'
        },

        '🎵 SoundCloud Player': {
            category: 'MEDIA',
            icon: '🎵',
            description:
                'EXPERIMENTAL: Injects an actual playable SoundCloud widget.'
        },

        '🧊 Sketchfab Model': {
            category: 'MEDIA',
            icon: '🧊',
            description:
                'EXPERIMENTAL: Injects an interactive, spinnable Sketchfab 3D model viewer.'
        },

        '🎇 Cinematic GIF Box': {
            category: 'MEDIA',
            icon: '🎇',
            description:
                'A lore box with an animated GIF background overlay.'
        },

        '🃏 3D Hologram Card': {
            category: 'MEDIA',
            icon: '🃏',
            description:
                'Tilts an image in 3D space to look like a physical trading card.'
        },

        '🌀 Spinning Photo Plane': {
            category: 'MEDIA',
            icon: '🌀',
            description:
                'Interactive 3D photo plane with drag, touch, tilt and zoom — works standalone after insertion.'
        },

        '🗺️ Interactive Hotspot Image': {
            category: 'MEDIA',
            icon: '🗺️',
            description:
                'Zoomable image with clickable lore hotspots — standalone on desktop and mobile.'
        },

        '🎮 Engine Inspector': {
            category: 'DATA',
            icon: '🎮',
            description:
                'A technical stat block styled like a game engine UI.'
        },

        '💬 Chat Thread': {
            category: 'SOCIAL',
            icon: '💬',
            description:
                'A texting/DM-style message thread with left/right bubbles.'
        },

        '📷 Memory Polaroid': {
            category: 'MEDIA',
            icon: '📷',
            description:
                'A tilted polaroid-style photo with a handwritten caption.'
        },

        '💞 Pet Name Tag': {
            category: 'CHARACTERS',
            icon: '💞',
            description:
                'A small rounded nickname tag for pet names and endearments.'
        },

        '💘 Compatibility Meter': {
            category: 'DATA',
            icon: '💘',
            description:
                'A romantic-styled percentage meter for shipping or relationship stats.'
        },

        '😂 Meme Caption': {
            category: 'MEDIA',
            icon: '😂',
            description:
                'Classic top/bottom impact-font meme caption over an image.'
        },

        '🔔 Fake Notification': {
            category: 'SOCIAL',
            icon: '🔔',
            description:
                'A mock phone notification popup for comedic or in-universe alerts.'
        },

        '🏆 Achievement Unlocked': {
            category: 'CALLOUT',
            icon: '🏆',
            description:
                'A game-style achievement popup banner.'
        },

        '👁️‍🗨️ Spoiler Reveal': {
            category: 'CONTENT',
            icon: '👁️‍🗨️',
            description:
                'A click-to-reveal spoiler block for plot twists and secrets.'
        },

        '🚩 Content Warning': {
            category: 'CALLOUT',
            icon: '🚩',
            description:
                'A standardized content/trigger warning tag list.'
        },

        '💭 OOC Note': {
            category: 'CALLOUT',
            icon: '💭',
            description:
                'A muted, bracketed out-of-character note for RP context.'
        },

        '📌 Evidence Board': {
            category: 'LAYOUT',
            icon: '📌',
            description:
                'A corkboard of pinned, handwritten note cards for mysteries and drama.'
        },

        '🌌 Page Background': {
            category: 'DECORATION',
            icon: '🌌',
            description:
                'EXPERIMENTAL VIEWPORT BACKGROUND: paints behind the whole Clank page using position:fixed. For reliable profile-only backgrounds, use Profile Canvas.'
        },

        '💓 Pulse Indicator': {
            category: 'DECORATION',
            icon: '💓',
            description:
                'A small live/status badge with a real SVG pulse-ring animation.'
        },

        '🖱️ Hover Reveal Card': {
            category: 'CONTENT',
            icon: '🖱️',
            description:
                'A card that swaps its text on hover via real CSS — distinct from the click-based Spoiler Reveal.'
        }

    };

})();