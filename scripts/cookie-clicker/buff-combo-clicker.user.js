// ==UserScript==
// @name         Buff Combo Clicker
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.0
// @description  Auto-clicks the big cookie at a configurable rate whenever two or more positive golden-cookie effects (e.g. Frenzy + Click frenzy) are active at once.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/buff-combo-clicker.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/buff-combo-clicker.user.js
// ==/UserScript==

(() => {
  'use strict';

  const config = {
    // Auto-click only while at least this many positive golden-cookie buffs
    // (Frenzy, Click frenzy, Cookie storm, ...) are active simultaneously.
    minActiveBuffs: 2,
    // How fast to click the big cookie while the condition holds.
    clicksPerSecond: 7,
    pollMs: 250,
    timeoutMs: 60_000,
  };

  function isGameReady() {
    return (
      typeof window.Game === 'object' &&
      window.Game !== null &&
      typeof window.Game.ClickCookie === 'function' &&
      typeof window.Game.buffs === 'object'
    );
  }

  function countPositiveBuffs() {
    let count = 0;
    for (const name in window.Game.buffs) {
      // The game itself tags golden-cookie buffs with aura:1 (positive,
      // e.g. Frenzy, Click frenzy) or aura:2 (negative, e.g. Clot) - see
      // Game.buffType() definitions in the game's own main.js. Buffs from
      // other sources (haggler's luck, pixie luck, ...) carry no aura and
      // are correctly excluded here.
      if (window.Game.buffs[name].aura === 1) count++;
    }
    return count;
  }

  function tick() {
    if (countPositiveBuffs() >= config.minActiveBuffs) {
      window.Game.ClickCookie();
    }
  }

  function start() {
    window.setInterval(tick, Math.round(1000 / config.clicksPerSecond));
  }

  const start_time = Date.now();
  const waitForGame = window.setInterval(() => {
    if (isGameReady()) {
      window.clearInterval(waitForGame);
      start();
    } else if (Date.now() - start_time > config.timeoutMs) {
      window.clearInterval(waitForGame);
      console.error(
        'Buff Combo Clicker: Cookie Clicker API is not ready or invalid.\n' +
          'Please make sure you are running this script on a Cookie Clicker webpage, ' +
          'and the page is fully loaded.',
      );
    }
  }, config.pollMs);
})();
