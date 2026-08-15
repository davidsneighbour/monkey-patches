// ==UserScript==
// @name         Default Bulk Buy
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.0
// @description  Switches the store's buy quantity to x10 on load instead of Cookie Clicker's default x1.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/default-bulk-buy.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/default-bulk-buy.user.js
// ==/UserScript==

(() => {
  const config = {
    pollMs: 250,
    timeoutMs: 60_000,
  };

  function isReady() {
    return (
      typeof window.Game === 'object' &&
      window.Game !== null &&
      typeof window.Game.storeBulkButton === 'function' &&
      document.getElementById('storeBulk10') !== null
    );
  }

  function selectBulkTen() {
    if (window.Game.buyBulk === 10) return;
    document.getElementById('storeBulk10').click();
  }

  const start = Date.now();
  const waitForStore = window.setInterval(() => {
    if (isReady()) {
      window.clearInterval(waitForStore);
      selectBulkTen();
    } else if (Date.now() - start > config.timeoutMs) {
      window.clearInterval(waitForStore);
      console.error(
        'Default Bulk Buy: Cookie Clicker store was not ready in time.\n' +
          'Please make sure you are running this script on a Cookie Clicker webpage, ' +
          'and the page is fully loaded.',
      );
    }
  }, config.pollMs);
})();
