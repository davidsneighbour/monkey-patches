// ==UserScript==
// @name         Golden Cookie Clicker
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.1
// @description  Automatically clicks golden cookies and reindeer in Cookie Clicker.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/golden-cookie-clicker.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/golden-cookie-clicker.user.js
// ==/UserScript==

(() => {
  const config = {
    pollMs: 250,
    timeoutMs: 60_000,
    // Re-checked periodically so the patch survives a later reassignment of
    // Game.shimmers (e.g. by another mod) instead of silently going stale.
    guardMs: 5000,
  };

  function isGameReady() {
    return (
      typeof window.Game === 'object' && window.Game !== null && Array.isArray(window.Game.shimmers)
    );
  }

  function isPatched(shimmers) {
    return shimmers.__goldenCookieClickerPatched === true;
  }

  function patchShimmers(shimmers) {
    const apply = (target, _this, args) => {
      const shimmer = args[0];
      if ((shimmer.type === 'golden' && !shimmer.wrath) || shimmer.type === 'reindeer') {
        window.setTimeout(() => shimmer.pop(), 500);
      }
      return Reflect.apply(target, _this, args);
    };

    Object.defineProperty(shimmers, 'push', {
      value: new Proxy(Array.prototype.push, { apply }),
      writable: true,
      enumerable: false,
      configurable: true,
    });
    Object.defineProperty(shimmers, '__goldenCookieClickerPatched', {
      value: true,
      writable: false,
      enumerable: false,
      configurable: true,
    });

    // Catch any shimmer that already existed before the patch was applied.
    for (const shimmer of shimmers) {
      if ((shimmer.type === 'golden' && !shimmer.wrath) || shimmer.type === 'reindeer') {
        window.setTimeout(() => shimmer.pop(), 500);
      }
    }
  }

  function ensurePatched() {
    if (!isGameReady()) return;
    const shimmers = window.Game.shimmers;
    if (!isPatched(shimmers)) {
      patchShimmers(shimmers);
    }
  }

  function start() {
    if (typeof Proxy !== 'function') {
      console.error(
        'Golden Cookie Clicker: JavaScript Proxy API is not available, ' +
          'either update your browser, or use the ES3 compatible version:\n' +
          'https://rainslide.neocities.org/cookieclicker/GoldenCookieClicker.es3.js',
      );
      return;
    }

    if (typeof window.Game.Win === 'function') {
      window.Game.Win('Third-party');
    }

    ensurePatched();
    // Game.shimmers can be reassigned to a fresh array by other code/mods
    // after this script runs, which would silently drop the patch.
    window.setInterval(ensurePatched, config.guardMs);
  }

  const start_time = Date.now();
  const waitForGame = window.setInterval(() => {
    if (isGameReady()) {
      window.clearInterval(waitForGame);
      start();
    } else if (Date.now() - start_time > config.timeoutMs) {
      window.clearInterval(waitForGame);
      console.error(
        'Golden Cookie Clicker: Cookie Clicker API is not ready or invalid.\n' +
          'Please make sure you are running this script on a Cookie Clicker webpage, ' +
          'and the page is fully loaded.',
      );
    }
  }, config.pollMs);
})();
