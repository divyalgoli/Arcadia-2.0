// player.js — turn order & single/two player mode handling
const CandyPlayer = (() => {
  const SYMBOLS = { P1: '🍭', P2: '🍬' };
  let current = 'P1';
  let mode = 'ai'; // 'ai' | 'two'
  let difficulty = 'medium';

  function init(config) {
    mode = config.mode || 'ai';
    difficulty = config.difficulty || 'medium';
    current = 'P1';
  }

  function getSymbol(playerKey) {
    return SYMBOLS[playerKey];
  }

  function getCurrent() {
    return current;
  }

  function isComputerTurn() {
    return mode === 'ai' && current === 'P2';
  }

  function switchTurn() {
    current = current === 'P1' ? 'P2' : 'P1';
    return current;
  }

  function getMode() { return mode; }
  function getDifficulty() { return difficulty; }

  return { SYMBOLS, init, getSymbol, getCurrent, isComputerTurn, switchTurn, getMode, getDifficulty };
})();
