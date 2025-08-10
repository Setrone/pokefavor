import React, { useEffect, useState, useRef } from 'react';
import Header from './components/Header';
import SwipeCard from './components/SwipeCard';
import Results from './components/Results';
import LoadModal from './components/LoadModal';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const ARTWORK = id => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;

function isExcluded(name){
  const s = name.toLowerCase();
  return s.includes('mega') || s.includes('gmax') || s.includes('gigantamax') || s.includes('dynamax') || (s.includes('dyna') && s.includes('max'));
}

export default function App(){
  const [allPokemon, setAllPokemon] = useState(null);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [flow, setFlow] = useState('idle'); // idle, voting, results
  const winnersRef = useRef([]);
  const [savedResults, setSavedResults] = useState(()=>{ try{ return JSON.parse(localStorage.getItem('pf_saved'))||[] }catch{ return [] } });
  const [bgColor, setBgColor] = useState('#05060a');
  const [fadeKey, setFadeKey] = useState(0);
  const resumeRef = useRef(null);
  const [showLoadModal, setShowLoadModal] = useState(false);

  // force dark mode only
  useEffect(()=>{ document.documentElement.setAttribute('data-theme','dark'); },[]);

  useEffect(()=>{
    if(!allPokemon){
      fetch(`${POKEAPI_BASE}/pokemon?limit=20000`).then(r=>r.json()).then(j=>{
        const filtered = j.results.filter(p=>!isExcluded(p.name));
        setAllPokemon(filtered);
        const session = JSON.parse(localStorage.getItem('pf_session') || 'null');
        if(session && session.deck && session.index>=0) resumeRef.current = session;
      }).catch(e=>console.error(e));
    }
  },[allPokemon]);

  function shuffle(arr){
    const a = [...arr];
    for(let i=a.length-1;i>0;i--){
      const r = Math.floor(Math.random()*(i+1));
      [a[i],a[r]] = [a[r],a[i]];
    }
    return a;
  }

  function startVoting(resume=false){
    if(!allPokemon) return;
    if(resume && resumeRef.current){
      const lookup = Object.fromEntries(allPokemon.map(p=>[p.name,p]));
      let pool = resumeRef.current.deck.map(n=>lookup[n]).filter(Boolean);
      if(pool.length===0) pool = shuffle(allPokemon);
      setDeck(pool); setIndex(resumeRef.current.index||0); setFlow('voting'); setFadeKey(k=>k+1); resumeRef.current = null; return;
    }
    const pool = shuffle(allPokemon);
    setDeck(pool); setIndex(0); winnersRef.current = []; setFlow('voting'); setFadeKey(k=>k+1);
    // preload first few images for snappy feel
    for(let i=0;i<6 && i<pool.length;i++){
      const id = pool[i].url.match(/\/pokemon\/(\d+)\/?$/)[1];
      const img = new Image();
      img.src = ARTWORK(id);
    }
  }

  // auto-save session to "auto" manual saves area in addition to pf_session
  useEffect(()=>{
    if(flow==='voting' && deck.length>0){
      const session = { deck: deck.map(d=>d.name), index };
      localStorage.setItem('pf_session', JSON.stringify(session));
      try{
        const saves = JSON.parse(localStorage.getItem('pf_manual_saves')||'[]');
        const auto = { name: 'Auto-save', ts: new Date().toISOString(), session };
        const others = saves.filter(s=>s.name!=='Auto-save');
        localStorage.setItem('pf_manual_saves', JSON.stringify([auto,...others].slice(0,20)));
      }catch(e){}
    }
  },[deck,index,flow]);

  function saveManual(name){
    if(!deck || deck.length===0) return;
    const session = { deck: deck.map(d=>d.name), index };
    const saves = JSON.parse(localStorage.getItem('pf_manual_saves')||'[]');
    saves.unshift({ name: name||('Save '+(new Date().toLocaleString())), ts: new Date().toISOString(), session });
    localStorage.setItem('pf_manual_saves', JSON.stringify(saves.slice(0,20)));
    return saves;
  }

  function loadSession(session){
    if(!session) return false;
    const lookup = Object.fromEntries(allPokemon.map(p=>[p.name,p]));
    const pool = session.deck.map(n=>lookup[n]).filter(Boolean);
    if(pool.length===0) return false;
    setDeck(pool); setIndex(session.index||0); setFlow('voting'); setFadeKey(k=>k+1);
    return true;
  }

  function onVote(pokemon, liked, color){
    if(liked) winnersRef.current.push(pokemon);
    if(color){ setBgColor(color); setFadeKey(k=>k+1); }
    const next = index + 1;
    for(let i=next;i<Math.min(deck.length,next+3);i++){
      const id = deck[i].url.match(/\/pokemon\/(\d+)\/?$/)[1];
      const img = new Image();
      img.src = ARTWORK(id);
    }
    // delay so the card fully exits before next is centered
    setTimeout(()=>{
      if(next>=deck.length){
        const winners = winnersRef.current;
        if(winners.length===0){ setFlow('results'); localStorage.removeItem('pf_session'); }
        else if(winners.length===1){
          const rec = { timestamp: new Date().toISOString(), winner: winners[0], winnerName: winners[0].name };
          const ns = [rec,...savedResults].slice(0,50); setSavedResults(ns); localStorage.setItem('pf_saved', JSON.stringify(ns)); setFlow('results'); localStorage.removeItem('pf_session');
        } else {
          setDeck(winners); winnersRef.current = []; setIndex(0);
          const session = { deck: winners.map(d=>d.name), index:0 }; localStorage.setItem('pf_session', JSON.stringify(session));
        }
      } else { setIndex(next); }
    }, 380);
  }

  function manualSavePrompt(){
    const name = prompt('Save name (optional). Leave empty for timestamp.');
    if(name===null) return;
    saveManual(name);
    alert('Saved.');
  }

  function openLoadModal(){ setShowLoadModal(true); }
  function closeLoadModal(){ setShowLoadModal(false); }

  return (
    <div className='app'>
      <div className='bg-layer' style={{ backgroundColor: bgColor }} key={fadeKey} />
      <Header startVoting={startVoting} savedResults={savedResults} setFlow={setFlow} saveManual={manualSavePrompt} openLoadModal={openLoadModal} />
      <main className='main'>
        { !allPokemon && <div className='notice'>Loading Pokémon list…</div> }
        { allPokemon && flow==='idle' && (
          <section className='hero'>
            <h1 className='logoTitle'>PokéFavor</h1>
            <p className='muted'>Swipe right to keep, left to skip. Use Save/Load to manage sessions.</p>
            <div className='controls'>
              <button className='primary' onClick={()=>startVoting(false)}>Start</button>
              <button className='secondary' onClick={()=>openLoadModal()}>Load</button>
              <button className='secondary' onClick={()=>manualSavePrompt()}>Save</button>
            </div>
          </section>
        ) }
        { allPokemon && flow==='voting' && deck.length>0 && index<deck.length && (
          <div className='swipeArea'>
            <SwipeCard key={deck[index].name+index} pokemon={deck[index]} onDecision={(liked,color)=>onVote(deck[index],liked,color)} />
          </div>
        ) }
        { flow==='results' && <Results savedResults={savedResults} onBack={()=>setFlow('idle')} /> }
      </main>
      <LoadModal isOpen={showLoadModal} onClose={closeLoadModal} onLoad={(session)=>{ if(loadSession(session)){ closeLoadModal(); } else alert('Unable to load — items missing.'); }} />
      <footer className='footer'><small>PokéFavor v2.1 — Data from PokeAPI</small></footer>
    </div>
  );
}
