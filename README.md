# PokéFavor — Final (Polished Swipe Edition)

This is a polished, mobile-first PokéFavor voting app built with React + Vite.
It includes:
- Touch & pointer swipe gestures + desktop arrow keys
- Low-res blur-up placeholders and preloading for instant-feel swipes
- WebAudio-generated swipe sounds (no external files)
- Mobile vibration support (if available)
- Light/Dark modes and app settings persisted to localStorage
- Exportable saved winners
- Clear deployment instructions for GitHub → Vercel / Netlify

---

## Quick start (run locally)

Requirements:
- Node.js 18+ and npm

1. Unzip the project folder.
2. Open terminal in the project directory.
3. Install dependencies:
```bash
npm install
```
4. Run dev server:
```bash
npm run dev
```
5. Open the local URL printed in the terminal (usually http://localhost:5173)

---

## Deploy (no coding) — recommended: Vercel

1. Create a GitHub account (if you don't have one).
2. Create a new repository (e.g., `pokefavor`) on GitHub.
3. Upload all project files (you can drag-and-drop the unzipped project into the repo via the web UI).
4. Go to https://vercel.com, sign up with GitHub, click "Add New" → Import Git Repository → select your repo.
5. Use default build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
6. Click Deploy. Vercel will build and give you a live URL.

### Alternative: Netlify
1. Go to https://app.netlify.com and sign up with GitHub.
2. Click "Add new site" → "Import from Git" → select your repo.
3. Use build command `npm run build` and publish directory `dist`.
4. Deploy.

---

## Project notes & tips

- The app fetches Pokémon metadata from the PokeAPI at runtime. This keeps the bundle light.
- If you want an offline package (no API calls), contact me and I’ll produce a static JSON snapshot of all Pokémon to bundle.
- If you want extra polish (shareable short links, account support, analytics), I can add a tiny backend (Node/Express) and CI settings.

---

## Support

If anything goes wrong during install or deployment, paste the terminal output here and I'll walk you through it step-by-step.
