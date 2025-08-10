import React from "react";

export default function Header({ mode, setMode, startVoting, savedResults, setFlow, exportAll, soundOn, setSoundOn, vibrateOn, setVibrateOn }) {
  return (
    <header className="header">
      <div className="brand">PokéFavor</div>

      <div className="header-actions">
        <button className="icon" onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}>
          {mode === 'light' ? '🌙' : '🌞'}
        </button>

        <label className="toggle">
          <input type="checkbox" checked={soundOn} onChange={(e) => setSoundOn(e.target.checked)} />
          <span>Sound</span>
        </label>

        <label className="toggle">
          <input type="checkbox" checked={vibrateOn} onChange={(e) => setVibrateOn(e.target.checked)} />
          <span>Vibrate</span>
        </label>

        <button className="secondary" onClick={() => { setFlow('results'); }}>
          Results ({savedResults.length})
        </button>

        <button className="secondary" onClick={startVoting}>Start</button>

        <button className="secondary" onClick={exportAll}>Export</button>
      </div>
    </header>
  );
}
