// ════════════════════════════════
// NAVIGATION
// ════════════════════════════════
function navigate(tab) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('screen-' + tab).classList.add('active');
  document.getElementById('nav-' + tab).classList.add('active');
}

// ════════════════════════════════
// STOPWATCH
// ════════════════════════════════
let swRunning = false, swElapsed = 0, swStart = 0, swRaf = null;
let swLapTimes = [], swLastLap = 0;
let swView = 'digital';

function swSetView(v) {
  swView = v;
  document.querySelectorAll('.sw-view-btn').forEach((b,i) => {
    b.classList.toggle('active', (i===0&&v==='digital')||(i===1&&v==='analog'));
  });
  document.getElementById('sw-digital').style.display = v==='digital' ? 'block' : 'none';
  document.getElementById('sw-analog').style.display  = v==='analog'  ? 'block' : 'none';
}

function swToggle() {
  if (!swRunning) {
    swStart = performance.now() - swElapsed;
    swRunning = true;
    document.getElementById('swStartBtn').textContent = 'Stop';
    document.getElementById('swStartBtn').className = 'circ-btn red';
    document.getElementById('swLapBtn').textContent = 'Lap';
    document.getElementById('swLapBtn').className = 'circ-btn gray';
    swRaf = requestAnimationFrame(swTick);
  } else {
    swRunning = false;
    cancelAnimationFrame(swRaf);
    document.getElementById('swStartBtn').textContent = 'Start';
    document.getElementById('swStartBtn').className = 'circ-btn green';
    document.getElementById('swLapBtn').textContent = 'Reset';
    document.getElementById('swLapBtn').className = 'circ-btn gray2';
  }
}

function swTick() {
  swElapsed = performance.now() - swStart;
  swRenderTime();
  if (swView === 'analog') drawAnalog();
  swRaf = requestAnimationFrame(swTick);
}

function swRenderTime() {
  const t = swElapsed;
  const ms = Math.floor((t % 1000) / 10);
  const s  = Math.floor(t / 1000) % 60;
  const m  = Math.floor(t / 60000) % 60;
  const h  = Math.floor(t / 3600000);
  let main = h > 0
    ? `${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(m)}:${pad(s)}`;
  document.getElementById('sw-time').innerHTML =
    `${main}<span id="sw-ms">.${pad(ms)}</span>`;
}

function swLap() {
  if (!swRunning) { swReset(); return; }
  const lapTime = swElapsed - swLastLap;
  swLastLap = swElapsed;
  swLapTimes.unshift({ n: swLapTimes.length + 1, t: lapTime });
  renderLaps();
}

function swReset() {
  swElapsed = 0; swLastLap = 0; swLapTimes = [];
  document.getElementById('sw-time').innerHTML = `00:00<span id="sw-ms">.00</span>`;
  document.getElementById('swLapBtn').textContent = 'Lap';
  document.getElementById('swLapBtn').className = 'circ-btn gray2';
  document.getElementById('swLapList').innerHTML = '';
  if (swView === 'analog') drawAnalog();
}

function renderLaps() {
  if (!swLapTimes.length) return;
  const times = swLapTimes.map(l => l.t);
  const best  = Math.min(...times);
  const worst = Math.max(...times);
  document.getElementById('swLapList').innerHTML = swLapTimes.map((l,i) => {
    const cls = times.length > 1 ? (l.t === best ? 'best' : l.t === worst ? 'worst' : '') : '';
    return `<div class="sw-lap-row ${cls}">
      <span class="lap-num">Lap ${l.n}</span>
      <span>${fmtMs(l.t)}</span>
    </div>`;
  }).join('');
}

function fmtMs(ms) {
  const s  = Math.floor(ms/1000)%60;
  const m  = Math.floor(ms/60000)%60;
  const cs = Math.floor((ms%1000)/10);
  return `${pad(m)}:${pad(s)}.${pad(cs)}`;
}

// Analog clock
function drawAnalog() {
  const c = document.getElementById('analog-canvas');
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height, cx = W/2, cy = H/2, r = W/2 - 10;
  ctx.clearRect(0,0,W,H);

  // Face
  ctx.beginPath();
  ctx.arc(cx,cy,r,0,Math.PI*2);
  ctx.fillStyle = '#161616';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Ticks
  for (let i=0;i<60;i++) {
    const a = (i/60)*Math.PI*2 - Math.PI/2;
    const isMaj = i%5===0;
    const len = isMaj ? 14 : 7;
    const ri = r - 4;
    ctx.beginPath();
    ctx.moveTo(cx+Math.cos(a)*(ri-len), cy+Math.sin(a)*(ri-len));
    ctx.lineTo(cx+Math.cos(a)*ri, cy+Math.sin(a)*ri);
    ctx.strokeStyle = isMaj ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)';
    ctx.lineWidth = isMaj ? 2 : 1;
    ctx.stroke();
  }

  const t = swElapsed;
  const ms_val = (t%1000)/1000;
  const sec = (Math.floor(t/1000)%60) + ms_val;
  const min = (Math.floor(t/60000)%60) + sec/60;
  const hr  = (Math.floor(t/3600000)%12) + min/60;

  // Hour hand
  drawHand(ctx,cx,cy, (hr/12)*Math.PI*2 - Math.PI/2, r*0.5, 5, '#f5f5f5');
  // Minute hand
  drawHand(ctx,cx,cy, (min/60)*Math.PI*2 - Math.PI/2, r*0.72, 3, '#f5f5f5');
  // Second hand
  drawHand(ctx,cx,cy, (sec/60)*Math.PI*2 - Math.PI/2, r*0.85, 1.5, '#ff6b2b');

  // Center
  ctx.beginPath();
  ctx.arc(cx,cy,5,0,Math.PI*2);
  ctx.fillStyle = '#ff6b2b';
  ctx.fill();
}

function drawHand(ctx,cx,cy,angle,length,width,color) {
  ctx.beginPath();
  ctx.moveTo(cx - Math.cos(angle)*length*0.2, cy - Math.sin(angle)*length*0.2);
  ctx.lineTo(cx + Math.cos(angle)*length, cy + Math.sin(angle)*length);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// Init analog
drawAnalog();

// ════════════════════════════════
// TIMER PICKER
// ════════════════════════════════
let tHour=0, tMin=5, tSec=0;

function buildTimerPickers() {
  buildPicker('tHourInner', 24, tHour, v => { tHour=v; });
  buildPicker('tMinInner',  60, tMin,  v => { tMin=v; });
  buildPicker('tSecInner',  60, tSec,  v => { tSec=v; });
}

function buildPicker(innerId, count, selected, onChange) {
  const inner = document.getElementById(innerId);
  // Clone the col to strip all previously attached event listeners
  const oldCol = inner.parentElement;
  const col = oldCol.cloneNode(true);
  oldCol.parentElement.replaceChild(col, oldCol);
  const freshInner = col.querySelector('.picker-inner') || col.querySelector('[id]');
  // Re-get inner by id after clone
  const innerEl = document.getElementById(innerId);

  const itemH = 52;
  const colH  = 156;
  const centerOff = Math.floor((colH - itemH) / 2);
  const pad2  = v => String(v).padStart(2,'0');

  innerEl.innerHTML =
    Array.from({length:count},(_,i)=>`<div class="picker-item${i===selected?' selected':''}">${pad2(i)}</div>`).join('');

  let startY=0, startOffset=0, currentIdx=selected;
  const getOffset = i => centerOff - (i * itemH);
  let offset = getOffset(selected);
  innerEl.style.transform = `translateY(${offset}px)`;

  function setIndex(i) {
    i = Math.max(0, Math.min(count-1, i));
    currentIdx = i;
    offset = getOffset(i);
    innerEl.style.transform = `translateY(${offset}px)`;
    innerEl.querySelectorAll('.picker-item').forEach((el, idx) => {
      el.classList.toggle('selected', idx === i);
    });
    onChange(i);
  }

  col.addEventListener('wheel', e => {
    e.preventDefault();
    setIndex(currentIdx + (e.deltaY > 0 ? 1 : -1));
  }, {passive:false});

  col.addEventListener('touchstart', e => { startY=e.touches[0].clientY; startOffset=offset; }, {passive:true});
  col.addEventListener('touchmove', e => {
    const dy = e.touches[0].clientY - startY;
    setIndex(Math.round((centerOff - startOffset - dy) / itemH));
  }, {passive:true});
  col.addEventListener('mousedown', e => {
    startY=e.clientY; startOffset=offset;
    const onMove = e2 => {
      const dy=e2.clientY-startY;
      setIndex(Math.round((centerOff-startOffset-dy)/itemH));
    };
    const onUp = () => { removeEventListener('mousemove',onMove); removeEventListener('mouseup',onUp); };
    addEventListener('mousemove',onMove); addEventListener('mouseup',onUp);
  });
}

buildTimerPickers();

// TIMER LOGIC
let timerRunning=false, timerTotal=0, timerRemain=0, timerStart2=0, timerRaf=null, timerCircum=515;
let timerRecents=[];

function timerStart() {
  timerTotal = (tHour*3600 + tMin*60 + tSec)*1000;
  if(!timerTotal) return;
  timerRemain = timerTotal;
  timerStart2 = performance.now();
  timerRunning = true;
  document.getElementById('timerPickerView').style.display='none';
  document.getElementById('timerRunView').style.display='block';
  document.getElementById('timerPauseBtn').textContent='Pause';
  document.getElementById('timerPauseBtn').className='circ-btn orange';
  timerRaf = requestAnimationFrame(timerTick);
  // Add to recents
  const label = fmtTimerLabel(tHour, tMin, tSec);
  if(!timerRecents.includes(label)) {
    timerRecents.unshift(label);
    if(timerRecents.length>5) timerRecents.pop();
    renderRecents();
  }
}

function timerTick() {
  const elapsed = performance.now() - timerStart2;
  timerRemain = Math.max(0, timerTotal - elapsed);
  const s = Math.ceil(timerRemain/1000);
  const m = Math.floor(s/60)%60;
  const h = Math.floor(s/3600);
  const sec = s%60;
  document.getElementById('timer-time').textContent =
    h>0 ? `${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
  const pct = timerRemain/timerTotal;
  document.getElementById('timer-ring-progress').style.strokeDashoffset =
    timerCircum * (1-pct);
  if(timerRemain <= 0) {
    timerDone(); return;
  }
  timerRaf = requestAnimationFrame(timerTick);
}

function timerDone() {
  cancelAnimationFrame(timerRaf);
  timerRunning=false;
  document.getElementById('timer-time').textContent='00:00';
  document.getElementById('timerPauseBtn').textContent='Restart';
  document.getElementById('timerPauseBtn').className='circ-btn green';
  document.getElementById('timer-ring-progress').style.stroke='var(--red)';
  setTimeout(()=>document.getElementById('timer-ring-progress').style.stroke='var(--accent)',2000);
  // Play repeating beep until user taps Restart or Cancel
  startBeep();
}

function timerPause() {
  if(timerRemain<=0) { stopBeep(); timerStart(); return; }
  if(timerRunning) {
    timerRunning=false;
    cancelAnimationFrame(timerRaf);
    timerTotal=timerRemain;
    document.getElementById('timerPauseBtn').textContent='Resume';
    document.getElementById('timerPauseBtn').className='circ-btn green';
  } else {
    timerRunning=true;
    timerStart2=performance.now();
    document.getElementById('timerPauseBtn').textContent='Pause';
    document.getElementById('timerPauseBtn').className='circ-btn orange';
    timerRaf=requestAnimationFrame(timerTick);
  }
}

function timerCancel() {
  cancelAnimationFrame(timerRaf);
  timerRunning=false;
  stopBeep();
  document.getElementById('timerPickerView').style.display='block';
  document.getElementById('timerRunView').style.display='none';
  document.getElementById('timer-ring-progress').style.strokeDashoffset=0;
  document.getElementById('timer-ring-progress').style.stroke='var(--accent)';
}

function fmtTimerLabel(h,m,s) {
  if(h) return `${h}h ${m}m`;
  if(m && s) return `${m}m ${s}s`;
  if(m) return `${m} min`;
  return `${s} sec`;
}

function renderRecents() {
  const el = document.getElementById('recentsList');
  if(!timerRecents.length) { el.innerHTML='<div class="empty-state">No recent timers</div>'; return; }
  el.innerHTML = timerRecents.map(r=>`
    <div class="recent-row" onclick="loadRecent('${r}')">
      <span class="recent-time">${r}</span>
      <span class="recent-use">Use</span>
    </div>
  `).join('');
}

function loadRecent(label) {
  // Parse label back to hms
  let h=0,m=0,s=0;
  const hm = label.match(/(\d+)h/); if(hm) h=+hm[1];
  const mm = label.match(/(\d+)m/); if(mm) m=+mm[1];
  const sm = label.match(/(\d+)\s*s/); if(sm) s=+sm[1];
  if(label.endsWith('min')) m=parseInt(label);
  if(label.endsWith('sec')) s=parseInt(label);
  tHour=h; tMin=m||0; tSec=s||0;
  buildTimerPickers();
  timerCancel();
}

// ════════════════════════════════
// ALARM PICKER
// ════════════════════════════════
let aHour=7, aMin=0, aAMPM='AM';

function buildAlarmPickers() {
  buildAlarmPicker('aHourInner', 12, aHour-1, v => { aHour=v+1; });
  buildAlarmPicker('aMinInner',  60, aMin,    v => { aMin=v; });
}

function buildAlarmPicker(innerId, count, selected, onChange) {
  const oldCol = document.getElementById(innerId).parentElement;
  const col = oldCol.cloneNode(true);
  oldCol.parentElement.replaceChild(col, oldCol);

  const innerEl = document.getElementById(innerId);
  const itemH = 52;
  const colH  = 156;
  const centerOff = Math.floor((colH - itemH) / 2);
  const isHour = innerId.includes('Hour');

  innerEl.innerHTML =
    Array.from({length:count},(_,i)=>`<div class="alarm-picker-item${i===selected?' selected':''}">${String(isHour?i+1:i).padStart(2,'0')}</div>`).join('');

  let startY=0, startOffset=0, currentIdx=selected;
  const getOff = i => centerOff - (i * itemH);
  let offset = getOff(selected);
  innerEl.style.transform = `translateY(${offset}px)`;

  function setIdx(i) {
    i = Math.max(0, Math.min(count-1, i));
    currentIdx=i; offset=getOff(i);
    innerEl.style.transform=`translateY(${offset}px)`;
    innerEl.querySelectorAll('.alarm-picker-item').forEach((el,idx)=>{
      el.classList.toggle('selected', idx === i);
    });
    onChange(i);
  }

  col.addEventListener('wheel',e=>{e.preventDefault();setIdx(currentIdx+(e.deltaY>0?1:-1));},{passive:false});
  col.addEventListener('touchstart',e=>{startY=e.touches[0].clientY;startOffset=offset;},{passive:true});
  col.addEventListener('touchmove',e=>{setIdx(Math.round((centerOff-startOffset-(e.touches[0].clientY-startY))/itemH));},{passive:true});
  col.addEventListener('mousedown',e=>{
    startY=e.clientY;startOffset=offset;
    const onMove=e2=>setIdx(Math.round((centerOff-startOffset-(e2.clientY-startY))/itemH));
    const onUp=()=>{removeEventListener('mousemove',onMove);removeEventListener('mouseup',onUp);};
    addEventListener('mousemove',onMove);addEventListener('mouseup',onUp);
  });
}

buildAlarmPickers();

function selectAMPM(v) {
  aAMPM=v;
  document.getElementById('amAM').classList.toggle('selected',v==='AM');
  document.getElementById('amPM').classList.toggle('selected',v==='PM');
}

function openModal() {
  document.getElementById('alarmModal').classList.add('show');
}
function closeModal() {
  document.getElementById('alarmModal').classList.remove('show');
}

let alarms = [];
let alarmCheckInterval = null;

function saveAlarm() {
  const h = aHour;
  const m = aMin;
  const ampm = aAMPM;
  const display = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  alarms.push({ h, m, ampm, display, on: true, id: Date.now() });
  renderAlarms();
  closeModal();
  if(!alarmCheckInterval) alarmCheckInterval = setInterval(checkAlarms, 1000);
}

function renderAlarms() {
  const el = document.getElementById('alarmList');
  if(!alarms.length) { el.innerHTML='<div class="empty-state">No alarms set</div>'; return; }
  el.innerHTML = alarms.map(a=>`
    <div class="alarm-row">
      <div>
        <div class="alarm-time-big">${a.display}<span class="alarm-ampm">${a.ampm}</span></div>
        <div class="alarm-label">Alarm</div>
      </div>
      <div class="alarm-right">
        <button class="toggle ${a.on?'on':''}" onclick="toggleAlarm(${a.id})" id="tog-${a.id}"></button>
        <button class="alarm-delete" onclick="deleteAlarm(${a.id})">Delete</button>
      </div>
    </div>
  `).join('');
}

function toggleAlarm(id) {
  const a = alarms.find(x=>x.id===id);
  if(a) { a.on=!a.on; renderAlarms(); }
}

function deleteAlarm(id) {
  alarms = alarms.filter(x=>x.id!==id);
  renderAlarms();
}

let firedAlarmKeys = new Set();

function checkAlarms() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  const key = `${h12}:${m}:${ampm}`;

  alarms.forEach(a => {
    const aKey = `${a.id}:${key}`;
    if (a.on && a.h === h12 && a.m === m && a.ampm === ampm && !firedAlarmKeys.has(aKey)) {
      firedAlarmKeys.add(aKey);
      triggerAlarm(a);
    }
  });

  // Clear fired keys when the minute changes so alarms can fire again next day
  if (now.getSeconds() === 0) {
    // Only clear keys from previous minutes
    firedAlarmKeys.forEach(k => {
      if (!k.endsWith(key)) firedAlarmKeys.delete(k);
    });
  }
}

let alarmAudioCtx = null;
let alarmMasterGain = null;
let alarmBeepInterval = null;

function getAudioCtx() {
  if (!alarmAudioCtx || alarmAudioCtx.state === 'closed') {
    alarmAudioCtx = new AudioContext();
    alarmMasterGain = alarmAudioCtx.createGain();
    alarmMasterGain.gain.value = 1;
    alarmMasterGain.connect(alarmAudioCtx.destination);
  }
  return alarmAudioCtx;
}

function playAlarmBeep() {
  try {
    const ctx2 = getAudioCtx();
    [[880, 0], [1100, 0.18]].forEach(([freq, delay]) => {
      const osc = ctx2.createOscillator();
      const gain = ctx2.createGain();
      osc.connect(gain);
      gain.connect(alarmMasterGain); // route through master, not directly to destination
      osc.frequency.value = freq;
      osc.type = 'sine';
      const t = ctx2.currentTime + delay;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.35, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  } catch(e){}
}

function stopBeep() {
  clearInterval(alarmBeepInterval);
  alarmBeepInterval = null;
  if (alarmMasterGain && alarmAudioCtx) {
    const now = alarmAudioCtx.currentTime;
    alarmMasterGain.gain.cancelScheduledValues(now);
    alarmMasterGain.gain.setValueAtTime(0, now);
  }
  if (alarmAudioCtx) {
    const ctx = alarmAudioCtx;
    alarmAudioCtx = null;
    alarmMasterGain = null;
    setTimeout(() => { try { ctx.close(); } catch(e){} }, 100);
  }
}

function startBeep() {
  // Mute and destroy the old context synchronously before creating a new one
  if (alarmMasterGain && alarmAudioCtx) {
    const now = alarmAudioCtx.currentTime;
    alarmMasterGain.gain.cancelScheduledValues(now);
    alarmMasterGain.gain.setValueAtTime(0, now);
  }
  clearInterval(alarmBeepInterval);
  alarmBeepInterval = null;
  if (alarmAudioCtx) {
    const old = alarmAudioCtx;
    alarmAudioCtx = null;
    alarmMasterGain = null;
    try { old.close(); } catch(e){}
  }
  // Now start fresh with no delay
  playAlarmBeep();
  alarmBeepInterval = setInterval(playAlarmBeep, 1200);
}

function triggerAlarm(a) {
  document.getElementById('ringTime').textContent = a.display;
  document.getElementById('ringLabel').textContent = 'Alarm';
  document.getElementById('ringOverlay').classList.add('show');
  startBeep();
}

function stopAlarm() {
  document.getElementById('ringOverlay').classList.remove('show');
  stopBeep();
}

// ════════════════════════════════
// UTILS
// ════════════════════════════════
function pad(n) { return String(Math.floor(n)).padStart(2,'0'); }