/*
Fetch full Pokémon list from PokeAPI and write CSV to data/pokemon_list.csv
Run with: node scripts/fetch_pokemon_list.js
Requires internet access.
*/
const https = require('https');
const fs = require('fs');
const url = 'https://pokeapi.co/api/v2/pokemon?limit=100000&offset=0';
https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try{
      const j = JSON.parse(data);
      const rows = [['id','name','url']];
      j.results.forEach(item => {
        // extract id from url
        const m = item.url.match(/\/pokemon\/(\d+)\/?$/);
        const id = m ? m[1] : '';
        rows.push([id, item.name, item.url]);
      });
      const csv = rows.map(r=>r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(',')).join('\n');
      fs.mkdirSync('data', { recursive: true });
      fs.writeFileSync('data/pokemon_list.csv', csv, 'utf8');
      console.log('Wrote data/pokemon_list.csv');
    }catch(e){ console.error('Parse error', e); }
  });
}).on('error', (e) => { console.error('Request error', e); process.exit(1); });
