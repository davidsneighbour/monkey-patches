// ==UserScript==
// @name         Wrinkler Squasher
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.0
// @description  Click wrinklers.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/wrinkler-squasher.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/wrinkler-squasher.user.js
// ==/UserScript==

(() => {
  window.setInterval(() => {
    for (const wrinkler of window.Game.wrinklers) {
      // Check if the wrinkler exists, is active (phase 2), is normal (type 0), and has cookies
      if (wrinkler.phase === 2 && wrinkler.type === 0 && wrinkler.sucked > 0) {
        wrinkler.hp = 0; // Setting hp to 0 pops the wrinkler
      }
    }
  }, 30000);
})();
