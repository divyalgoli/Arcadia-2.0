// ui.js
// Only touches the DOM to reflect game state — no movement, collision, or
// scoring logic lives here. Expects the existing HTML to already contain
// elements with the IDs referenced below; this module never creates HTML.
//
// Expected element IDs (adjust here if the markup differs):
//   #timer, #round-number, #tagger-name, #runner-name
//   #player1-score, #player2-score
//   #player1-energy-bar, #player2-energy-bar
//   #player1-dash-cooldown, #player2-dash-cooldown
//   #loading-screen, #countdown-overlay, #countdown-number
//   #pause-menu, #game-over-screen, #winner-name
//   #btn-restart, #btn-resume, #btn-settings

const el = (id) => document.getElementById(id);

// ---------------------------------------------------------------------------
// HUD updates
// ---------------------------------------------------------------------------

/** Updates the round timer display. Accepts seconds remaining (number). */
function updateTimer(secondsRemaining) {
  const node = el('timer');
  if (!node) return;
  const clamped = Math.max(0, Math.ceil(secondsRemaining));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  node.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Updates both players' score displays. */
function updateScore(player1Score, player2Score) {
  const p1 = el('player1-score');
  const p2 = el('player2-score');
  if (p1) p1.textContent = String(player1Score);
  if (p2) p2.textContent = String(player2Score);
}

/** Updates the current round number display. */
function updateRound(roundNumber) {
  const node = el('round-number');
  if (node) node.textContent = String(roundNumber);
}

/**
 * Updates the role badges. #runner-name lives inside Player 1's card and
 * #tagger-name lives inside Player 2's card, so each badge must reflect
 * THAT card's own player's current role — not simply "whoever is tagger" —
 * or the badge ends up showing the other player's role/name instead.
 */
function updateRoles(player1Role, player2Role) {
  applyRoleBadge(el('runner-name'), player1Role);
  applyRoleBadge(el('tagger-name'), player2Role);
}

function applyRoleBadge(node, role) {
  if (!node) return;
  const isTagger = role === ROLES.TAGGER;
  node.textContent = isTagger ? 'Chaser' : 'Runner';
  node.classList.toggle('role-chaser', isTagger);
  node.classList.toggle('role-runner', !isTagger);
}

/** Updates a single player's energy bar. percent is 0..100. */
function updateEnergyBar(playerId, percent) {
  const node = el(`${playerId}-energy-bar`);
  if (!node) return;
  const clamped = Math.max(0, Math.min(100, percent));
  node.style.width = `${clamped}%`;
}

/**
 * Updates a single player's dash cooldown indicator.
 * percentRemaining is 0 (ready) .. 1 (just used).
 */
function updateDashCooldown(playerId, percentRemaining) {
  const node = el(`${playerId}-dash-cooldown`);
  if (!node) return;
  const readyPercent = (1 - Math.max(0, Math.min(1, percentRemaining))) * 100;
  node.style.width = `${readyPercent}%`;
  node.classList.toggle('ready', percentRemaining <= 0);
}

// ---------------------------------------------------------------------------
// Screens / overlays
// ---------------------------------------------------------------------------

function show(elementId) {
  const node = el(elementId);
  if (node) node.classList.remove('hidden');
}

function hide(elementId) {
  const node = el(elementId);
  if (node) node.classList.add('hidden');
}

function showLoadingScreen() {
  show('loading-screen');
}

function hideLoadingScreen() {
  hide('loading-screen');
}

/** Shows the pre-round countdown overlay with a given number/text. */
function showCountdown(value) {
  show('countdown-overlay');
  const numberNode = el('countdown-number');
  if (numberNode) numberNode.textContent = String(value);
}

function hideCountdown() {
  hide('countdown-overlay');
}

function showPauseMenu() {
  show('pause-menu');
}

function hidePauseMenu() {
  hide('pause-menu');
}

/** Shows the final game-over/winner screen with the winning player's label. */
function showGameOverScreen(winnerLabel, player1Score, player2Score) {
  const winnerNode = el('winner-name');
  if (winnerNode) winnerNode.textContent = winnerLabel;
  const p1Node = el('gameover-score-p1');
  const p2Node = el('gameover-score-p2');
  if (p1Node && player1Score !== undefined) p1Node.textContent = String(player1Score);
  if (p2Node && player2Score !== undefined) p2Node.textContent = String(player2Score);
  show('game-over-screen');
}

function hideGameOverScreen() {
  hide('game-over-screen');
}

/** Rebuilds the leaderboard popup's list from real recorded match results. */
function renderLeaderboard(entries) {
  const list = document.querySelector('.leaderboard-list');
  if (!list) return;
  list.innerHTML = '';

  if (!entries || entries.length === 0) {
    const li = document.createElement('li');
    li.className = 'leaderboard-row';
    li.innerHTML = '<span class="lb-name">No matches played yet — play a round!</span>';
    list.appendChild(li);
    return;
  }

  entries.forEach((entry, index) => {
    const li = document.createElement('li');
    li.className = `leaderboard-row rank-${index + 1}`;
    const rank = String(index + 1).padStart(2, '0');
    const rankSpan = document.createElement('span');
    rankSpan.className = 'rank';
    rankSpan.textContent = rank;
    const nameSpan = document.createElement('span');
    nameSpan.className = 'lb-name';
    nameSpan.textContent = entry.name;
    const scoreSpan = document.createElement('span');
    scoreSpan.className = 'lb-score';
    scoreSpan.textContent = String(entry.score);
    li.append(rankSpan, nameSpan, scoreSpan);
    list.appendChild(li);
  });
}

// ---------------------------------------------------------------------------
// Button bindings
// ---------------------------------------------------------------------------

/**
 * Wires up existing menu buttons to callbacks provided by game.js.
 * Safe to call once during initialization; does nothing for missing buttons.
 */
function bindMenuButtons({ onRestart, onResume, onSettings } = {}) {
  const restartBtn = el('btn-restart');
  const resumeBtn = el('btn-resume');
  const settingsBtn = el('btn-settings');

  if (restartBtn && onRestart) {
    restartBtn.addEventListener('click', onRestart);
  }
  if (resumeBtn && onResume) {
    resumeBtn.addEventListener('click', onResume);
  }
  if (settingsBtn && onSettings) {
    settingsBtn.addEventListener('click', onSettings);
  }
}

/** Resets all HUD elements to their initial state at the start of a match. */
function resetHud() {
  updateTimer(0);
  updateScore(0, 0);
  updateRound(1);
  updateEnergyBar('player1', 100);
  updateEnergyBar('player2', 100);
  updateDashCooldown('player1', 0);
  updateDashCooldown('player2', 0);
  hideCountdown();
  hidePauseMenu();
  hideGameOverScreen();
}

// ---------------------------------------------------------------------------
// Namespace object — game.js calls these as ui.updateTimer(...), etc.
// (equivalent to `import * as ui from './ui.js'` under the ES module setup).
// ---------------------------------------------------------------------------
const ui = {
  updateTimer,
  updateScore,
  updateRound,
  updateRoles,
  updateEnergyBar,
  updateDashCooldown,
  showLoadingScreen,
  hideLoadingScreen,
  showCountdown,
  hideCountdown,
  showPauseMenu,
  hidePauseMenu,
  showGameOverScreen,
  hideGameOverScreen,
  renderLeaderboard,
  bindMenuButtons,
  resetHud,
};
