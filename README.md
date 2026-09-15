# Obelisk — Clank Layout Builder

Obelisk is a free browser extension for visually building and styling **ClankWorld character profiles**.

It can be used as a quick layout-tool panel or as a full visual editor through **Obelisk Studio**. Studio lets creators arrange profile sections, edit them without touching generated markup, preview through ClankWorld's real renderer, apply themes and profile kits, and save reusable custom kits.

> **Version:** 2.1.0 — Studio Update  
> **Platform:** Manifest V3 browser extension  
> **License:** MIT

Obelisk is an independent community project and is not affiliated with ClankWorld.

## Highlights

- **Obelisk Studio** — full-screen visual profile editor.
- **Live Clank preview** — Studio uses ClankWorld's own profile renderer instead of a fake local preview.
- **Drag-and-drop reordering** — move profile pieces without cutting and pasting generated code.
- **Layer Groups** — collapse, move, hide, rename, or dissolve groups of related layers.
- **Undo / Redo** — Studio-level history for layout and property changes.
- **50 quick tools + Profile Frame** — the original panel remains available for fast insertions.
- **21 built-in themes** — including Database, Gothic, Terminal, Fantasy, Horror, Y2K, Editorial, Dreamcore, Fashion, Spacecraft, and more.
- **20 built-in profile kits** — 10 flexible Profile Kits and 10 more art-directed Signature / Showcase kits.
- **Custom kits** — save the current Studio document as a reusable kit.
- **Kit sharing** — export `.obelisk-kit.json` files or copy/paste portable `OBELISK-KIT-V1` share codes.
- **Multi-character Cast blocks** — configure names, roles, portraits, notes, and ordering for 1–8 characters.
- **Optional music** — SoundCloud-backed music blocks and media-oriented Signature kits.
- **Existing-profile safety** — older profiles are imported conservatively as Raw Content rather than being destructively reinterpreted.
- **Resizable Studio UI** — change text size, side-panel width, workspace skin, and animation preference.

## Profile Kits

Normal Profile Kits are intended as editable starting structures. Every generated part becomes an ordinary Studio layer that can be reordered, edited, duplicated, hidden, deleted, regrouped, or recolored.

### Flexible Profile Kits

- City Database
- Gothic Archive
- Fantasy Tome
- Cyber Terminal
- Visual Novel
- Horror Case File
- Soft Social
- Y2K / Old Web
- Minimal Editorial
- Character Wiki

### Signature / Showcase Kits

Signature kits are more heavily art-directed and can combine motion, interactive elements, media, optional music, multi-character layouts, and original Obelisk tools.

- Emergency Broadcast
- Haunted VHS
- RPG Save File
- Cyber OS
- Stage / Artist Profile
- Occult Archive
- Dreamcore Scrapbook
- Dark Fashion Editorial
- Spacecraft / AI Terminal
- Crime Scene Board

Signature kits are still editable. They are not locked templates.

## Installation

### Chrome, Brave, Edge, and other Chromium browsers

1. Download `Obelisk-2.1.0.zip` from the GitHub Release.
2. Extract the ZIP to a folder.
3. Open your browser's extensions page:
   - Chrome: `chrome://extensions`
   - Brave: `brave://extensions`
   - Edge: `edge://extensions`
4. Enable **Developer mode**.
5. Choose **Load unpacked**.
6. Select the extracted Obelisk folder containing `manifest.json`.

When updating an unpacked copy, replace the old files and press **Reload** on the extension card.

### Firefox

For local testing:

1. Extract the release ZIP.
2. Open `about:debugging#/runtime/this-firefox`.
3. Choose **Load Temporary Add-on**.
4. Select Obelisk's `manifest.json`.

Temporary add-ons are removed when Firefox restarts. Permanent Firefox distribution requires a signed add-on package.

## Using Obelisk

ClankWorld exposes the **Edit about** profile editor after a character has been published at least privately. A typical supported page looks like:

```text
https://www.clank.world/edit/@c/character-slug
```

Once on a supported edit page:

1. Click the **Obelisk** button.
2. Use the compact panel for a quick insertion, or choose **Open Studio**.
3. In Studio, add components or load a Profile Kit.
4. Reorder layers by dragging them or using the layer controls.
5. Select a layer to edit its properties in the Inspector.
6. Use **Apply to Clank** when the layout is ready.
7. Save the character normally using ClankWorld's own controls.

Studio temporarily mirrors the working document into `Edit about` so ClankWorld can render the live preview. **Apply to Clank** marks that working document as the version to keep; closing and discarding restores the previously applied content.

## Studio workflow

Studio is built around three areas:

- **Layers** — profile structure, visibility, order, grouping, duplication, deletion, and original-tool access.
- **Live Preview** — ClankWorld's real renderer, visually docked into the Studio workspace.
- **Inspector** — editable properties for the selected layer or original Obelisk tool.

### Themes vs kits

A **Theme** controls shared visual tokens such as accent, background, surface, text, border, muted color, and radius.

A **Kit** controls profile structure: which sections exist, which components they contain, and their starting arrangement.

They can be mixed. For example, a City Database layout can be restyled with a Gothic or Terminal theme, while individual layers can opt out of global theme values and use custom styling.

### Layer Groups

Groups are organizational containers inside Studio. They do not add visible markup by themselves.

A group can be:

- renamed;
- collapsed or expanded;
- moved as one section;
- hidden together with its children;
- dissolved without deleting its layers.

Built-in Profile Kits create sensible groups automatically.

### Custom kits and sharing

Choose **Kits → Save Current** to capture the current Studio document as a local custom kit.

Custom kits preserve:

- layer order;
- groups;
- component properties;
- original Obelisk tool settings;
- Cast entries;
- hidden state;
- theme values;
- Profile Frame settings.

They can be shared in two ways:

- export a `.obelisk-kit.json` file;
- copy an `OBELISK-KIT-V1:...` share code.

Imported kits receive new internal identifiers where needed so they do not collide with content already in the document.

## Tool library

The compact Obelisk panel contains 51 current features: **50 insertable tools plus Profile Canvas**. Studio exposes the 50 insertable panel tools through the Tool Vault, while Profile Canvas is represented by Studio's document-aware **Profile Frame**.

Tools cover categories such as:

- layout and profile structure;
- images and media;
- character relationships and dialogue;
- lore and timelines;
- stats and data displays;
- callouts, warnings, and terminal logs;
- social/chat-style components;
- styled text and themed blocks;
- interactive hosted widgets.

Some tools are explicitly marked **Experimental** because they depend on browser or ClankWorld rendering behavior that may change.

## Compatibility and limitations

Obelisk works inside the capabilities of ClankWorld's Markdown/rehype/HTML rendering pipeline. It cannot bypass restrictions imposed by ClankWorld or the browser.

A few practical limitations:

- ClankWorld can change its editor or preview DOM at any time. A site redesign may require an Obelisk update.
- Browser autoplay policies can prevent audio from starting automatically; Obelisk does not force autoplay.
- External media embeds depend on their respective providers and on ClankWorld allowing the resulting iframe or resource.
- Experimental viewport effects such as **Page Background** are less reliable than Studio's Profile Frame / Profile Canvas approach.
- Native inputs can be typeable without having a backend. A visual button does not imply data is submitted or saved.

## External resources used by optional components

Obelisk itself does not use analytics and does not make profile-data API requests. Preferences and custom kits are stored locally in the browser.

Generated layouts may load external resources when the creator chooses to use them, including:

- Google Fonts;
- SoundCloud embeds;
- Sketchfab embeds;
- creator-supplied image/GIF URLs;
- Obelisk's hosted Photo Plane / Hotspot viewer on GitHub Pages.

Custom-kit share codes contain the kit data being shared. They do not contain ClankWorld account credentials.

## Project structure

```text
.
├── manifest.json
├── content.js
├── style.css
├── icon16.png
├── icon32.png
├── icon48.png
├── icon128.png
├── momoi-dancing-avatar.gif
└── js/
    ├── core.js
    ├── storage.js
    ├── fonts.js
    ├── modal.js
    ├── controllers.js
    ├── tool-meta.js
    ├── studio.js
    ├── panel.js
    └── tools/
        ├── basic.js
        ├── profile.js
        ├── character.js
        ├── lore.js
        ├── themes.js
        ├── media.js
        ├── interactive.js
        └── social.js
```

## Development

There is no build step. Obelisk is intentionally plain JavaScript, CSS, and a Manifest V3 manifest.

To work on it locally:

1. Clone or download the repository.
2. Load the repository folder as an unpacked extension.
3. Edit the source files directly.
4. Reload the extension from the browser extensions page.
5. Refresh the ClankWorld character edit page.

The source is split by responsibility rather than bundled. Comments focus on behavior that is not obvious from the code, especially ClankWorld integration, Studio metadata, preview docking, persistence, and hosted interactive components.

Before publishing a change, at minimum verify:

```bash
node --check content.js
node --check js/*.js
node --check js/tools/*.js
```

On shells that do not expand wildcards for Node, run `node --check` once for each JavaScript file.

## Reporting bugs

When reporting an issue, include:

- browser and version;
- whether the character is private or public;
- whether the problem occurs in the compact panel, Studio, or both;
- the tool / kit / Signature kit involved;
- a screenshot or Console error when available;
- whether the same profile renders incorrectly in ClankWorld's normal Preview.

Avoid posting private character content if it is not needed to reproduce the bug.

## License

Obelisk is released under the [MIT License](LICENSE).
