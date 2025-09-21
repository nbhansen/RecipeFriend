# Release Summary

## v1.0.2 (2025-09-21)

- Chrome MV3 stabilization
  - Switched fully to the official webextension polyfill
  - Unified messaging (promise-based onMessage handlers)
  - Defensive tab handling in popup; added Diagnostics flow
  - Recent history in popup (stores last 5 recipes locally)
- Gemini integration hardening
  - Enforced JSON-only responses; parsing handles fenced blocks and minor repairs
  - Input truncation + retry for MAX_TOKENS responses; support for inline_data JSON
- Readability
  - Vendored and loaded via manifest before content.js
- Docs & repo
  - Single README focused on MV3 with load/test/debug
  - Marked Firefox MV2 code as legacy; removed deprecated test/setup scripts
  - .gitignore updated for icons and packaging artifacts

Notes:
- Legacy Firefox MV2 remains under `extension/` for reference. Primary build is in `extension-chrome/`.
