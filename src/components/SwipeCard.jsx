import React, { useEffect, useRef, useState } from 'react';

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const ARTWORK = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const THUMB = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// compressed inline SVG icons
const TYPE_SVGS = {
  fire: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c0 0-3 3-3 6 0 3 1 4 1 6 0 2 3 4 3 4s3-2 3-4c0-2 1-3 1-6 0-3-3-6-5-6z" fill="#EE8130"/></svg>',
  water: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2s-4 4-4 7a4 4 0 0 0 8 0c0-3-4-7-4-7z" fill="#6390F0"/></svg>',
  electric: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="13 2 3 14 11 14 11 22 21 10 13 10 13 2" fill="#F7D02C"/></svg>',
  grass: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C8 6 6 9 6 13a6 6 0 0 0 12 0c0-4-2-7-6-11z" fill="#7AC74C"/></svg>',
  fighting: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#C22E28"/></svg>',
  psychic: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="20" height="20" rx="4" fill="#F95587"/></svg>',
  normal: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#A8A77A"/></svg>'
};

function getIdFromUrl(url){ const m=url.match(/\/pokemon\/(\d+)\/?$/); return m?Number(m[1]):null; }

function playSwipeSound(type='like'){ try{ const ctx=new (window.AudioContext||window.webkitAudioContext)(); const o=ctx.createOscillator(); const g=ctx.createGain(); o.type='sine'; if(type==='like'){ o.frequency.setValueAtTime(520,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(820,ctx.currentTime+0.12);} else { o.frequency.setValueAtTime(300,ctx.currentTime); o.frequency.exponentialRampToValueAtTime(200,ctx.currentTime+0.12);} g.gain.setValueAtTime(0.0001,ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.12,ctx.currentTime+0.02); g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+0.18); o.connect(g).connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.2);}catch(e){} }

export default function SwipeCard({ pokemon, onDecision, soundOn, vibrateOn }){
  const id = getIdFromUrl(pokemon.url);
  const [details,setDetails]=useState(null);
  const [imgLoaded,setImgLoaded]=useState(false);
  const [thumbLoaded,setThumbLoaded]=useState(false);
  const [drag,setDrag]=useState({x:0,y:0,rot:0,isDragging:false});
  const rootRef=useRef(null);
  const pointerRef=useRef(null);
  const startRef=useRef({x:0,y:0});
  const draggingRef=useRef(false);
  const [bgColor,setBgColor]=useState('#222');

  useEffect(()=>{ let mounted=true; fetch(`${POKEAPI_BASE}/pokemon/${pokemon.name}`).then(r=>r.json()).then(j=>{ if(mounted) setDetails(j); }).catch(()=>{}); return ()=>{ mounted=false; setDetails(null); }; },[pokemon]);

  useEffect(()=>{ setImgLoaded(false); setThumbLoaded(false); let cancelled=false; if(id){ const t=new Image(); t.src=THUMB(id); t.onload=()=>{ if(!cancelled) setThumbLoaded(true); }; const a=new Image(); a.src=ARTWORK(id); a.onload=()=>{ if(!cancelled) setImgLoaded(true); }; } return ()=>{ cancelled=true; }; },[id,pokemon]);

  function typeColor(){ if(!details||!details.types) return '#222'; const t=details.types[0].type.name; const map={normal:'#A8A77A',fire:'#EE8130',water:'#6390F0',electric:'#F7D02C',grass:'#7AC74C',ice:'#96D9D6',fighting:'#C22E28',poison:'#A33EA1',ground:'#E2BF65',flying:'#A98FF3',psychic:'#F95587',bug:'#A6B91A',rock:'#B6A136',ghost:'#735797',dragon:'#6F35FC',dark:'#705746',steel:'#B7B7CE',fairy:'#D685AD'}; return map[t]||'#222'; }

  useEffect(()=>{ setBgColor(typeColor()); },[details]);

  // pointer/touch handlers with preventDefault
  useEffect(()=>{
    const el=rootRef.current; if(!el) return;
    function onPointerDown(e){ el.setPointerCapture(e.pointerId); pointerRef.current=e.pointerId; startRef.current={x:e.clientX,y:e.clientY}; draggingRef.current=true; setDrag(d=>({...d,isDragging:true})); }
    function onPointerMove(e){ if(!draggingRef.current) return; if(pointerRef.current!==e.pointerId) return; const dx=e.clientX-startRef.current.x; const dy=e.clientY-startRef.current.y; if(Math.abs(dy)>Math.abs(dx)&&Math.abs(dy)>10) return; e.preventDefault(); const rot=Math.max(-30,Math.min(30,dx/8)); setDrag({x:dx,y:dy,rot,isDragging:true}); }
    function onPointerUp(e){ if(pointerRef.current!==e.pointerId) return; el.releasePointerCapture(e.pointerId); pointerRef.current=null; draggingRef.current=false; const dx=e.clientX-startRef.current.x; const threshold=100; if(dx>threshold) triggerDecision(1); else if(dx<-threshold) triggerDecision(-1); else setDrag({x:0,y:0,rot:0,isDragging:false}); }

    el.addEventListener('pointerdown',onPointerDown,{passive:false}); window.addEventListener('pointermove',onPointerMove,{passive:false}); window.addEventListener('pointerup',onPointerUp);
    return ()=>{ if(el) el.removeEventListener('pointerdown',onPointerDown); window.removeEventListener('pointermove',onPointerMove); window.removeEventListener('pointerup',onPointerUp); };
  },[pokemon]);

  useEffect(()=>{ function onKey(e){ if(e.key==='ArrowRight'){ setDrag({x:100,y:0,rot:6,isDragging:false}); setTimeout(()=>triggerDecision(1),200);} else if(e.key==='ArrowLeft'){ setDrag({x:-100,y:0,rot:-6,isDragging:false}); setTimeout(()=>triggerDecision(-1),200);} } window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[pokemon]);

  function triggerDecision(direction){ setDrag({x:direction*900,y:(Math.random()-0.5)*70,rot:direction*35,isDragging:false}); if(soundOn) playSwipeSound(direction===1?'like':'skip'); if(vibrateOn && navigator.vibrate) navigator.vibrate(16); setTimeout(()=>{ onDecision(direction===1,bgColor); setDrag({x:0,y:0,rot:0,isDragging:false}); },320); }

  function displayName(){ return pokemon.name[0].toUpperCase()+pokemon.name.slice(1); }
  function bulbapediaUrl(){ const n=displayName(); return `https://bulbapedia.bulbagarden.net/wiki/${n}_(Pokémon)`; }

  return (
    <div className="swipeCardOuter">
      <div className="swipeCard" ref={rootRef} style={{ transform:`translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.rot}deg)`, transition: drag.isDragging? 'none' : 'transform 320ms cubic-bezier(.2,.9,.2,1)', willChange:'transform' }}>
        <a className="infoButton" href={bulbapediaUrl()} target="_blank" rel="noreferrer" title="Open on Bulbapedia">i</a>
        <div className="cardHero" style={{ background:`radial-gradient(400px 300px at 50% 30%, ${bgColor}, rgba(0,0,0,0))` }}>
          <div className="artWrap">
            {!imgLoaded && thumbLoaded && <img src={THUMB(id)} alt={pokemon.name} className="thumb" draggable={false} />}
            {imgLoaded ? <img src={ARTWORK(id)} alt={pokemon.name} draggable={false} /> : (!thumbLoaded && <div className="placeholder" />)}
          </div>
        </div>
        <div className="cardInfo">
          <h2 className="pokeName">{displayName()}</h2>
          <div className="typeRow" aria-hidden>
            {details && details.types && details.types.map((t,i)=>( <span key={i} className="typeIcon" dangerouslySetInnerHTML={{__html: TYPE_SVGS[t.type.name] || TYPE_SVGS['normal']}} /> ))}
          </div>
          <div className="actions">
            <button className="btn dislike" onClick={()=>triggerDecision(-1)}>Skip</button>
            <button className="btn like" onClick={()=>triggerDecision(1)}>Keep</button>
          </div>
        </div>
      </div>
    </div>
  );
}
