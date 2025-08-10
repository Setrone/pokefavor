import React, { useEffect, useState, useRef } from "react";
import Header from "./components/Header";
import SwipeCard from "./components/SwipeCard";
import Results from "./components/Results";

const POKEAPI_BASE = "https://pokeapi.co/api/v2";

// preload helper
function preloadImage(url) {
  return new Promise((res) => {
    const i = new Image();
    i.src = url;
    i.onload = () => res(true);
    i.onerror = () => res(false);
  });
}

export default function App() {
  const [mode, setMode] = useState(() => localStorage.getItem("pf_mode") || "dark");
  const [soundOn, setSoundOn] = useState(() => localStorage.getItem("pf_sound") === "1");
  const [vibrateOn, setVibrateOn] = useState(() => localStorage.getItem("pf_vibrate") === "1");
  const [allPokemon, setAllPokemon] = useState(null);
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [flow, setFlow] = useState("idle"); // idle | voting | results
  const [loading, setLoading] = useState(false);
  const winnersRef = useRef([]);
  const [savedResults, setSavedResults] = useState(() => {
    try { return JSON.parse(localStorage.getItem("pf_saved")) || []; } catch { return []; }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    localStorage.setItem("pf_mode", mode);
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("pf_sound", soundOn ? "1" : "0");
  }, [soundOn]);
  useEffect(() => {
    localStorage.setItem("pf_vibrate", vibrateOn ? "1" : "0");
  }, [vibrateOn]);

  useEffect(() => {
    if (!allPokemon) {
      setLoading(true);
      fetch(`${POKEAPI_BASE}/pokemon?limit=20000`)
        .then(r => r.json())
        .then(j => { setAllPokemon(j.results); setLoading(false); })
        .catch(e => { console.error(e); setLoading(false); });
    }
  }, [allPokemon]);

  // shuffle helper
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [a[i], a[r]] = [a[r], a[i]];
    }
    return a;
  }

  async function startVoting() {
    if (!allPokemon) return;
    const pool = shuffleArray(allPokemon);
    setDeck(pool);
    setIndex(0);
    winnersRef.current = [];
    setFlow("voting");
    // preload first few images for instant feel
    const firstIds = pool.slice(0, 6).map(p => {
      const id = p.url.match(/\/pokemon\/(\d+)\/?$/)[1];
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    });
    for (const u of firstIds) await preloadImage(u);
  }

  async function onVote(pokemon, liked) {
    if (liked) winnersRef.current.push(pokemon);
    const next = index + 1;
    // preload a few ahead
    const preloadAhead = 3;
    for (let i = next; i < Math.min(deck.length, next + preloadAhead); i++) {
      const id = deck[i].url.match(/\/pokemon\/(\d+)\/?$/)[1];
      preloadImage(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`);
    }

    if (next >= deck.length) {
      const winners = winnersRef.current;
      if (winners.length === 0) {
        setFlow("results");
      } else if (winners.length === 1) {
        const resultRecord = {
          timestamp: new Date().toISOString(),
          winner: winners[0],
          winnerName: winners[0].name
        };
        const newSaved = [resultRecord, ...savedResults].slice(0, 50);
        setSavedResults(newSaved);
        localStorage.setItem("pf_saved", JSON.stringify(newSaved));
        setFlow("results");
      } else {
        setDeck(winners);
        winnersRef.current = [];
        setIndex(0);
      }
    } else {
      setIndex(next);
    }
  }

  function exportAll() {
    const data = JSON.stringify(savedResults, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pokefavor-saved-results.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="app">
      <Header
        mode={mode}
        setMode={setMode}
        startVoting={startVoting}
        savedResults={savedResults}
        setFlow={setFlow}
        exportAll={exportAll}
        soundOn={soundOn}
        setSoundOn={setSoundOn}
        vibrateOn={vibrateOn}
        setVibrateOn={setVibrateOn}
      />

      <main className="main">
        {loading && <div className="notice">Loading Pokémon list...</div>}

        {!loading && flow === "idle" && (
          <section className="hero">
            <h1>PokéFavor</h1>
            <p className="muted">Swipe right to like, left to skip. Repeated rounds narrow your favorites to one champion.</p>
            <div className="controls">
              <button className="primary" onClick={startVoting}>Start swiping</button>
            </div>
          </section>
        )}

        {!loading && flow === "voting" && deck.length > 0 && index < deck.length && (
          <div className="swipeArea">
            <SwipeCard
              key={deck[index].name + index}
              pokemon={deck[index]}
              onDecision={(liked) => onVote(deck[index], liked)}
              soundOn={soundOn}
              vibrateOn={vibrateOn}
            />
            <div className="hint">Use ← → or swipe on mobile</div>
            <div className="progress">Card {index + 1} / {deck.length}</div>
          </div>
        )}

        {!loading && flow === "voting" && deck.length === 0 && (
          <div className="notice">No Pokémon available. Try again.</div>
        )}

        {flow === "results" && (
          <Results savedResults={savedResults} onBack={() => { setFlow("idle"); }} />
        )}
      </main>

      <footer className="footer">
        <small>PokéFavor — Final — Data from PokeAPI</small>
      </footer>
    </div>
  );
}
