(function(){
  "use strict";

  /* ============================================================
     NAVIGATION
  ============================================================ */
  const screens = document.querySelectorAll('.screen');
  function showScreen(name){
    screens.forEach(s => s.classList.toggle('active', s.id === 'screen-' + name));
    if(name === 'game'){ startMatch(true); }
    else {
      Game.running = false;
      clearInterval(Game.countdownTimer);
      Game.countdownTimer = null;
    }
  }
  document.querySelectorAll('[data-nav]').forEach(el=>{
    el.addEventListener('click', ()=> showScreen(el.getAttribute('data-nav')));
  });
  document.getElementById('gameBackBtn').addEventListener('click', ()=> showScreen('home'));
  document.getElementById('pauseHomeBtn').addEventListener('click', ()=> showScreen('home'));
  document.getElementById('winHomeBtn').addEventListener('click', ()=> showScreen('home'));
  document.getElementById('exitBtn').addEventListener('click', ()=>{
    window.location.href = '../../index.html';
  });

  /* ============================================================
     SETTINGS STATE
  ============================================================ */
  const Settings = { speed: 2, paddleSize: 2, sound: true, nameA: 'Player 1', nameB: 'Player 2' };
  const speedLabels = {1:'Slow',2:'Medium',3:'Fast'};
  const paddleLabels = {1:'Small',2:'Medium',3:'Large'};
  const speedSlider = document.getElementById('speedSlider');
  const paddleSlider = document.getElementById('paddleSlider');
  speedSlider.addEventListener('input', ()=>{
    Settings.speed = +speedSlider.value;
    document.getElementById('speedLabel').textContent = speedLabels[Settings.speed];
  });
  paddleSlider.addEventListener('input', ()=>{
    Settings.paddleSize = +paddleSlider.value;
    document.getElementById('paddleLabel').textContent = paddleLabels[Settings.paddleSize];
    Game.applyPaddleSize();
  });
  const soundSwitch = document.getElementById('soundSwitch');
  soundSwitch.classList.add('is-on');
  soundSwitch.addEventListener('click', ()=>{
    Settings.sound = !Settings.sound;
    soundSwitch.classList.toggle('is-on', Settings.sound);
  });
  const nameA = document.getElementById('nameA');
  const nameB = document.getElementById('nameB');
  function syncNames(){
    Settings.nameA = nameA.value.trim() || 'Player 1';
    Settings.nameB = nameB.value.trim() || 'Player 2';
    document.getElementById('hudNameA').textContent = Settings.nameA;
    document.getElementById('hudNameB').textContent = Settings.nameB;
  }
  nameA.addEventListener('input', syncNames);
  nameB.addEventListener('input', syncNames);

  /* ============================================================
     SOUND (WebAudio, no assets needed)
  ============================================================ */
  let actx = null;
  function beep(freq, dur, vol){
    if(!Settings.sound) return;
    try{
      if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(); const g = actx.createGain();
      o.type = 'square'; o.frequency.value = freq;
      g.gain.value = vol || 0.06;
      o.connect(g); g.connect(actx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + (dur||0.08));
      o.stop(actx.currentTime + (dur||0.08));
    }catch(e){}
  }

  /* ============================================================
     LEADERBOARD (session memory only)
  ============================================================ */
  const Leaderboard = { entries: [] };
  function addResult(winnerName, scoreLine){
    Leaderboard.entries.unshift({ name: winnerName, score: scoreLine });
    Leaderboard.entries = Leaderboard.entries.slice(0, 20);
    renderLeaderboard();
  }
  function renderLeaderboard(){
    const list = document.getElementById('lbList');
    if(!Leaderboard.entries.length){
      list.innerHTML = '<div class="empty-state">No matches played yet this session — win a game to see it here 🏓</div>';
      return;
    }
    list.innerHTML = Leaderboard.entries.map((e,i)=>`
      <div class="lb-row">
        <div class="lb-rank">${i+1}</div>
        <div class="lb-name">${e.name}</div>
        <div class="lb-score">${e.score}</div>
      </div>
    `).join('');
  }
  document.getElementById('clearLbBtn').addEventListener('click', ()=>{
    Leaderboard.entries = []; renderLeaderboard();
  });
  renderLeaderboard();

  /* ============================================================
     HERO ILLUSTRATION (home screen) — swoosh motif, css-animated
  ============================================================ */
  document.getElementById('heroStage').innerHTML = `
  <svg viewBox="0 0 400 400" style="width:100%;height:100%;overflow:visible;">
    <g transform="rotate(-24 200 200)">
      <rect x="60" y="90" width="280" height="220" rx="18" fill="var(--table)" stroke="var(--ink)" stroke-width="8"/>
      <line x1="200" y1="98" x2="200" y2="302" stroke="var(--table-line)" stroke-width="5"/>
      <line x1="60" y1="200" x2="340" y2="200" stroke="var(--table-line)" stroke-width="3" opacity="0.85" stroke-dasharray="10 8"/>
      <circle cx="300" cy="140" r="16" fill="none" stroke="var(--ink)" stroke-width="7" opacity="0.5"/>
    </g>
    <g id="heroBall">
      <path d="M120 300 C 160 260, 220 260, 250 190" stroke="var(--panel)" stroke-width="26" fill="none" stroke-linecap="round" opacity="0.55"/>
      <circle cx="250" cy="190" r="17" fill="var(--ball)" stroke="var(--ink)" stroke-width="6"/>
    </g>
    <g transform="translate(60 300) rotate(-24)">
      <circle cx="0" cy="0" r="46" fill="var(--paddle-a)" stroke="var(--ink)" stroke-width="8"/>
      <rect x="-9" y="40" width="18" height="46" rx="8" fill="var(--paddle-a-dark)" stroke="var(--ink)" stroke-width="7"/>
    </g>
  </svg>`;

  /* ============================================================
     GAME ENGINE
  ============================================================ */
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('gameStage');

  const Game = {
    W:0, H:0, dpr:1,
    ball:{x:0,y:0,vx:0,vy:0,r:10,trail:[]},
    pA:{y:0,h:110,w:16,vy:0},
    pB:{y:0,h:110,w:16,vy:0},
    score:{a:0,b:0},
    running:false, paused:false, serving:true,
    keys:{}, touchA:null, touchB:null,
    winScore:11,
    particles:[],
    countdownTimer:null,
    applyPaddleSize(){
      const sizes = {1:80,2:110,3:150};
      this.pA.h = sizes[Settings.paddleSize];
      this.pB.h = sizes[Settings.paddleSize];
    }
  };

  function resizeCanvas(){
    const rect = stage.getBoundingClientRect();
    const prevW = Game.W, prevH = Game.H;
    Game.dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * Game.dpr;
    canvas.height = rect.height * Game.dpr;
    Game.W = rect.width; Game.H = rect.height;
    ctx.setTransform(Game.dpr,0,0,Game.dpr,0,0);

    if(Game.running && prevW > 0 && prevH > 0){
      const ratioH = Game.H / prevH;
      Game.pA.y = Math.max(0, Math.min(Game.H - Game.pA.h, Game.pA.y * ratioH));
      Game.pB.y = Math.max(0, Math.min(Game.H - Game.pB.h, Game.pB.y * ratioH));
      Game.ball.x = Game.ball.x * (Game.W / prevW);
      Game.ball.y = Game.ball.y * ratioH;
    } else {
      Game.pA.y = Game.H/2 - Game.pA.h/2;
      Game.pB.y = Game.H/2 - Game.pB.h/2;
    }
  }
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);

  function resetBall(direction){
    Game.ball.x = Game.W/2; Game.ball.y = Game.H/2;
    const speedBase = [3.2,4.6,6.4][Settings.speed-1];
    const angle = (Math.random()*0.6 - 0.3);
    Game.ball.vx = speedBase * (direction || (Math.random()<0.5?-1:1));
    Game.ball.vy = speedBase * Math.sin(angle) * 1.4;
    Game.ball.trail = [];
  }

  function startMatch(fresh){
    Game.applyPaddleSize();
    resizeCanvas();
    if(fresh){
      Game.score.a = 0; Game.score.b = 0;
      updateScoreHud();
      document.getElementById('winOverlay').classList.remove('show');
      document.getElementById('pauseOverlay').classList.remove('show');
      syncNames();
    }
    Game.paused = false;
    Game.running = true;
    resetBall();
    countdownThenServe();
    requestAnimationFrame(loop);
  }

  function countdownThenServe(){
    Game.serving = true;
    clearInterval(Game.countdownTimer);
    const el = document.getElementById('countdownNum');
    let n = 3;
    el.textContent = n; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    Game.countdownTimer = setInterval(()=>{
      n--;
      if(n>0){ el.textContent = n; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
      else {
        clearInterval(Game.countdownTimer);
        Game.countdownTimer = null;
        el.textContent='GO'; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
        Game.serving=false;
      }
    }, 650);
  }

  function updateScoreHud(){
    const a = document.getElementById('scoreA'), b = document.getElementById('scoreB');
    a.textContent = Game.score.a; b.textContent = Game.score.b;
  }
  function bumpScore(which){
    const el = document.getElementById(which === 'a' ? 'scoreA' : 'scoreB');
    el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump');
  }

  function spawnBurst(x,y,color){
    for(let i=0;i<14;i++){
      const a = Math.random()*Math.PI*2, sp = 1.5+Math.random()*3.5;
      Game.particles.push({x,y,vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1, color});
    }
  }

  function scorePoint(who){
    if(who==='a'){ Game.score.a++; bumpScore('a'); }
    else { Game.score.b++; bumpScore('b'); }
    updateScoreHud();
    beep(who==='a'?520:340, 0.18, 0.08);
    spawnBurst(Game.ball.x, Game.ball.y, who==='a' ? getVar('--paddle-a') : getVar('--paddle-b'));

    if(Game.score.a >= Game.winScore || Game.score.b >= Game.winScore){
      endMatch(Game.score.a > Game.score.b ? 'a' : 'b');
    } else {
      resetBall(who==='a' ? 1 : -1);
      countdownThenServe();
    }
  }

  function getVar(name){ return getComputedStyle(document.documentElement).getPropertyValue(name).trim(); }

  function endMatch(winner){
    Game.running = false;
    const name = winner==='a' ? Settings.nameA : Settings.nameB;
    const title = document.getElementById('winTitle');
    const sub = document.getElementById('winSub');
    title.textContent = `${name} Wins!`;
    sub.textContent = `${Game.score.a} – ${Game.score.b}`;
    document.getElementById('winOverlay').classList.add('show');
    beep(700,0.4,0.09);
    addResult(name, `${Game.score.a} – ${Game.score.b}`);
    if (window.Arcadia) {
      const margin = Math.max(Game.score.a, Game.score.b) - Math.min(Game.score.a, Game.score.b);
      Arcadia.submitScore('ping-pong-v2', 'Ping Pong', margin);
    }
  }

  document.getElementById('rematchBtn').addEventListener('click', ()=>{
    document.getElementById('winOverlay').classList.remove('show');
    startMatch(true);
  });

  /* ---- Input: keyboard (PC) ---- */
  function isTypingTarget(el){
    return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }
  window.addEventListener('keydown', (e)=>{
    const gameActive = document.getElementById('screen-game').classList.contains('active');
    const typing = isTypingTarget(document.activeElement);
    if(typing) return;
    const k = e.key.toLowerCase();
    if(gameActive && ['w','s','arrowup','arrowdown',' '].includes(k)) e.preventDefault();
    Game.keys[k] = true;
    if(k === ' ' && gameActive){
      togglePause();
    }
  });
  window.addEventListener('keyup', (e)=>{
    if(isTypingTarget(document.activeElement)) return;
    Game.keys[e.key.toLowerCase()] = false;
  });

  function togglePause(){
    if(!Game.running) return;
    Game.paused = !Game.paused;
    document.getElementById('pauseOverlay').classList.toggle('show', Game.paused);
  }
  document.getElementById('pauseBtn').addEventListener('click', togglePause);
  document.getElementById('resumeBtn').addEventListener('click', togglePause);

  /* ---- Input: touch / pen / mouse drag, split by half of stage (mobile + PC) ---- */
  function attachPointerControl(zoneEl, key){
    let activeId = null;
    zoneEl.addEventListener('pointerdown', (e)=>{
      activeId = e.pointerId;
      Game[key] = e.clientY;
      if(zoneEl.setPointerCapture){ try{ zoneEl.setPointerCapture(e.pointerId); }catch(err){} }
      e.preventDefault();
    });
    zoneEl.addEventListener('pointermove', (e)=>{
      if(e.pointerId !== activeId) return;
      Game[key] = e.clientY;
      e.preventDefault();
    });
    function release(e){
      if(e.pointerId !== activeId) return;
      activeId = null;
      Game[key] = null;
    }
    zoneEl.addEventListener('pointerup', release);
    zoneEl.addEventListener('pointercancel', release);
    zoneEl.addEventListener('pointerleave', release);
  }
  attachPointerControl(document.getElementById('zoneLeft'), 'touchA');
  attachPointerControl(document.getElementById('zoneRight'), 'touchB');

  /* ---- Physics update ---- */
  function stepBall(){
    const b = Game.ball;

    if(b.y - b.r < 0){ b.y = b.r; b.vy *= -1; beep(300,0.05,0.03); return true; }
    if(b.y + b.r > Game.H){ b.y = Game.H - b.r; b.vy *= -1; beep(300,0.05,0.03); return true; }

    const speedCap = [3.2,4.6,6.4][Settings.speed-1] * 2.4;

    const paX = 26;
    if(b.vx < 0 && b.x - b.r <= paX + Game.pA.w && b.x - b.r > paX - 12 &&
       b.y > Game.pA.y - b.r && b.y < Game.pA.y + Game.pA.h + b.r){
      const rel = (b.y - (Game.pA.y + Game.pA.h/2)) / (Game.pA.h/2);
      const speed = Math.min(Math.hypot(b.vx,b.vy) * 1.045, speedCap);
      const angle = rel * 0.9;
      b.vx = Math.abs(Math.cos(angle)*speed);
      b.vy = Math.sin(angle)*speed;
      b.x = paX + Game.pA.w + b.r;
      beep(440,0.06,0.05);
      spawnBurst(b.x,b.y,getVar('--paddle-a'));
      return true;
    }
    const pbX = Game.W - 26 - Game.pB.w;
    if(b.vx > 0 && b.x + b.r >= pbX && b.x + b.r < pbX + Game.pB.w + 12 &&
       b.y > Game.pB.y - b.r && b.y < Game.pB.y + Game.pB.h + b.r){
      const rel = (b.y - (Game.pB.y + Game.pB.h/2)) / (Game.pB.h/2);
      const speed = Math.min(Math.hypot(b.vx,b.vy) * 1.045, speedCap);
      const angle = rel * 0.9;
      b.vx = -Math.abs(Math.cos(angle)*speed);
      b.vy = Math.sin(angle)*speed;
      b.x = pbX - b.r;
      beep(440,0.06,0.05);
      spawnBurst(b.x,b.y,getVar('--paddle-b'));
      return true;
    }
    return false;
  }

  function update(){
    const rect = stage.getBoundingClientRect();

    const paddleSpeed = 7.2;
    if(Game.touchA != null){
      const targetY = (Game.touchA - rect.top) - Game.pA.h/2;
      Game.pA.y += (targetY - Game.pA.y) * 0.35;
    } else {
      if(Game.keys['w']) Game.pA.y -= paddleSpeed;
      if(Game.keys['s']) Game.pA.y += paddleSpeed;
    }
    if(Game.touchB != null){
      const targetY = (Game.touchB - rect.top) - Game.pB.h/2;
      Game.pB.y += (targetY - Game.pB.y) * 0.35;
    } else {
      if(Game.keys['arrowup']) Game.pB.y -= paddleSpeed;
      if(Game.keys['arrowdown']) Game.pB.y += paddleSpeed;
    }
    Game.pA.y = Math.max(0, Math.min(Game.H - Game.pA.h, Game.pA.y));
    Game.pB.y = Math.max(0, Math.min(Game.H - Game.pB.h, Game.pB.y));

    if(Game.serving || Game.paused) return;

    const b = Game.ball;
    b.trail.unshift({x:b.x, y:b.y});
    if(b.trail.length > 10) b.trail.pop();

    const speedNow = Math.hypot(b.vx, b.vy);
    const steps = Math.max(1, Math.ceil(speedNow / 8));
    const stepVx = b.vx / steps, stepVy = b.vy / steps;
    for(let i=0; i<steps; i++){
      b.x += stepVx; b.y += stepVy;
      if(b.x < -30 || b.x > Game.W + 30) break;
      if(stepBall()) break;
    }

    if(b.x < -30) scorePoint('b');
    if(b.x > Game.W + 30) scorePoint('a');

    Game.particles.forEach(p=>{ p.x += p.vx; p.y += p.vy; p.vy += 0.12; p.life -= 0.035; });
    Game.particles = Game.particles.filter(p=>p.life>0);
  }

  /* ---- Draw ---- */
  function draw(){
    const cInk = getVar('--ink'), cTable = getVar('--table'), cTable2 = getVar('--table-2');
    const cLine = getVar('--table-line'), cBall = getVar('--ball'), cShadow = getVar('--ball-shadow');
    const cA = getVar('--paddle-a'), cAd = getVar('--paddle-a-dark');
    const cB = getVar('--paddle-b'), cBd = getVar('--paddle-b-dark');

    ctx.clearRect(0,0,Game.W,Game.H);

    const g = ctx.createLinearGradient(0,0,Game.W,Game.H);
    g.addColorStop(0, cTable); g.addColorStop(1, cTable2);
    ctx.fillStyle = g;
    ctx.fillRect(0,0,Game.W,Game.H);

    ctx.strokeStyle = cLine; ctx.globalAlpha = 0.7; ctx.lineWidth = 3;
    ctx.setLineDash([14,12]);
    ctx.beginPath(); ctx.moveTo(Game.W/2,8); ctx.lineTo(Game.W/2,Game.H-8); ctx.stroke();
    ctx.setLineDash([]); ctx.globalAlpha = 1;

    ctx.strokeStyle = cLine; ctx.globalAlpha = 0.25; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(Game.W-10, 10, 34, 0, Math.PI*2); ctx.stroke();
    ctx.globalAlpha = 1;

    Game.ball.trail.forEach((t,i)=>{
      const a = (1 - i/Game.ball.trail.length) * 0.35;
      ctx.beginPath();
      ctx.fillStyle = cBall;
      ctx.globalAlpha = a;
      ctx.arc(t.x, t.y, Game.ball.r * (1 - i/Game.ball.trail.length*0.5), 0, Math.PI*2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    drawPaddle(26, Game.pA.y, Game.pA.w, Game.pA.h, cA, cAd, cInk, false);
    drawPaddle(Game.W-26-Game.pB.w, Game.pB.y, Game.pB.w, Game.pB.h, cB, cBd, cInk, true);

    ctx.beginPath();
    ctx.fillStyle = cBall;
    ctx.strokeStyle = cInk; ctx.lineWidth = 3;
    ctx.arc(Game.ball.x, Game.ball.y, Game.ball.r, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();

    Game.particles.forEach(p=>{
      ctx.globalAlpha = Math.max(p.life,0);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x,p.y,3.4,0,Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function drawPaddle(x,y,w,h,color,dark,ink,mirrored){
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, w, h, 8);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = dark;
    ctx.globalAlpha = 0.5;
    roundRect(ctx, x + (mirrored?0:w*0.55), y, w*0.45, h, 8);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  }
  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function loop(){
    if(!document.getElementById('screen-game').classList.contains('active')) return;
    if(Game.running && !Game.paused){ update(); }
    draw();
    requestAnimationFrame(loop);
  }

  showScreen('home');
  const observer = new MutationObserver(()=>{
    if(document.getElementById('screen-game').classList.contains('active')){
      const hb = document.getElementById('hintBanner');
      hb.style.opacity = '0.92';
      clearTimeout(window.__hintTimer);
      window.__hintTimer = setTimeout(()=>{ hb.style.opacity = '0'; }, 3200);

      const rh = document.getElementById('rotateHint');
      if(rh){
        rh.style.opacity = '0.92';
        clearTimeout(window.__rotateHintTimer);
        window.__rotateHintTimer = setTimeout(()=>{ rh.style.opacity = '0'; }, 3200);
      }
    }
  });
  observer.observe(document.getElementById('screen-game'), {attributes:true, attributeFilter:['class']});

})();
