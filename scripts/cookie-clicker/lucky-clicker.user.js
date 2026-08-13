// ==UserScript==
// @name         Lucky Clicker
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.0
// @description  Click lucky news.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/lucky-clicker.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/lucky-clicker.user.js
// ==/UserScript==

(() => {
  const config = {
    intervalMs: 250,
    log: true,
  };

  /**
   * Logs messages with a consistent prefix.
   *
   * @param {...unknown} args - Values to log.
   * @returns {void}
   */
  function info(...args) {
    if (config.log) {
      console.log('[cookie-clicker-fortune-clicker]', ...args);
    }
  }

  /**
   * Validates that the required Cookie Clicker globals exist.
   *
   * @returns {boolean}
   */
  function isGameReady() {
    return typeof window.Game !== 'undefined' && typeof window.Game.tickerL !== 'undefined';
  }

  if (!isGameReady()) {
    console.error(
      '[cookie-clicker-fortune-clicker] Cookie Clicker is not ready yet. Open the game first, then run the script again.',
    );
    return;
  }

  if (window.__cookieClickerFortuneClickerInterval) {
    clearInterval(window.__cookieClickerFortuneClickerInterval);
    info('Stopped previous watcher.');
  }

  /**
   * Clicks the ticker when the current ticker effect is a fortune.
   *
   * @returns {void}
   */
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

  window.__cookieClickerFortuneClickerInterval = window.setInterval(
    clickFortuneIfPresent,
    config.intervalMs,
  );

  info(`Started. Checking every ${config.intervalMs} ms.`);
  info('To stop it later, run: clearInterval(window.__cookieClickerFortuneClickerInterval);');
})();
