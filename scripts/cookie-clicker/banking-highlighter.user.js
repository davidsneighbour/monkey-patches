// ==UserScript==
// @name         Banking Highlighter
// @namespace    https://github.com/davidsneighbour/monkey-patches
// @author       Patrick Kollitsch
// @version      1.0.0
// @description  Highlights Cookie Clicker stock market rows by selected dollar values.
// @match        https://orteil.dashnet.org/cookieclicker/*
// @grant        GM_addStyle
// @run-at       document-idle
// @updateURL    https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/banking-highlighter.user.js
// @downloadURL  https://raw.githubusercontent.com/davidsneighbour/monkey-patches/main/scripts/cookie-clicker/banking-highlighter.user.js
// ==/UserScript==

(() => {
  const RULES = [
    // exactly $1 (green)
    { regex: /\$1(?![\d.,])/, css: '2px solid green', className: 'tm-highlight-dollar-1-exact' },
    // $1.xxx (red)
    { regex: /\$1\.\d+/, css: '2px solid red', className: 'tm-highlight-dollar-1-decimal' },
    { regex: /\$2\.\d+/, css: '2px solid orange', className: 'tm-highlight-dollar-2' },
    { regex: /\$3\.\d+/, css: '2px solid yellow', className: 'tm-highlight-dollar-3' },
  ];

  function ensureStyleInjected() {
    if (document.getElementById('tm-traffic-style')) return;
    const style = document.createElement('style');
    style.id = 'tm-traffic-style';
    style.textContent = RULES.map((r) => `.${r.className} { border: ${r.css} !important; }`).join(
      '\n',
    );
    document.head.appendChild(style);
  }

  function updateHighlighting(root = document) {
    const nodes = root.querySelectorAll('div.bankGood');
    for (const el of nodes) {
      const text = el.textContent || '';

      for (const rule of RULES) {
        el.classList.remove(rule.className);
      }

      for (const rule of RULES) {
        if (rule.regex.test(text)) {
          el.classList.add(rule.className);
          break;
        }
      }
    }
  }

  function startObserver() {
    const observer = new MutationObserver(() => updateHighlighting(document));
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function init() {
    ensureStyleInjected();
    updateHighlighting(document);
    startObserver();
  }

  GM_addStyle(`
    .bankHidden {
      opacity: 0.25 !important;
    }
    #bankGraphBox {
      display:none !important;
    }
  `);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
