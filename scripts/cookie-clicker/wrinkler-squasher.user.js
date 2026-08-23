// ==UserScript==
// @name         Wrinkler Squasher
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.1
// @description  Click wrinklers.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/wrinkler-squasher.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/wrinkler-squasher.user.js
// ==/UserScript==

(() => {
  'use strict';

  const config = {
    intervalMs: 30_000,
    pollMs: 250,
    timeoutMs: 60_000,
  };

  function isReady() {
    return (
      typeof window.Game === 'object' &&
      window.Game !== null &&
      Array.isArray(window.Game.wrinklers)
    );
  }

  function squashWrinklers() {
    for (const wrinkler of window.Game.wrinklers) {
      // phase 2 = fully grown, type 0 = normal (not shiny), sucked > 0 = holds cookies to reclaim
      if (wrinkler.phase === 2 && wrinkler.type === 0 && wrinkler.sucked > 0) {
        wrinkler.hp = 0; // Setting hp to 0 pops the wrinkler
      }
    }
  }

  const start = Date.now();
  const waitForGame = window.setInterval(() => {
    if (isReady()) {
      window.clearInterval(waitForGame);
      window.setInterval(squashWrinklers, config.intervalMs);
    } else if (Date.now() - start > config.timeoutMs) {
      window.clearInterval(waitForGame);
      console.error(
        'Wrinkler Squasher: Cookie Clicker API is not ready or invalid.\n' +
          'Please make sure you are running this script on a Cookie Clicker webpage, ' +
          'and the page is fully loaded.',
      );
    }
  }, config.pollMs);
})();
