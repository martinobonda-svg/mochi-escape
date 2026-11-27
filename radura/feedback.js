'use strict';
const Feedback=(()=>{
  let prefs={sound:true,haptics:true},audio;
  try{Object.assign(prefs,JSON.parse(localStorage.getItem('pip-feedback-v1')||'{}'))}catch{}
  const notes={select:[523],place:[440,659],clear:[523,659,880],invalid:[165],win:[523,659,784,1047],lost:[392,311,261]};
  function play(kind){
    if(prefs.haptics&&kind!=='select'){
      try{if(window.PipTouch)PipTouch.pulse(kind==='clear'||kind==='win');else navigator.vibrate?.(kind==='invalid'?12:20)}catch{}
    }
    if(!prefs.sound)return;
    try{
      audio??=new AudioContext();if(audio.state==='suspended')audio.resume().catch(()=>{});
      for(const [i,hz] of notes[kind].entries()){
        const start=audio.currentTime+i*.075,osc=audio.createOscillator(),gain=audio.createGain();
        osc.type=kind==='invalid'?'triangle':'sine';osc.frequency.value=hz;
        gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.075,start+.012);gain.gain.exponentialRampToValueAtTime(.0001,start+.19);
        osc.connect(gain);gain.connect(audio.destination);osc.start(start);osc.stop(start+.2);osc.onended=()=>{osc.disconnect();gain.disconnect()};
      }
    }catch{}
  }
  function options(){
    dialog('Suoni e vibrazione');
    for(const [key,name] of [['sound','Suoni'],['haptics','Vibrazione']]){
      const btn=document.createElement('button');btn.className='preference';const paint=()=>{btn.textContent=name+' · '+(key==='sound'?(prefs[key]?'attivi':'spenti'):(prefs[key]?'attiva':'spenta'));btn.setAttribute('aria-pressed',String(prefs[key]))};paint();
      btn.onclick=()=>{prefs[key]=!prefs[key];try{localStorage.setItem('pip-feedback-v1',JSON.stringify(prefs))}catch{}paint();if(prefs[key])play(key==='sound'?'select':'place')};$('panelBody').append(btn)
    }
    action('Fatto',closePanel);
  }
  return {play,options};
})();

