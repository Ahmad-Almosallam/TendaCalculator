---
name: run-dev
description: Start the TendaCalculator Vite dev server in the background and report the local URL. Use when asked to run, start, or preview the app.
---

# Run the dev server

1. Check nothing is already listening: `Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue`. If something is, the app is probably already running at http://localhost:5173 — just report that.
2. Start in the background (PowerShell tool with `run_in_background: true`):
   ```
   npm run dev
   ```
3. Wait for the `Local: http://localhost:5173/` line in the background output, then report that URL to the user.
4. Vite has HMR — after code edits the browser updates itself; do NOT restart the server for code changes. Only restart after changing `vite.config.ts` or installing dependencies.
5. To stop: kill the background task (TaskStop) or `Get-Process node | Stop-Process` as a last resort (warns: kills all node processes).

Notes:
- The app persists state in localStorage (`tenda-calculator-v1`). To test from a clean slate, use the in-app Reset button or an incognito window.
- The Customs step fetches the EUR→SAR rate from the internet on first load; offline it shows a warning and the rate can be entered manually.
