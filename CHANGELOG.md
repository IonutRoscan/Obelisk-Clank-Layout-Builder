# Changelog

## 2.1.0 — Studio Update — 2026-09-16

### Added

- Obelisk Studio visual profile editor.
- Live preview using ClankWorld's own renderer.
- Drag-and-drop layer reordering.
- Layer visibility, duplicate, delete, Undo, and Redo controls.
- Layer Groups with collapse, whole-group movement, visibility, rename, and dissolve actions.
- Resizable Studio side panels and adjustable Studio text scale.
- Obsidian, Midnight, and Graphite Studio workspace skins.
- Global Studio theme system with 21 built-in themes.
- Profile Frame as Studio's document-aware counterpart to Profile Canvas.
- 10 flexible Profile Kits.
- 10 Signature / Showcase kits.
- Multi-character Cast component with configurable names, roles, portraits, and notes.
- Optional music component with SoundCloud support.
- Save Current as a reusable Custom Kit.
- Custom-kit JSON export/import.
- Portable `OBELISK-KIT-V1` share codes.
- Studio Tool Vault exposing all 50 insertable compact-panel tools.
- Profile Canvas, advanced Section Header, Archive Group, and Live Input Field tools.
- More precise character-edit route detection.

### Changed

- Studio-generated documents now include invisible metadata so layers, groups, themes, tool settings, and layout structure can be reconstructed later.
- Existing non-Studio profiles are imported conservatively as Raw Content.
- Profile backgrounds are now better represented by Profile Canvas / Profile Frame, while viewport-wide Page Background remains marked experimental.
- Source comments were cleaned for public-repository use and development-only pass banners were removed.
- Manifest description and extension action label were refreshed for the 2.1 release.

### Fixed

- Studio Appearance controls no longer sit underneath the docked Clank preview; the preview is temporarily hidden while full Studio overlays are open.
- Profile Preview integration keeps Clank's renderer in its original React-owned DOM location instead of moving the iframe.

## 2.0.x

- Established the original Obelisk quick-tool panel and layout-generator library that 2.1 builds on.
