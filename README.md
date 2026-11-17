# Book Tracker

Mobile-first personal reading shelf built with React, Vite, TypeScript, and MUI.

## Features

- **My Shelf** — two-column cover cards with Want / Reading / Finished
- **Search** — Open Library title/author search, add with cover art
- **Discover** — NYT Best Sellers lists (Fiction, Nonfiction, Paperback, YA, Advice)
- **Settings** — each user pastes their own NYT Books API key (stored in `localStorage`)

Default status for newly added books is **Want**. Shelf data persists in the browser.

## Develop

```bash
npm install
npm run dev
```

NYT requests go through the Vite proxy at `/api/nyt` to avoid CORS issues.

## Production-style serve (static + NYT proxy)

```bash
npm run build
npm start
```

## NYT API key

1. Create a free key at [developer.nytimes.com](https://developer.nytimes.com/get-started)
2. Enable the **Books API**
3. Paste the key in the app’s **Settings** tab
