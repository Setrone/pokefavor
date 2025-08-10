import React, { useEffect, useRef, useState } from 'react';

function getIdFromUrl(url) {
  const m = url.match(/\/pokemon\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}

const POKEAPI_BASE = 'https://pokeapi.co/api/v2';
const ARTWORK = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
const THUMB = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// tiny WebAudio swipe sound
function playSwipeSound(type = 'like') {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    if (type === 'like') {
      o.frequency.setValueAtTime(520, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(820, ctx.currentTime + 0.12);
    } else {
      o.frequency.setValueAtTime(300, ctx.currentTime);
      o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
    }
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    o.connect(g).connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + 0.2);
  } catch (e) { /* ignore */ }
}

export default function SwipeCard({ pokemon, onDecision, soundOn, vibrateOn }) {
  const id = getIdFromUrl(pokemon.url);
  const [details, setDetails] = useState(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [drag, setDrag] = useState({ x:0, y:0, rot:0, isDragging:false });
  const rootRef = useRef();
  const pointerRef = useRef(null);
  const startRef = useRef({ x:0, y:0 });

  useEffect(() => {
    let mounted = true;
    fetch(`${POKEAPI_BASE}/pokemon/${pokemon.name}`)
      .then(r => r.json())
      .then(j => { if (mounted) setDetails(j); })
      .catch(() => {});
    return () => { mounted = false; setDetails(null); };
  }, [pokemon]);

  // load small thumb then artwork
  useEffect(() => {
    setImgLoaded(false);
    setThumbLoaded(false);
    let cancelled = false;
    if (id) {
      const t = new Image();
      t.src = THUMB(id);
      t.onload = () => { if (!cancelled) setThumbLoaded(true); };
      const a = new Image();
      a.src = ARTWORK(id);
      a.onload = () => { if (!cancelled) setImgLoaded(true); };
    }
    return () => { cancelled = true; };
  }, [id, pokemon]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    function onPointerDown(e) {
      el.setPointerCapture(e.pointerId);
      pointerRef.current = e.pointerId;
      startRef.current = { x: e.clientX, y: e.clientY };
      setDrag(d => ({ ...d, isDragging: true }));
    }
    function onPointerMove(e) {
      if (pointerRef.current !== e.pointerId) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      const rot = Math.max(-25, Math.min(25, dx / 10));
      setDrag({ x: dx, y: dy, rot, isDragging: true });
    }
    function onPointerUp(e) {
      if (pointerRef.current !== e.pointerId) return;
      el.releasePointerCapture(e.pointerId);
      pointerRef.current = null;
      const dx = e.clientX - startRef.current.x;
      const threshold = 110;
      if (dx > threshold) {
        triggerDecision(1);
      } else if (dx < -threshold) {
        triggerDecision(-1);
      } else {
        setDrag({ x:0, y:0, rot:0, isDragging:false });
      }
    }

    el.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      el.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [pokemon]);

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowRight') {
        setDrag({ x: 120, y: 0, rot: 8, isDragging: false });
        setTimeout(() => triggerDecision(1), 120);
      } else if (e.key === 'ArrowLeft') {
        setDrag({ x: -120, y: 0, rot: -8, isDragging: false });
        setTimeout(() => triggerDecision(-1), 120);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pokemon]);

  function triggerDecision(direction) {
    // animate out then call onDecision
    setDrag({ x: direction * 1400, y: (Math.random()-0.5)*80, rot: direction * 45, isDragging: false });
    if (soundOn) playSwipeSound(direction === 1 ? 'like' : 'skip');
    if (vibrateOn && navigator.vibrate) navigator.vibrate(18);
    setTimeout(() => {
      onDecision(direction === 1);
      setDrag({ x:0, y:0, rot:0, isDragging:false });
    }, 220);
  }

  function typeColor() {
    if (!details || !details.types) return '#222';
    const t = details.types[0].type.name;
    const map = {
      normal: '#A8A77A', fire: '#EE8130', water: '#6390F0', electric: '#F7D02C',
      grass: '#7AC74C', ice: '#96D9D6', fighting: '#C22E28', poison: '#A33EA1',
      ground: '#E2BF65', flying: '#A98FF3', psychic: '#F95587', bug: '#A6B91A',
      rock: '#B6A136', ghost: '#735797', dragon: '#6F35FC', dark: '#705746',
      steel: '#B7B7CE', fairy: '#D685AD'
    };
    return map[t] || '#222';
  }

  return (
    <div className='swipeCardWrap'>
      <div
        className='swipeCard'
        ref={rootRef}
        style={{
          transform: `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${drag.rot}deg)`,
          transition: drag.isDragging ? 'none' : 'transform 220ms cubic-bezier(.2,.9,.2,1)',
          willChange: 'transform'
        }}
      >
        <div className='cardHero' style={{
          background: `radial-gradient(400px 300px at 50% 30%, ${typeColor()}, rgba(0,0,0,0)), linear-gradient(180deg, rgba(0,0,0,0.0), rgba(0,0,0,0.6))`
        }}>
          <div className='artWrap'>
            {/* blur-up: show thumb blurred until artwork loads */}
            {!imgLoaded && thumbLoaded && (
              <img src={THUMB(id)} alt={pokemon.name} className='thumb' draggable={false} />
            )}
            {imgLoaded ? (
              <img src={ARTWORK(id)} alt={pokemon.name} draggable={false} />
            ) : (
              !thumbLoaded && <div className='placeholder' />
            )}
          </div>
        </div>

        <div className='cardInfo'>
          <h2>{pokemon.name[0].toUpperCase() + pokemon.name.slice(1)}</h2>
          <div className='actions'>
            <button className='btn dislike' onClick={() => triggerDecision(-1)}>Skip</button>
            <button className='btn like' onClick={() => triggerDecision(1)}>Like ❤️</button>
          </div>
        </div>
      </div>
    </div>
  );
}
