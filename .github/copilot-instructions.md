# DuoFarmer Minimal - AI Coding Instructions

## Project Overview
This is a minimal userscript for automating resource farming in Duolingo. Built with Vite + vite-plugin-monkey, it generates a `.user.js` file for browser extensions like Tampermonkey. The script injects a shadow DOM UI and automates API calls to farm gems, XP, and streaks.

## Architecture
- **Entry Point**: `src/main.js` - Initializes shadow DOM UI, handles events, and orchestrates farming loops.
- **UI Layer**: `src/main.html` (template) + `src/main.css` (styles) - Minimal dark-themed interface with floating button, user info table, and farming options.
- **API Layer**: `src/service/api.js` - `ApiService` class manages all Duolingo API interactions (sessions, rewards, stories).
- **Utilities**: `src/utils/utils.js` - JWT handling, delays, logging (GM_log fallback).
- **Build Config**: `vite.config.mjs` - Monkey plugin config for userscript metadata and matching URLs.
- **Standalone Scripts**: `script/` - Node.js scripts for testing (e.g., `gems.js` for gem farming loops).

## Key Patterns
- **Import Assets**: Use Vite queries for raw/inline: `import templateRaw from './main.html?raw'; import cssText from './main.css?inline';`
- **Shadow DOM UI**: Create isolated UI with `container.attachShadow({ mode: 'open' })` to avoid conflicts with Duolingo's page.
- **Farming Loops**: Async loops with `delay(DELAY)` (500ms) between API calls. Example in `src/main.js`:
  ```javascript
  while (isRunning) {
    await apiService.farmGemOnce(userInfo);
    updateFarmResult('gem', 30);
    await delay(DELAY);
  }
  ```
- **JWT Handling**: Extract from cookies: `document.cookie.split(';')`, decode payload for user sub.
- **API Requests**: Use `fetch` with Bearer auth headers. Example in `src/service/api.js`:
  ```javascript
  const res = await fetch(url, { method, headers, body: JSON.stringify(payload) });
  ```
- **Options Array**: Define farming types in `src/main.js`:
  ```javascript
  const OPTIONS = [
    { type: 'gem', label: 'Gem 30', value: 'fixed', amount: 30 },
    { type: 'xp', label: 'XP 10 (session)', value: 'session', amount: 10 }
  ];
  ```

## Workflows
- **Development**: `npm run dev` - Starts Vite dev server for hot-reload.
- **Build**: `npm run build` - Generates `duofarmer.user.js` in dist/.
- **Preview**: `npm run preview` - Serves built userscript for testing.
- **Testing**: No formal tests; manually test by installing `.user.js` in browser and running on Duolingo pages.
- **Debugging**: Use `GM_log` for userscript logging; fallback to `console.log`. Check network tab for API responses.

## Conventions
- **Error Handling**: Log errors with `logError(err, context)`; disable UI on failures.
- **State Management**: Global vars like `isRunning`, `userInfo`; update UI via DOM manipulation.
- **Dependencies**: Minimal - only Vite and vite-plugin-monkey. No external libs for core logic.
- **File Structure**: Keep API logic in `service/`, utils in `utils/`, standalone scripts in `script/`.
- **Risk Awareness**: Include ban risk warnings in UI (e.g., "High ban risk! Use with caution.").

## Integration Points
- **Duolingo API**: Endpoints like `/sessions`, `/users/{sub}/rewards`, `/stories/{id}/complete`.
- **Browser Context**: Access cookies, DOM; use shadow DOM for UI isolation.
- **External Links**: Reference Greasyfork, Telegram (@duofarmer), homepage in UI.

## AI Agent Guidelines
- **No Emojis in Code**: Absolutely avoid using emojis when creating or editing code.
- **Do Not Auto-Edit**: Do not automatically modify code unless explicitly requested by the user, typically when their message contains words like "sửa" (fix), "tạo" (create), or related terms.
- **Minimal Comments**: Limit code comments; only add them where logic is complex or non-obvious.

Focus on minimal, efficient code. Avoid over-engineering; prioritize API reliability and UI responsiveness.