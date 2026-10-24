(function () {
  "use strict";

  var prompt = null;
  var overlay = null;
  var frame = null;
  var lastFocus = null;

  function buildPrompt() {
    if (prompt) {
      return prompt;
    }
    prompt = document.createElement("div");
    prompt.id = "p101-center-prompt";
    prompt.hidden = true;
    prompt.innerHTML = [
      '<span class="p101-center-prompt-kicker">PYTHON CENTER</span>',
      '<span class="p101-center-prompt-text">Walk inside to use the PC. Shift 00 starts with <code>print()</code>.</span>'
    ].join("");
    document.body.appendChild(prompt);
    return prompt;
  }

  function buildOverlay() {
    if (overlay) {
      return overlay;
    }

    overlay = document.createElement("div");
    overlay.id = "p101-center";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Python Center computer");
    overlay.innerHTML = [
      '<div class="p101-center-shell">',
      '  <header class="p101-center-bar">',
      '    <div class="p101-center-brand">',
      '      <span>PYTHON CENTER</span>',
      '      <small>PC &middot; 13 shifts &middot; print() to OOP</small>',
      '    </div>',
      '    <div class="p101-center-actions">',
      '      <a href="course/index.html" target="_blank" rel="noopener">Open full page</a>',
      '      <button type="button" data-close>Close <kbd>Esc</kbd></button>',
      '    </div>',
      '  </header>',
      '  <iframe title="Python 101 course" src="course/index.html"></iframe>',
      '  <p class="p101-center-hint">Shift 00 starts with <code>print("Messenger online")</code>. Use the rail to move from print to classes.</p>',
      '</div>'
    ].join("");

    document.body.appendChild(overlay);
    frame = overlay.querySelector("iframe");
    overlay.querySelector("[data-close]").addEventListener("click", close);
    return overlay;
  }

  function open() {
    buildOverlay();
    if (!overlay.hidden) {
      return;
    }
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("p101-center-open");
    var closeButton = overlay.querySelector("[data-close]");
    if (closeButton) {
      closeButton.focus();
    }
  }

  function close() {
    if (!overlay || overlay.hidden) {
      return;
    }
    overlay.hidden = true;
    document.body.classList.remove("p101-center-open");
    if (lastFocus && typeof lastFocus.focus === "function" && document.contains(lastFocus)) {
      lastFocus.focus();
    }
  }

  function setPrompt(message, visible) {
    var node = buildPrompt();
    if (message) {
      node.querySelector(".p101-center-prompt-text").textContent = message;
    }
    node.hidden = !visible;
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay && !overlay.hidden) {
      event.preventDefault();
      close();
    }
  });

  window.__python101CenterUI = {
    open: open,
    close: close,
    isOpen: function () {
      return Boolean(overlay && !overlay.hidden);
    },
    setPrompt: setPrompt
  };
})();
