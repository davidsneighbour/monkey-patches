// ==UserScript==
// @name         Stock Market Auto Seller
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.1
// @description  Automatically sells all held stock in the Bank's Stock Market minigame whenever a good's value rises above a configurable threshold.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/stock-market-auto-seller.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/stock-market-auto-seller.user.js
// ==/UserScript==

(() => {
  'use strict';

  const config = {
    // The "value: $X.XX" line shown in each stock's box. Sell everything
    // held for a good once its value rises above this.
    sellAboveValue: 170,
    // How often to scan the market and sell, in milliseconds. Good values
    // in practice don't change more often than every ~30s, so 25s catches
    // a spike above sellAboveValue without polling far more than necessary.
    intervalMs: 25_000,
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

  function sellExpensiveGoods() {
    const minigame = window.Game.Objects['Bank'].minigame;
    for (const good of minigame.goodsById) {
      if (!good.active) continue;
      if (good.stock <= 0) continue;
      if (good.val <= config.sellAboveValue) continue;
      // 10000 is the game's own "sell as many as I hold" sentinel, used by
      // the native "Sell all" button (see minigameMarket.js sellGood).
      const sold = minigame.sellGood(good.id, 10000);
      if (!sold) {
        // sellGood returns false with no other feedback; logging it makes
        // an unexpected missed sell distinguishable from a normal no-op.
        console.debug(
          `Stock Market Auto Seller: skipped good #${good.id} at $${good.val.toFixed(2)} ` +
            `(stock ${good.stock}, cookies ${window.Game.cookies}).`,
        );
      }
    }
  }

  const start = Date.now();
  const waitForMarket = window.setInterval(() => {
    if (isReady()) {
      window.clearInterval(waitForMarket);
      sellExpensiveGoods();
      window.setInterval(sellExpensiveGoods, config.intervalMs);
    } else if (Date.now() - start > config.timeoutMs) {
      window.clearInterval(waitForMarket);
      console.error(
        'Stock Market Auto Seller: the Bank stock market minigame was not ready in time.\n' +
        'Please make sure you are running this script on a Cookie Clicker webpage, ' +
        'the page is fully loaded, and the Bank building has been bought.',
      );
    }
  }, config.pollMs);
})();
