// script.js - Sorteador de Times de Airsoft

const players = [];
const classes = ['Asalto','DMR','Sniper','Suporte','Medico'];

const el = id => document.getElementById(id);
const playersListEl = el('playersList');
const teamAListEl = el('teamAList');
const teamBListEl = el('teamBList');
const teamANameEl = el('teamAName');
const teamBNameEl = el('teamBName');
const startBtn = el('startGameBtn');
const countdownEl = el('countdown');

el('addPlayerBtn').addEventListener('click', () => {
  const name = el('playerName').value.trim();
  const cls = el('playerClass').value;
  if(!name) return alert('Digite o nome do jogador.');
  players.push({name, cls});
  el('playerName').value = '';
  renderPlayers();
});

function renderPlayers(){
  playersListEl.innerHTML = '';
  players.forEach((p, i) => {
    const li = document.createElement('li');
    li.textContent = `${p.name} — ${p.cls}`;
    const btn = document.createElement('button');
    btn.textContent = 'Remover';
    btn.style.marginLeft='8px';
    btn.addEventListener('click', ()=> { players.splice(i,1); renderPlayers(); });
    li.appendChild(btn);
    playersListEl.appendChild(li);
  });
}

function shuffleArray(a){
  for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}

function generateTeamNames() {
  const names = ['ALFA', 'BETA', 'BRAVO', 'CHARLE', 'HOME', 'TANGO'];
  
  
  const pickRandom = () => names[Math.floor(Math.random() * names.length)];
  
  let teamA = pickRandom();
  let teamB = pickRandom();
  

  while(teamB === teamA) {
    teamB = pickRandom();
  }
  
  return [teamA, teamB];
}



function balanceTeams(playersList){
  // strategy: group by class, distribute alternating to keep balance
  const byClass = {};
  classes.forEach(c=> byClass[c]=[]);
  playersList.forEach(p=> byClass[p.cls] ? byClass[p.cls].push(p) : (byClass[p.cls]=[p]));
  const teamA = [], teamB = [];
  // sort classes by count desc to distribute big groups first
  const classGroups = Object.keys(byClass).sort((a,b)=> byClass[b].length - byClass[a].length);
  classGroups.forEach(cls=>{
    shuffleArray(byClass[cls]);
    byClass[cls].forEach((player, idx)=>{
      if(idx%2===0) teamA.push(player); else teamB.push(player);
    });
  });
  // If team sizes differ by more than 1, move random players
  while(Math.abs(teamA.length - teamB.length) > 1){
    if(teamA.length > teamB.length) teamB.push(teamA.pop());
    else teamA.push(teamB.pop());
  }
  return [teamA, teamB];
}

el('shuffleBtn').addEventListener('click', ()=>{
  if(players.length < 2) return alert('Adicione pelo menos 2 jogadores.');
  const [teamA, teamB] = balanceTeams(players.slice());
  const [tAName, tBName] = generateTeamNames();
  teamANameEl.textContent = tAName;
  teamBNameEl.textContent = tBName;
  teamAListEl.innerHTML = '';
  teamBListEl.innerHTML = '';
  teamA.forEach(p => { const li=document.createElement('li'); li.textContent=`${p.name} — ${p.cls}`; teamAListEl.appendChild(li); });
  teamB.forEach(p => { const li=document.createElement('li'); li.textContent=`${p.name} — ${p.cls}`; teamBListEl.appendChild(li); });
  startBtn.disabled = false;
  // store current teams on button dataset for start
  startBtn.dataset.teamA = JSON.stringify(teamA);
  startBtn.dataset.teamB = JSON.stringify(teamB);
  startBtn.dataset.time = el('gameTime').value;
});


// Sirene de início do jogo (longa e aguda)
function playStartSiren() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    // Frequência sobe e segura agudo
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 1.5);
    osc.frequency.setValueAtTime(1800, now + 3);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.6, now + 0.3);
    gain.gain.setValueAtTime(0.6, now + 3);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 4);

    osc.start(now);
    osc.stop(now + 4.5);
  } catch (e) {
    console.warn("Web Audio API não disponível", e);
  }
}

// Sirene de fim do jogo (estilo ambulância)
function playEndSiren() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    // Alterna entre grave (600Hz) e agudo (1000Hz)
    for (let i = 0; i < 6; i++) {
      const t = now + i * 0.6;
      const freq = i % 2 === 0 ? 600 : 1000;
      osc.frequency.setValueAtTime(freq, t);
    }

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.6);

    osc.start(now);
    osc.stop(now + 3.6);
  } catch (e) {
    console.warn("Web Audio API não disponível", e);
  }
}


startBtn.addEventListener('click', ()=>{
  // disable controls
  startBtn.disabled = true;
  el('shuffleBtn').disabled = true;
  el('addPlayerBtn').disabled = true;
  const seconds = parseInt(startBtn.dataset.time) * 60;
  // countdown 10 seconds before start
  let t = 10;
  countdownEl.textContent = `Iniciando em ${t}s`;
  const preInterval = setInterval(()=>{
    t--;
    countdownEl.textContent = `Iniciando em ${t}s`;
    if(t<=0){
      clearInterval(preInterval);
      playStartSiren();
      // start main timer
      let rem = seconds;
      const mainInterval = setInterval(()=>{
        const mins = Math.floor(rem/60);
        const secs = rem%60;
        countdownEl.textContent = `Tempo restante: ${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        rem--;
        if(rem < 0){
          clearInterval(mainInterval);
          playEndSiren();
          countdownEl.textContent = 'Jogo encerrado.';
          // re-enable controls
          el('shuffleBtn').disabled = false;
          el('addPlayerBtn').disabled = false;
        }
      }, 1000);
    }
  }, 1000);
});