// ==UserScript==
// @name         Golden Cookie Clicker
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.0
// @description  Automatically clicks golden cookies and reindeer in Cookie Clicker.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/golden-cookie-clicker.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/golden-cookie-clicker.user.js
// ==/UserScript==

(() => {
  if (
    typeof window.Game !== 'object' ||
    window.Game === null ||
    !Array.isArray(window.Game.shimmers)
  ) {
    console.error(
      'Golden Cookie Clicker: Cookie Clicker API is not ready or invalid.\n' +
        'Please make sure you are running this script on a Cookie Clicker webpage, ' +
        'and the page is fully loaded.',
    );
  } else if (typeof Proxy !== 'function') {
    console.error(
      'Golden Cookie Clicker: JavaScript Proxy API is not available, ' +
        'either update your browser, or use the ES3 compatible version:\n' +
        'https://rainslide.neocities.org/cookieclicker/GoldenCookieClicker.es3.js',
    );
  } else {
    const apply = (target, _this, args) => {
      const shimmer = args[0];
      if ((shimmer.type === 'golden' && !shimmer.wrath) || shimmer.type === 'reindeer') {
        window.setTimeout(() => shimmer.pop(), 500);
      }
      return Reflect.apply(target, _this, args);
    };

    Object.defineProperty(window.Game.shimmers, 'push', {
      value: new Proxy(window.Game.shimmers.push, { apply }),
      writable: true,
      enumerable: false,
      configurable: true,
    });

    if (typeof window.Game.Win === 'function') {
      window.Game.Win('Third-party');
    }
  }
})();
