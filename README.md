# PokéFavor v2.2 — v2.2 Update

This v2.2 build includes:
- Fixed swipe behavior: no snapback when a vote is cast; card exits fully before next appears.
- Faster & snappier exit animation.
- Instant gradients based on primary type (static mapping).
- Type icons pulled from Bulbapedia archived images (referenced locally as URLs).
- Larger font sizes for readability.
- Save & Load system (manual + auto-save).
- Script to fetch full Pokémon list as CSV for editing/exclusions: `npm run fetch-list` (requires node and internet).

## Run locally
Requirements: Node.js 18+ and npm
1. Unzip the folder.
2. In terminal, run:
   npm install
   npm run dev
3. In another terminal, to fetch the full Pokemon CSV list (optional):
   npm run fetch-list
   This will create `data/pokemon_list.csv` with `id,name,url` for every Pokemon from PokeAPI.

## Deploy
Push to GitHub and connect to Vercel. Build command: `npm run build`, publish `dist`.
