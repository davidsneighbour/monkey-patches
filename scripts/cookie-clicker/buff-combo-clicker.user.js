// ==UserScript==
// @name         Buff Combo Clicker
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.2
// @description  Auto-clicks combo buffs and casts Force the Hand of Fate when positive golden-cookie effects are close to expiring.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        none
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/buff-combo-clicker.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/buff-combo-clicker.user.js
// ==/UserScript==

(() => {
  'use strict';

  const config = {
    // Auto-click only while at least this many positive golden-cookie buffs
    // (Frenzy, Click frenzy, Cookie storm, ...) are active simultaneously.
    minActiveBuffs: 2,
    // How fast to click the big cookie while the condition holds.
    clicksPerSecond: 30,
    handOfFateBuffWindowSeconds: 50,
    handOfFateSingleBuffCutoffSeconds: 30,
    handOfFateCastCooldownMs: 1000,
    pollMs: 250,
    timeoutMs: 60_000,
  };

  let lastHandOfFateCastAt = 0;

  function isGameReady() {
    return (
      typeof window.Game === 'object' &&
      window.Game !== null &&
      typeof window.Game.ClickCookie === 'function' &&
      typeof window.Game.buffs === 'object' &&
      typeof window.Game.ObjectsById === 'object'
    );
  }

  function getBuffRemainingSeconds(buff) {
    const fps =
      typeof window.Game.fps === 'number' && window.Game.fps > 0 ? window.Game.fps : 30;
    return Number.isFinite(buff.time) ? buff.time / fps : Number.POSITIVE_INFINITY;
  }

  function getPositiveBuffs() {
    const buffs = [];
    for (const name in window.Game.buffs) {
      // The game itself tags golden-cookie buffs with aura:1 (positive,
      // e.g. Frenzy, Click frenzy) or aura:2 (negative, e.g. Clot) - see
      // Game.buffType() definitions in the game's own main.js. Buffs from
      // other sources (haggler's luck, pixie luck, ...) carry no aura and
      // are correctly excluded here.
      const buff = window.Game.buffs[name];
      if (buff.aura === 1) {
        buffs.push({
          name,
          remainingSeconds: getBuffRemainingSeconds(buff),
        });
      }
    }
    return buffs;
  }

  function getGrimoire() {
    return window.Game.ObjectsById[7]?.minigame;
  }

  function getHandOfFateSpell(grimoire) {
    return grimoire?.spells?.['hand of fate'];
  }

  function canCastHandOfFate(grimoire, spell) {
    if (
      typeof grimoire?.castSpell !== 'function' ||
      typeof grimoire.getSpellCost !== 'function' ||
      typeof grimoire.magic !== 'number' ||
      typeof grimoire.magicM !== 'number' ||
      typeof spell !== 'object' ||
      spell === null
    ) {
      return false;
    }

    const cost = grimoire.getSpellCost(spell);
    return Number.isFinite(cost) && grimoire.magic >= cost;
  }

  function shouldCastHandOfFate(positiveBuffs, grimoire) {
    if (positiveBuffs.length === 0) return false;

    const expiringBuffs = positiveBuffs.filter(
      (buff) => buff.remainingSeconds <= config.handOfFateBuffWindowSeconds,
    );
    if (expiringBuffs.length === 0) return false;

    const isMagicFull = grimoire.magic >= grimoire.magicM;
    if (!isMagicFull && positiveBuffs.length < config.minActiveBuffs) return false;

    if (
      isMagicFull &&
      positiveBuffs.length === 1 &&
      positiveBuffs[0].remainingSeconds < config.handOfFateSingleBuffCutoffSeconds
    ) {
      return false;
    }

    return true;
  }

  function maybeCastHandOfFate(positiveBuffs) {
    const now = Date.now();
    if (now - lastHandOfFateCastAt < config.handOfFateCastCooldownMs) return;

    const grimoire = getGrimoire();
    const spell = getHandOfFateSpell(grimoire);
    if (
      !canCastHandOfFate(grimoire, spell) ||
      !shouldCastHandOfFate(positiveBuffs, grimoire)
    ) {
      return;
    }

    if (grimoire.castSpell(spell)) {
      lastHandOfFateCastAt = now;
    }
  }

  function tick() {
    const positiveBuffs = getPositiveBuffs();
    maybeCastHandOfFate(positiveBuffs);

    if (positiveBuffs.length >= config.minActiveBuffs) {
      window.Game.ClickCookie();
    }
  }

  function start() {
    window.setInterval(tick, Math.round(1000 / config.clicksPerSecond));
  }

  const start_time = Date.now();
  const waitForGame = window.setInterval(() => {
    if (isGameReady()) {
      window.clearInterval(waitForGame);
      start();
    } else if (Date.now() - start_time > config.timeoutMs) {
      window.clearInterval(waitForGame);
      console.error(
        'Buff Combo Clicker: Cookie Clicker API is not ready or invalid.\n' +
        'Please make sure you are running this script on a Cookie Clicker webpage, ' +
        'and the page is fully loaded.',
      );
    }
  }, config.pollMs);
})();
