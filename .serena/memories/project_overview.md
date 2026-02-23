# FocusBlocker - Project Overview

## Purpose
Chrome extension (Manifest V3) that blocks specified websites to help users stay focused and increase productivity. Users can toggle blocking on/off and manage a list of blocked domains via a popup UI.

## Tech Stack
- **Language**: Vanilla JavaScript (ES2017+, async/await)
- **Bundler**: Parcel v1 (`parcel-bundler@^1.12.5`)
- **Static files**: Copied via `parcel-plugin-static-files-copy`
- **Chrome APIs**: `chrome.storage.local`, `chrome.tabs`, `chrome.action`, `chrome.runtime`
- **Manifest**: V3 with `service_worker` background
- **No frameworks/libraries**: Pure vanilla JS, HTML, CSS

## Project Structure
```
FocusBlocker/
├── src/                    # JavaScript source files
│   ├── background.js       # Service worker: tab listeners, blocking/unblocking logic, icon changes
│   ├── popup.js            # Popup UI logic: load/save settings
│   └── blocked.js          # Blocked page: shows original URL link
├── static/                 # Static assets (copied to dist as-is)
│   ├── manifest.json       # Chrome extension manifest v3
│   ├── popup.html          # Popup UI
│   ├── popup.css           # Popup styles
│   ├── blocked.html        # Blocked website page
│   └── images/             # Extension icons (enabled/disabled/logo in 16/32/48/128px)
├── dist/                   # Build output (gitignored)
├── .github/workflows/      # CI/CD
│   └── publish.yml         # Auto-publish to Chrome Web Store on push to master
├── package.json
└── Readme.md
```

## CI/CD
- GitHub Actions workflow on push to `master`
- Builds with `npm install && npm run build`
- Zips `dist/` and uploads to Chrome Web Store using `chrome-extension-upload` action
- Extension ID: `hafibifkmnaepcndbbionnhdcgkonmfj`

## Key Architecture
- **background.js**: Core logic. Listens to `tabs.onActivated`, `tabs.onUpdated`, and `storage.onChanged`. Redirects blocked sites to `blocked.html?url=<encoded-url>`. On disable, redirects blocked pages back to original URLs. Changes action icon based on enabled/disabled state.
- **popup.js**: Simple form that loads/saves `enabled` (boolean) and `websites` (array) from `chrome.storage.local`.
- **blocked.js**: Reads `url` query param and displays a link to the original URL.
- Default blocked sites on install: facebook.com, x.com, instagram.com, youtube.com, whatsapp.com
