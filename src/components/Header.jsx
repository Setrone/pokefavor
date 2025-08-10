import React from 'react';

export default function Header({ startVoting, savedResults, setFlow, saveManual, openLoadModal }){
  return (
    <header className='header'>
      <div className='brand' role='button' title='PokéFavor Home'>
        <span className='pokefavorLogo'>PokéFavor</span>
      </div>
      <div className='header-actions'>
        <button className='secondary' onClick={()=>startVoting(false)}>Start</button>
        <button className='secondary' onClick={openLoadModal}>Load</button>
        <button className='secondary' onClick={saveManual}>Save</button>
        <button className='secondary' onClick={()=>setFlow('results')}>Results ({savedResults.length})</button>
      </div>
    </header>
  );
}
