# Code Style and Conventions

## JavaScript
- **Vanilla JS** (no TypeScript, no frameworks)
- **ES2017+**: Uses `async/await`, arrow functions, `const`/`let` (no `var`)
- **Naming**: camelCase for variables and functions
- **Strings**: Double quotes (`"..."`)
- **Indentation**: 2 spaces
- **Semicolons**: Inconsistent - `popup.js` omits them, `background.js` uses them. No enforced style.
- **No module system**: Scripts are loaded directly via `<script>` tags
- **Comments**: Sparse, only where logic needs explanation

## HTML
- Standard HTML5 structure
- No templating engines
- Scripts loaded at bottom of `<body>`

## CSS
- Plain CSS (no preprocessors)
- BEM-like naming not used; simple class names (`.switch`, `.slider`)
- Vendor prefixes included manually (`-webkit-`, `-ms-`)

## No Configured Tools
- No ESLint, Prettier, or other code quality tools
- No test framework
- No type checking
