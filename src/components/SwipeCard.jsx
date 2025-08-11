import React, { useEffect, useRef, useState } from 'react';
const POKEAPI_BASE='https://pokeapi.co/api/v2';
const TYPE_GRADIENT = {"normal": ["#A8A77A", "#6B6B4E"], "fire": ["#FFB56B", "#EE8130"], "water": ["#9BD0FF", "#6390F0"], "electric": ["#FFF59B", "#F7D02C"], "grass": ["#CFFFCB", "#7AC74C"], "ice": ["#DDF7FA", "#96D9D6"], "fighting": ["#F0B1A8", "#C22E28"], "poison": ["#E6C0F0", "#A33EA1"], "ground": ["#F0D8A8", "#E2BF65"], "flying": ["#EAD9FF", "#A98FF3"], "psychic": ["#FFCFEA", "#F95587"], "bug": ["#E9F7C7", "#A6B91A"], "rock": ["#E7D6B5", "#B6A136"], "ghost": ["#D6CFF6", "#735797"], "dragon": ["#E6DAFF", "#6F35FC"], "dark": ["#CFC7C0", "#705746"], "steel": ["#E6E9EE", "#B7B7CE"], "fairy": ["#FFE7F0", "#D685AD"]};

const ARTWORK=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const THUMB=id=>`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// Bulbapedia archived 40px icons mapping (40px versions) - using archived URLs
const TYPE_ICONS = {
  normal: 'https://archives.bulbagarden.net/media/upload/thumb/a/ae/Normal_icon.png/40px-Normal_icon.png',
  fire: 'https://archives.bulbagarden.net/media/upload/thumb/1/18/Fire_icon.png/40px-Fire_icon.png',
  water: 'https://archives.bulbagarden.net/media/upload/thumb/8/88/Water_icon.png/40px-Water_icon.png',
  electric: 'https://archives.bulbagarden.net/media/upload/thumb/2/2b/Electric_icon.png/40px-Electric_icon.png',
  grass: 'https://archives.bulbagarden.net/media/upload/thumb/6/6f/Grass_icon.png/40px-Grass_icon.png',
  psychic: 'https://archives.bulbagarden.net/media/upload/thumb/7/73/Psychic_icon.png/40px-Psychic_icon.png',
  fighting: 'https://archives.bulbagarden.net/media/upload/thumb/c/c5/Fighting_icon.png/40px-Fighting_icon.png',
  // add others as needed, fallback to normal
};

function getIdFromUrl(url){ const m = url.match(/\/pokemon\/(\d+)\/?$/); return m?Number(m[1]):null; }

export default function SwipeCard({ pokemon, onDecision }){
  const id = getIdFromUrl(pokemon.url);
  const [details,setDetails]=useState(null);
  const [imgLoaded,setImgLoaded]=useState(false);
  const [thumbLoaded,setThumbLoaded]=useState(false);
  const [drag,setDrag]=useState({x:0,y:0,rot:0,isDragging:false});
  const rootRef=useRef(null);
  const pointerRef=useRef(null);
  const startRef=useRef({x:0,y:0});
  const draggingRef=useRef(false);

  useEffect(()=>{ let mounted=true; fetch(`${POKEAPI_BASE}/pokemon/${pokemon.name}`).then(r=>r.json()).then(j=>{ if(mounted) setDetails(j); }).catch(()=>{}); return ()=>{ mounted=false; setDetails(null); }; },[pokemon]);

  useEffect(()=>{ setImgLoaded(false); setThumbLoaded(false); let cancelled=false; if(id){ const t=new Image(); t.src=THUMB(id); t.onload=()=>{ if(!cancelled) setThumbLoaded(true); }; const a=new Image(); a.src=ARTWORK(id); a.onload=()=>{ if(!cancelled) setImgLoaded(true); }; } return ()=>{ cancelled=true; }; },[id,pokemon]);

  function setScrollLock(lock){ if(lock) document.body.style.overflow='hidden'; else document.body.style.overflow=''; }

  useEffect(()=>{
    const el = rootRef.current; if(!el) return;
    function onPointerDown(e){ try{ el.setPointerCapture(e.pointerId); }catch{} pointerRef.current=e.pointerId; startRef.current={x:e.clientX,y:e.clientY}; draggingRef.current=true; setDrag(d=>({...d,isDragging:true})); }
    function onPointerMove(e){ if(!draggingRef.current) return; if(pointerRef.current!==e.pointerId) return; const dx=e.clientX-startRef.current.x; const dy=e.clientY-startRef.current.y; if(Math.abs(dy)>Math.abs(dx) && Math.abs(dy)>10) return; e.preventDefault(); setScrollLock(true); const rot=Math.max(-30,Math.min(30,dx/8)); setDrag({x:dx,y:dy,rot,isDragging:true}); }
    function onPointerUp(e){ if(pointerRef.current!==e.pointerId) return; try{ el.releasePointerCapture(e.pointerId); }catch{} pointerRef.current=null; draggingRef.current=false; setScrollLock(false); const dx=e.clientX-startRef.current.x; const threshold=100; if(dx>threshold) triggerDecision(1); else if(dx<-threshold) triggerDecision(-1); else setDrag({x:0,y:0,rot:0,isDragging:false}); }
    el.addEventListener('pointerdown',onPointerDown,{passive:false}); window.addEventListener('pointermove',onPointerMove,{passive:false}); window.addEventListener('pointerup',onPointerUp);
    return ()=>{ if(el) el.removeEventListener('pointerdown',onPointerDown); window.removeEventListener('pointermove',onPointerMove); window.removeEventListener('pointerup',onPointerUp); setScrollLock(false); };
  },[pokemon]);

  useEffect(()=>{ function onKey(e){ if(e.key==='ArrowRight'){ setDrag({x:100,y:0,rot:6,isDragging:false}); setTimeout(()=>triggerDecision(1),200);} else if(e.key==='ArrowLeft'){ setDrag({x:-100,y:0,rot:-6,isDragging:false}); setTimeout(()=>triggerDecision(-1),200);} } window.addEventListener('keydown',onKey); return ()=>window.removeEventListener('keydown',onKey); },[pokemon]);

  function triggerDecision(direction){
    const exitX = direction * (window.innerWidth + 200);
    setDrag({ x: exitX, y: (Math.random()-0.5)*60, rot: direction*35, isDragging:false });
    // determine primary type quickly from details (fallback 'normal')
    const primary = details && details.types && details.types[0] && details.types[0].type ? details.types[0].type.name : 'normal';
    setTimeout(()=>{ onDecision(direction===1, primary); setDrag({x:0,y:0,rot:0,isDragging:false}); }, 320);
  }

  function displayName(){ return pokemon.name[0].toUpperCase()+pokemon.name.slice(1); }
  function bulbapediaUrl(){ const n=displayName(); return `https://bulbapedia.bulbagarden.net/wiki/${n}_(Pokémon)`; }

  return (
    <div className="swipeCardOuter">
      <div className="swipeCard noTouch" ref={rootRef} style={{ transform:`translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.rot}deg)`, transition: drag.isDragging? 'none' : 'transform 320ms cubic-bezier(.2,.9,.2,1)', willChange:'transform' }}>
        <a className="infoButton" href={bulbapediaUrl()} target="_blank" rel="noreferrer" title="Open on Bulbapedia">i</a>
        <div className="cardHero" style={{ background: details && details.types ? `radial-gradient(400px 300px at 50% 30%, ${ (TYPE_GRADIENT[details.types[0].type.name] || ['#111','#000'])[0] }, rgba(0,0,0,0))` : 'radial-gradient(400px 300px at 50% 30%, rgba(255,255,255,0.06), rgba(0,0,0,0))' }}>
          <div className="artWrap">
            {!imgLoaded && thumbLoaded && <img src={THUMB(id)} alt={pokemon.name} className="thumb" draggable={false} />}
            {imgLoaded ? <img src={ARTWORK(id)} alt={pokemon.name} draggable={false} /> : (!thumbLoaded && <div className="placeholder" />)}
          </div>
        </div>
        <div className="cardInfo">
          <h2 className="pokeName">{displayName()}</h2>
          <div className="typeRow" aria-hidden>
            {details && details.types && details.types.map((t,i)=>(
              <div key={i} className="typeStack">
                <img src={TYPE_ICONS[t.type.name] || TYPE_ICONS['normal']} className="typeImg" alt={t.type.name} />
                <div className="typeLabel">{t.type.name.charAt(0).toUpperCase()+t.type.name.slice(1)}</div>
              </div>
            ))}
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
