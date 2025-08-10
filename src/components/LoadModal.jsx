import React, { useEffect, useState } from 'react';
export default function LoadModal({ isOpen, onClose, onLoad }){
  const [saves,setSaves]=useState([]);
  useEffect(()=>{ if(isOpen){ const ms=JSON.parse(localStorage.getItem('pf_manual_saves')||'[]'); setSaves(ms); } },[isOpen]);
  if(!isOpen) return null;
  return (
    <div className='modalBackdrop'>
      <div className='modal'>
        <h3>Load Save</h3>
        {saves.length===0 && <div className='notice'>No saves found.</div>}
        <ul className='savedList'>
          {saves.map((s,i)=>(
            <li key={i}>
              <div><strong>{s.name}</strong><br/><small>{new Date(s.ts).toLocaleString()}</small></div>
              <div><button onClick={()=>onLoad(s.session)}>Load</button></div>
            </li>
          ))}
        </ul>
        <div style={{marginTop:12}}><button onClick={onClose} className='secondary'>Close</button></div>
      </div>
    </div>
  );
}
