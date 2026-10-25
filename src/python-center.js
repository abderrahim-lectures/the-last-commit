(function () {
  "use strict";

  var PROGRESS_KEY = "messenger-python-progress-v1";
  var POST_KEY = "python101_center_post";
  var SEEN_KEY = "python101_center_seen";
  var prompt = null;
  var overlay = null;
  var stage = null;
  var hint = null;
  var fullLink = null;
  var frames = {};
  var posts = {};
  var activePost = "learn";
  var lastFocus = null;
  var progressTimer = 0;

  var NOTES = {
    learn: 'Shift 00 starts with <code>print("Messenger online")</code>. Press Run, then Check.',
    play: "Change the toy and press Run. Python runs in this browser tab.",
    guide: "Find the ATM computer on the wall, press E, type one line, check it, then take the next shift."
  };

  function buildPrompt() {
    if (prompt) {
      return prompt;
    }
    prompt = document.createElement("div");
    prompt.id = "p101-center-prompt";
    prompt.hidden = true;
    prompt.innerHTML = [
      '<span class="p101-center-prompt-kicker">PYTHON PC</span>',
      '<span class="p101-center-prompt-text">Walk up and press E. Shift 00 starts with <code>print()</code>.</span>'
    ].join("");
    document.body.appendChild(prompt);
    return prompt;
  }

  function completedCount() {
    try {
      var raw = JSON.parse(localStorage.getItem(PROGRESS_KEY) || "[]");
      return Array.isArray(raw) ? raw.length : 0;
    } catch (error) {
      return 0;
    }
  }

  function readPost() {
    try {
      return localStorage.getItem(POST_KEY);
    } catch (error) {
      return null;
    }
  }

  function writePost(name) {
    try {
      localStorage.setItem(POST_KEY, name);
    } catch (error) {}
  }

  function firstPost() {
    var saved = readPost();
    if (saved && NOTES[saved]) {
      return saved;
    }
    try {
      if (localStorage.getItem(SEEN_KEY) !== "1") {
        localStorage.setItem(SEEN_KEY, "1");
        return "guide";
      }
    } catch (error) {}
    return "learn";
  }

  function routeMarkup() {
    return [
      '<section class="p101-guide" aria-label="Step by step route">',
      '  <p class="p101-guide-kicker">ROUTE CARD</p>',
      "  <h2>Your first five minutes</h2>",
      "  <p class=\"p101-guide-lead\">Follow this script at your own pace. The PC keeps your place.</p>",
      "  <p class=\"p101-guide-classic\"><strong>Classic route:</strong> in the Gen 1-7 games, the PC sits inside the Center. It sits on the office wall by the street. Walk up and press E.</p>",
      '  <div class="p101-route-posts">',
      '    <button type="button" data-go="learn"><span>01</span><strong>Learn PC</strong><small>13 shifts, from print to classes</small></button>',
      '    <button type="button" data-go="play"><span>02</span><strong>Play PC</strong><small>Type Python and run it for fun</small></button>',
      "  </div>",
      '  <ol class="p101-route-steps">',
      "    <li><span>1</span><div><strong>Find the Python PC.</strong><p>Walk to the ATM computer on the office wall. Press E when the prompt appears.</p></div></li>",
      "    <li><span>2</span><div><strong>Open Shift 00.</strong><p>Read &ldquo;A small planet&rdquo;. It introduces <code>print()</code>, strings, comments, and variables.</p></div></li>",
      '    <li><span>3</span><div><strong>Type one line.</strong><p>In the editor, write <code>print("Messenger online")</code>. Press <b>Run</b> and read the output.</p></div></li>',
      "    <li><span>4</span><div><strong>Press Check.</strong><p>Tests compare your output with the shift. When they pass, Shift 00 is complete.</p></div></li>",
      "    <li><span>5</span><div><strong>Take the next shift.</strong><p>Choose Shift 01, &ldquo;Five on the list&rdquo;. Then meet the Office Worker for the first quiz battle.</p></div></li>",
      "  </ol>",
      '  <div class="p101-route-progress" aria-live="polite">',
      '    <div class="p101-route-bar"><i></i></div>',
      '    <p><span class="p101-route-count">0 / 13 shifts cleared</span><span class="p101-route-next">Shift 00 is waiting.</span></p>',
      "  </div>",
      '  <aside class="p101-route-note"><strong>Remember:</strong> text lives inside quotes. A variable stores a value. A comment starts with <code>#</code> and Python ignores it.</aside>',
      "</section>"
    ].join("");
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
    overlay.setAttribute("aria-label", "Python PC computer");
    overlay.innerHTML = [
      '<div class="p101-center-shell">',
      '  <header class="p101-center-bar">',
      '    <div class="p101-center-brand">',
      "      <span>PYTHON PC</span>",
      "      <small>PC &middot; 3 posts &middot; print() to OOP</small>",
      "    </div>",
      '    <div class="p101-center-actions">',
      '      <a href="course/index.html" target="_blank" rel="noopener" data-full>Open full page</a>',
      '      <button type="button" data-close>Close <kbd>Esc</kbd></button>',
      "    </div>",
      "  </header>",
      '  <nav class="p101-center-posts" role="tablist" aria-label="Python Center posts">',
      '    <button type="button" role="tab" data-post="learn">LEARN PC</button>',
      '    <button type="button" role="tab" data-post="play">PLAY PC</button>',
      '    <button type="button" role="tab" data-post="guide">ROUTE</button>',
      "  </nav>",
      '  <div class="p101-center-stage" data-stage></div>',
      '  <p class="p101-center-hint" data-hint></p>',
      "</div>"
    ].join("");

    document.body.appendChild(overlay);
    stage = overlay.querySelector("[data-stage]");
    hint = overlay.querySelector("[data-hint]");
    fullLink = overlay.querySelector("[data-full]");

    frames.learn = document.createElement("iframe");
    frames.learn.title = "Python 101 course";
    frames.learn.dataset.view = "learn";
    frames.learn.setAttribute("role", "tabpanel");
    frames.learn.hidden = true;
    stage.appendChild(frames.learn);

    frames.play = document.createElement("iframe");
    frames.play.title = "Python play PC";
    frames.play.dataset.view = "play";
    frames.play.setAttribute("role", "tabpanel");
    frames.play.hidden = true;
    stage.appendChild(frames.play);
    [frames.learn, frames.play].forEach(function (frame) {
      frame.addEventListener("load", function () {
        try {
          frame.contentDocument.addEventListener("keydown", function (event) {
            if (event.key === "Escape") {
              event.preventDefault();
              close();
            }
          });
        } catch (error) {}
      });
    });

    var guide = document.createElement("div");
    guide.dataset.view = "guide";
    guide.hidden = true;
    guide.setAttribute("role", "tabpanel");
    guide.innerHTML = routeMarkup();
    stage.appendChild(guide);

    posts = {
      learn: frames.learn,
      play: frames.play,
      guide: guide
    };

    overlay.querySelector("[data-close]").addEventListener("click", close);
    overlay.querySelectorAll("[data-post]").forEach(function (button) {
      button.addEventListener("click", function () {
        showPost(button.getAttribute("data-post"), true);
      });
    });
    guide.querySelectorAll("[data-go]").forEach(function (button) {
      button.addEventListener("click", function () {
        showPost(button.getAttribute("data-go"), true);
      });
    });
    window.addEventListener("storage", function (event) {
      if (event.key === PROGRESS_KEY) {
        updateRoute();
      }
    });
    return overlay;
  }

  function updateRoute() {
    if (!overlay) {
      return;
    }
    var count = completedCount();
    var total = 13;
    var current = overlay.querySelector(".p101-route-count");
    var next = overlay.querySelector(".p101-route-next");
    var bar = overlay.querySelector(".p101-route-bar i");
    if (current) {
      current.textContent = count + " / " + total + " shifts cleared";
    }
    if (bar) {
      bar.style.width = Math.min(100, (count / total) * 100) + "%";
    }
    if (next) {
      if (count >= total) {
        next.textContent = "All shifts cleared. The quiz battles are open.";
      } else if (count === 0) {
        next.textContent = "Shift 00 is waiting.";
      } else if (count === 1) {
        next.textContent = "Shift 00 cleared. Next: Shift 01, Five on the list.";
      } else {
        next.textContent = "Keep going. The next shift is ready.";
      }
    }
  }

  function showPost(name, focus) {
    if (!posts[name]) {
      name = "learn";
    }
    activePost = name;
    Object.keys(posts).forEach(function (key) {
      var view = posts[key];
      var selected = key === name;
      view.hidden = !selected;
      var tab = overlay.querySelector('[data-post="' + key + '"]');
      if (tab) {
        tab.setAttribute("aria-selected", selected ? "true" : "false");
        tab.tabIndex = selected ? 0 : -1;
      }
    });
    if (name === "learn" && !frames.learn.src) {
      frames.learn.src = "course/index.html";
    }
    if (name === "play" && !frames.play.src) {
      frames.play.src = "course/play.html";
    }
    if (hint) {
      hint.innerHTML = NOTES[name] || "";
    }
    if (fullLink) {
      fullLink.hidden = name === "guide";
      fullLink.href = name === "play" ? "course/play.html" : "course/index.html";
      fullLink.textContent = name === "play" ? "Open Play PC" : "Open full page";
    }
    updateRoute();
    writePost(name);
    if (focus) {
      var selectedTab = overlay.querySelector('[data-post="' + name + '"]');
      if (selectedTab) {
        selectedTab.focus();
      }
    }
  }

  function open() {
    buildOverlay();
    if (!overlay.hidden) {
      return;
    }
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add("p101-center-open");
    showPost(firstPost(), false);
    var closeButton = overlay.querySelector("[data-close]");
    if (closeButton) {
      closeButton.focus();
    }
    window.clearInterval(progressTimer);
    progressTimer = window.setInterval(function () {
      if (overlay && !overlay.hidden) {
        updateRoute();
      }
    }, 1500);
  }

  function close() {
    if (!overlay || overlay.hidden) {
      return;
    }
    overlay.hidden = true;
    document.body.classList.remove("p101-center-open");
    window.clearInterval(progressTimer);
    progressTimer = 0;
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
    setPrompt: setPrompt,
    showPost: showPost
  };
})();
