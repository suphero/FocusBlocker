# Task Completion Checklist

When a coding task is completed, follow these steps:

1. **Build**: Run `npm run build` to ensure the project builds without errors
2. **Manual test**: Since there are no automated tests, remind the user to test manually by loading the extension in Chrome
3. **Version**: If the change is user-facing, consider bumping the version in both `package.json` and `static/manifest.json` (they should stay in sync)
4. **CI/CD awareness**: Pushing to `master` triggers automatic publish to Chrome Web Store
