// ==UserScript==
// @name         Auto Cookie Monster
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @version      1.0.0
// @description  Automatically loads Cookie Monster after Cookie Clicker is ready.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/auto-cookie-monster.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/auto-cookie-monster.user.js
// ==/UserScript==

(function autoCookieMonster() {
  const config = {
    modUrl: 'https://cookiemonsterteam.github.io/CookieMonster/dist/CookieMonster.js',
    waitMs: 5000,
    timeoutMs: 60_000,
  };

  function fail(message, error) {
    console.error('[Auto Cookie Monster]', message, error || '');
  }

  const poll = (condition, everyMs, timeoutMs) =>
    new Promise((resolve, reject) => {
      const start = Date.now();

      function cleanup() {
        window.clearInterval(intervalId);
      }

      const intervalId = window.setInterval(() => {
        try {
          if (condition()) {
            cleanup();
            resolve();
            return;
          }

          if (Date.now() - start > timeoutMs) {
            cleanup();
            reject(new Error(`Timed out after ${timeoutMs} ms`));
          }
        } catch (error) {
          cleanup();
          reject(error);
        }
      }, everyMs);
    });

  (async () => {
    try {
      await poll(
        () => typeof window.Game !== 'undefined' && typeof window.Game.LoadMod === 'function',
        config.waitMs,
        config.timeoutMs,
      );
      window.Game.LoadMod(config.modUrl);
      console.log('[Auto Cookie Monster] Cookie Monster requested:', config.modUrl);
    } catch (error) {
      fail('Could not load Cookie Monster.', error);
    }
  })();
})();
