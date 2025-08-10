import React from 'react';
export default function Results({ savedResults, onBack }){
  return (
    <div className='results'>
      <h2>Saved winners</h2>
      {savedResults.length===0 && <div className='notice'>No saved results yet — complete a session to save winners.</div>}
      <ul className='savedList'>
        {savedResults.map((s,i)=>(
          <li key={i}><div><strong>{s.winnerName}</strong><br/><small>{new Date(s.timestamp).toLocaleString()}</small></div></li>
        ))}
      </ul>
      <div style={{marginTop:20}}><button className='secondary' onClick={onBack}>Back</button></div>
    </div>
  );
}
