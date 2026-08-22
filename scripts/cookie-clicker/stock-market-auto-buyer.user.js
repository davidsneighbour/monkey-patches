// ==UserScript==
// @name         Stock Market Auto Buyer
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.0
// @description  Automatically buys all affordable stock in the Bank's Stock Market minigame whenever a good's value drops below a configurable threshold.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/stock-market-auto-buyer.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/stock-market-auto-buyer.user.js
// ==/UserScript==

(() => {
  const config = {
    // The "value: $X.XX" line shown in each stock's box. Buy everything
    // affordable for a good once its value drops below this.
    buyBelowValue: 1.2,
    // How often to scan the market and buy, in milliseconds. Kept short
    // because a good's value can swing several dollars per in-game tick
    // (~1s), so a longer interval can miss a dip below buyBelowValue entirely.
    intervalMs: 2_000,
    pollMs: 250,
    timeoutMs: 60_000,
  };

  function isReady() {
    return (
      typeof window.Game === 'object' &&
      window.Game !== null &&
      window.Game.Objects &&
      window.Game.Objects['Bank'] &&
      window.Game.Objects['Bank'].minigameLoaded === true &&
      Array.isArray(window.Game.Objects['Bank'].minigame?.goodsById)
    );
  }

  function buyCheapGoods() {
    const minigame = window.Game.Objects['Bank'].minigame;
    for (const good of minigame.goodsById) {
      if (!good.active) continue;
      if (good.val >= config.buyBelowValue) continue;
      // 10000 is the game's own "buy as many as I can afford" sentinel,
      // used by the native "Max" button (see minigameMarket.js buyGood).
      const bought = minigame.buyGood(good.id, 10000);
      if (!bought) {
        // buyGood returns false with no other feedback; this is normal
        // when the good is already at its warehouse cap, but logging it
        // makes that distinguishable from an actual missed buy.
        console.debug(
          `Stock Market Auto Buyer: skipped good #${good.id} at $${good.val.toFixed(2)} ` +
            `(stock ${good.stock}/${minigame.getGoodMaxStock(good)}, cookies ${window.Game.cookies}).`,
        );
      }
    }
  }

  const start = Date.now();
  const waitForMarket = window.setInterval(() => {
    if (isReady()) {
      window.clearInterval(waitForMarket);
      buyCheapGoods();
      window.setInterval(buyCheapGoods, config.intervalMs);
    } else if (Date.now() - start > config.timeoutMs) {
      window.clearInterval(waitForMarket);
      console.error(
        'Stock Market Auto Buyer: the Bank stock market minigame was not ready in time.\n' +
          'Please make sure you are running this script on a Cookie Clicker webpage, ' +
          'the page is fully loaded, and the Bank building has been bought.',
      );
    }
  }, config.pollMs);
})();
