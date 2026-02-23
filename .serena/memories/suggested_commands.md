# Suggested Commands

## Build
```bash
npm run build          # Build with Parcel (outputs to dist/)
```

## Install Dependencies
```bash
npm install            # Install devDependencies (parcel-bundler, static-files-copy plugin)
```

## Development
There is no dev server or watch mode configured. To test locally:
1. Run `npm run build`
2. Go to `chrome://extensions/` in Chrome
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` directory

## Testing
No test framework or test scripts are configured.

## Linting / Formatting
No linter or formatter is configured.

## CI/CD
- Automatic publish to Chrome Web Store on push to `master` branch via GitHub Actions

## System Commands (macOS / Darwin)
- `git` - Version control
- `ls` - List directory contents
- `cd` - Change directory
- `grep` / `rg` - Search file contents
- `find` - Find files
- `zip` - Create ZIP archives
