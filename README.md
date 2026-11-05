# Piso Pulse — Liquid Glass Website

A website-only monthly allowance and personal budget tracker built with HTML, CSS, and vanilla JavaScript. It uses a soft, layered translucent glass interface inspired by Apple's Liquid Glass visual language. It is an original web design, not an Apple product or an exact reproduction of an unreleased iOS version.

## Run locally
1. Extract the ZIP archive.
2. Open `index.html` in a modern browser.

Optional local server:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

## Publish online
Upload `index.html`, `styles.css`, and `app.js` to a static hosting provider such as GitHub Pages, Netlify, or Cloudflare Pages.

## Features
- Monthly allowance and spending budget per month
- Income and expense logging, editing, deleting, search, and filters
- Custom expense categories and per-category budget limits
- Daily suggested spending allowance based on remaining balance and days left
- Savings goals with contributions and progress
- Monthly recurring transaction entries
- Spending breakdown, budget alerts, and six-month income/expense chart
- Reports with average daily spending, largest expense, and saving rate
- Light/dark glass appearance and accent color preferences
- JSON backup export/import and CSV transaction export
- Responsive layouts for desktop, tablet, and mobile browsers
- Philippine Peso (PHP / ₱) formatting

## Data and privacy
All tracker information is stored in browser `localStorage`. It is not uploaded to a server, synced between devices, or connected to bank accounts. Export a JSON backup before clearing browser data or changing devices. Importing a backup replaces the current local tracker data.

## Website-only
No APK, Android Studio, Capacitor, or native app packaging is included.
