// ==UserScript==
// @name         Lucky Clicker
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.1
// @description  Click lucky news.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/lucky-clicker.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/lucky-clicker.user.js
// ==/UserScript==

(() => {
  'use strict';

  const config = {
    intervalMs: 250,
    pollMs: 250,
    timeoutMs: 60_000,
    log: true,
  };

  function info(...args) {
    if (config.log) {
      console.log('[cookie-clicker-fortune-clicker]', ...args);
    }
  }

  function isGameReady() {
    return typeof window.Game !== 'undefined' && typeof window.Game.tickerL !== 'undefined';
  }

  function clickFortuneIfPresent() {
    try {
      if (window.Game.TickerEffect && window.Game.TickerEffect.type === 'fortune') {
        window.Game.tickerL.click();
        info('Clicked a fortune.');
      }
    } catch (error) {
      console.error('[cookie-clicker-fortune-clicker] Failed while checking ticker:', error);
    }
  }

  function start() {
    if (window.__cookieClickerFortuneClickerInterval) {
      window.clearInterval(window.__cookieClickerFortuneClickerInterval);
      info('Stopped previous watcher.');
    }

    window.__cookieClickerFortuneClickerInterval = window.setInterval(
      clickFortuneIfPresent,
      config.intervalMs,
    );

    info(`Started. Checking every ${config.intervalMs} ms.`);
    info('To stop it later, run: clearInterval(window.__cookieClickerFortuneClickerInterval);');
  }

  const start_time = Date.now();
  const waitForGame = window.setInterval(() => {
    if (isGameReady()) {
      window.clearInterval(waitForGame);
      start();
    } else if (Date.now() - start_time > config.timeoutMs) {
      window.clearInterval(waitForGame);
      console.error(
        '[cookie-clicker-fortune-clicker] Cookie Clicker was not ready in time.\n' +
          'Please make sure you are running this script on a Cookie Clicker webpage, ' +
          'and the page is fully loaded.',
      );
    }
  }, config.pollMs);
})();
