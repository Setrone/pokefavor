import React, { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import SwipeCard from './components/SwipeCard';
import Results from './components/Results';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const ARTWORK = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

function isExcluded(name) {
  const s = name.toLowerCase();
  return s.includes('mega') || s.includes('gmax') || s.includes('gigantamax') || s.includes('dynamax') || s.includes('dyna') && s.includes('max');
}

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem('pf_mode') || 'dark');
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem('pf_sound') === '1');
  const [vibrateOn, setVibrateOn] = useState(() => localStorage.getItem('pf_vibrate') === '1');
  const [allPokemon, setAllPokemon] = useState(null);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [flow, setFlow] = useState('idle');
  const winnersRef = useRef([]);
  const [savedResults, setSavedResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pf_saved')) || []; } catch { return []; }
  });
  const [bgColor, setBgColor] = useState('#05060a');
  const [fadeKey, setFadeKey] = useState(0);
  const resumeRef = useRef(null);

  useEffect(() => { document.documentElement.setAttribute('data-theme', mode); localStorage.setItem('pf_mode', mode); }, [mode]);
  useEffect(() => { localStorage.setItem('pf_sound', soundOn ? '1' : '0'); }, [soundOn]);
  useEffect(() => { localStorage.setItem('pf_vibrate', vibrateOn ? '1' : '0'); }, [vibrateOn]);

  useEffect(() => {
    if (!allPokemon) {
      fetch(`${POKEAPI_BASE}/pokemon?limit=20000`).then(r=>r.json()).then(j=>{
        const filtered = j.results.filter(p=>!isExcluded(p.name));
        setAllPokemon(filtered);
        const session = JSON.parse(localStorage.getItem('pf_session') || 'null');
        if (session && session.deck && session.index>=0) resumeRef.current = session;
      }).catch(e=>console.error(e));
    }
  }, [allPokemon]);

  function shuffle(arr) {
    const a = [...arr];
    for (let i=a.length-1;i>0;i--){ const r=Math.floor(Math.random()*(i+1)); [a[i],a[r]]=[a[r],a[i]]; }
    return a;
  }

  async function startVoting(resume=false) {
    if (!allPokemon) return;
    let pool;
    if (resume && resumeRef.current) {
      const lookup = Object.fromEntries(allPokemon.map(p=>[p.name,p]));
      pool = resumeRef.current.deck.map(n=>lookup[n]).filter(Boolean);
      if (pool.length===0) pool = shuffle(allPokemon);
      setDeck(pool); setIndex(resumeRef.current.index||0); setFlow('voting'); setFadeKey(k=>k+1); resumeRef.current=null;
      return;
    }
    pool = shuffle(allPokemon);
    setDeck(pool); setIndex(0); winnersRef.current=[]; setFlow('voting'); setFadeKey(k=>k+1);
    // preload first 6
    for (let i=0;i<6 && i<pool.length;i++){ const id = pool[i].url.match(/\/pokemon\/(\d+)\/?$/)[1]; const img=new Image(); img.src=ARTWORK(id); }
  }

  // autosave session
  useEffect(()=>{
    if (flow==='voting' && deck.length>0) {
      const session = { deck: deck.map(d=>d.name), index };
      localStorage.setItem('pf_session', JSON.stringify(session));
    }
  }, [deck, index, flow]);

  function onVote(pokemon, liked, color) {
    if (liked) winnersRef.current.push(pokemon);
    if (color) { setBgColor(color); setFadeKey(k=>k+1); }
    const next = index+1;
    // preload ahead
    for (let i=next;i<Math.min(deck.length, next+3);i++){ const id=deck[i].url.match(/\/pokemon\/(\d+)\/?$/)[1]; const img=new Image(); img.src=ARTWORK(id); }
    setTimeout(()=>{
      if (next>=deck.length) {
        const winners = winnersRef.current;
        if (winners.length===0) { setFlow('results'); localStorage.removeItem('pf_session'); }
        else if (winners.length===1) {
          const rec={ timestamp: new Date().toISOString(), winner: winners[0], winnerName: winners[0].name };
          const ns = [rec,...savedResults].slice(0,50); setSavedResults(ns); localStorage.setItem('pf_saved', JSON.stringify(ns)); setFlow('results'); localStorage.removeItem('pf_session');
        } else {
          setDeck(winners); winnersRef.current=[]; setIndex(0);
          const session = { deck: winners.map(d=>d.name), index:0 }; localStorage.setItem('pf_session', JSON.stringify(session));
        }
      } else { setIndex(next); }
    }, 260);
  }

  function exportAll() { const data=JSON.stringify(savedResults,null,2); const blob=new Blob([data],{type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='pokefavor-saved-results.json'; a.click(); URL.revokeObjectURL(url); }

  return (
    <div className="app">
      <div className="bg-layer" style={{ backgroundColor: bgColor }} key={fadeKey} />
      <Header mode={mode} setMode={setMode} startVoting={startVoting} savedResults={savedResults} setFlow={setFlow} exportAll={exportAll} soundOn={soundOn} setSoundOn={setSoundOn} vibrateOn={vibrateOn} setVibrateOn={setVibrateOn} resumeAvailable={Boolean(resumeRef.current)} />
      <main className="main">
        { !allPokemon && <div className="notice">Loading Pokémon list…</div> }
        { allPokemon && flow==='idle' && (
          <section className="hero">
            <h1 className="logoTitle">PokéFavor</h1>
            <p className="muted">Swipe right to keep, left to skip. Multiple rounds narrow your favorites to one champion.</p>
            <div className="controls">
              <button className="primary" onClick={()=>startVoting(false)}>Start fresh</button>
              { resumeRef.current && <button className="secondary" onClick={()=>startVoting(true)}>Resume</button> }
            </div>
          </section>
        ) }
        { allPokemon && flow==='voting' && deck.length>0 && index<deck.length && (
          <div className="swipeArea">
            <SwipeCard key={deck[index].name+index} pokemon={deck[index]} onDecision={(liked,color)=>onVote(deck[index],liked,color)} soundOn={soundOn} vibrateOn={vibrateOn} />
            <div className="hint">Use ←/→ or swipe on mobile</div>
          </div>
        ) }
        { flow==='results' && <Results savedResults={savedResults} onBack={()=>setFlow('idle')} /> }
      </main>
      <footer className="footer"><small>PokéFavor v2 — Data from PokeAPI</small></footer>
    </div>
  );
}
