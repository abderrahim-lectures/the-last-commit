(function () {
  "use strict";

  var bus = window.__python101Bus;
  var bank = window.Python101QuizBank || {};
  if (!bus) {
    return;
  }

  var originalEmit = bus.emit.bind(bus);
  var ORDER = ["office-worker-2", "caveman", "factory-worker-a", "oldwoman", "diver"];
  var passed = loadPassed();
  var pendingNpc = null;
  var lockTimer = 0;
  var active = null;
  var ui = null;

  var MAX_HP = 30;
  var CORRECT_DAMAGE = 15;
  var WRONG_DAMAGE = 10;

  var GATES = {
    "office-worker-2": ["quest-employee", 0],
    "caveman": ["quest-caveman", 0],
    "factory-worker-a": ["quest-scientists", 0],
    "oldwoman": ["quest-temple", 0],
    "diver": ["quest-musician", 0]
  };

  function loadPassed() {
    try {
      var saved = JSON.parse(localStorage.getItem("python101_battle_passed") || "{}");
      return saved && typeof saved === "object" ? saved : Object.create(null);
    } catch (error) {
      return Object.create(null);
    }
  }

  function savePassed() {
    try {
      localStorage.setItem("python101_battle_passed", JSON.stringify(passed));
    } catch (error) {}
  }

  function stepComplete(npcId) {
    var gate = GATES[npcId];
    if (!gate) {
      return false;
    }
    try {
      var saved = JSON.parse(localStorage.getItem("App3D_data") || "{}");
      var quest = saved.questProgress && saved.questProgress[gate[0]];
      return Array.isArray(quest) && quest[gate[1]] === true;
    } catch (error) {
      return false;
    }
  }

  function cleared(npcId) {
    return Boolean(passed[npcId]) || stepComplete(npcId);
  }

  function firstMissing(npcId) {
    var index = ORDER.indexOf(npcId);
    if (index < 0) {
      return null;
    }
    for (var i = 0; i < index; i++) {
      if (!cleared(ORDER[i])) {
        return ORDER[i];
      }
    }
    return null;
  }

  function shouldGate(npcId, npc) {
    if (npc && npc._questEnabled === false) {
      return false;
    }
    if (!bank[npcId] || !GATES[npcId] || cleared(npcId)) {
      return false;
    }
    return true;
  }

  function showLock(npcId) {
    var missing = firstMissing(npcId);
    var data = missing && bank[missing];
    var node = document.getElementById("p101-lock");
    if (!node) {
      node = document.createElement("div");
      node.id = "p101-lock";
      node.setAttribute("role", "status");
      document.body.appendChild(node);
    }
    node.textContent = data
      ? "Python Center: finish " + data.shift + " first. Then come back for " + bank[npcId].shift + "."
      : "Python Center: finish the earlier shifts first.";
    node.classList.add("is-visible");
    window.clearTimeout(lockTimer);
    lockTimer = window.setTimeout(function () {
      node.classList.remove("is-visible");
    }, 4200);
  }

  function build() {
    if (ui) {
      return;
    }

    var root = document.createElement("div");
    root.id = "python101-battle";
    root.className = "p101-battle";
    root.hidden = true;
    root.innerHTML = [
      '<div class="p101-backdrop"></div>',
      '<section class="p101-card" role="dialog" aria-modal="true" aria-labelledby="p101-battle-title" tabindex="-1">',
      '  <div class="p101-top">',
      '    <div class="p101-fighter p101-player" data-player>',
      '      <div class="p101-fighter-name">PYTHON STUDENT</div>',
      '      <div class="p101-hp-row">',
      '        <span class="p101-hp-label">HP</span>',
      '        <div class="p101-hp-track"><div class="p101-hp-fill" data-player-hp></div></div>',
      '        <span class="p101-hp-text" data-player-hp-text>30 / 30</span>',
      '      </div>',
      '    </div>',
      '    <div class="p101-vs">VS</div>',
      '    <div class="p101-fighter p101-opponent" data-opponent>',
      '      <div class="p101-fighter-name" data-opponent-name>OFFICE WORKER</div>',
      '      <div class="p101-hp-row">',
      '        <span class="p101-hp-label">HP</span>',
      '        <div class="p101-hp-track"><div class="p101-hp-fill" data-opponent-hp></div></div>',
      '        <span class="p101-hp-text" data-opponent-hp-text>30 / 30</span>',
      '      </div>',
      '    </div>',
      '  </div>',
      '  <div class="p101-body">',
      '    <div class="p101-kicker" data-kicker>SHIFT 00-02</div>',
      '    <h2 class="p101-title" id="p101-battle-title">First shift check</h2>',
      '    <p class="p101-prompt" data-prompt></p>',
      '    <div class="p101-options" data-options></div>',
      '    <p class="p101-feedback" data-feedback aria-live="polite"></p>',
      '    <div class="p101-foot">',
      '      <span data-progress></span>',
      '      <span>Correct: 15 damage. Wrong: 10 HP.</span>',
      '    </div>',
      '    <div class="p101-actions" data-actions hidden></div>',
      '  </div>',
      '</section>'
    ].join("");

    document.body.appendChild(root);

    ui = {
      root: root,
      card: root.querySelector(".p101-card"),
      player: root.querySelector("[data-player]"),
      opponent: root.querySelector("[data-opponent]"),
      opponentName: root.querySelector("[data-opponent-name]"),
      playerHp: root.querySelector("[data-player-hp]"),
      playerHpText: root.querySelector("[data-player-hp-text]"),
      opponentHp: root.querySelector("[data-opponent-hp]"),
      opponentHpText: root.querySelector("[data-opponent-hp-text]"),
      kicker: root.querySelector("[data-kicker]"),
      prompt: root.querySelector("[data-prompt]"),
      options: root.querySelector("[data-options]"),
      feedback: root.querySelector("[data-feedback]"),
      progress: root.querySelector("[data-progress]"),
      actions: root.querySelector("[data-actions]")
    };

    root.addEventListener("keydown", function (event) {
      event.stopPropagation();
      if (/^[1-9]$/.test(event.key)) {
        var buttons = ui.options.querySelectorAll("button");
        var button = buttons[Number(event.key) - 1];
        if (button && !button.disabled) {
          event.preventDefault();
          button.click();
        }
      }
    });

    root.addEventListener("keyup", function (event) {
      event.stopPropagation();
    });
  }

  function setHp(fill, text, value) {
    var ratio = Math.max(0, Math.min(1, value / MAX_HP));
    fill.style.width = ratio * 100 + "%";
    fill.className = "p101-hp-fill " + (ratio > 0.66 ? "is-high" : ratio > 0.33 ? "is-mid" : "is-low");
    text.textContent = value + " / " + MAX_HP;
  }

  function updateHp() {
    setHp(ui.playerHp, ui.playerHpText, active.playerHp);
    setHp(ui.opponentHp, ui.opponentHpText, active.opponentHp);
  }

  function clearActions() {
    ui.actions.hidden = true;
    ui.actions.innerHTML = "";
  }

  function addAction(label, handler) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = "p101-action";
    button.textContent = label;
    button.addEventListener("click", handler);
    ui.actions.hidden = false;
    ui.actions.appendChild(button);
    return button;
  }

  function focusFirstOption() {
    requestAnimationFrame(function () {
      var first = ui.options.querySelector("button");
      if (first) {
        first.focus();
      } else {
        ui.card.focus();
      }
    });
  }

  function renderQuestion() {
    var question = active.data.questions[active.index];
    ui.prompt.textContent = question.prompt;
    ui.progress.textContent = "Question " + (active.index + 1) + " / " + active.data.questions.length;
    ui.options.innerHTML = "";
    clearActions();

    question.options.forEach(function (text, index) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "p101-option";
      button.innerHTML = '<span class="p101-key">' + (index + 1) + '</span><span class="p101-option-text"></span>';
      button.querySelector(".p101-option-text").textContent = text;
      button.addEventListener("click", function () {
        choose(index);
      });
      ui.options.appendChild(button);
    });

    if (active.index === 0) {
      ui.feedback.textContent = active.data.intro;
    } else {
      ui.feedback.textContent = "";
    }

    focusFirstOption();
  }

  function choose(index) {
    if (!active || active.busy || active.resolved) {
      return;
    }

    var question = active.data.questions[active.index];
    var buttons = ui.options.querySelectorAll("button");
    var correct = index === question.answer;

    active.busy = true;
    buttons.forEach(function (button, buttonIndex) {
      button.disabled = true;
      if (buttonIndex === question.answer) {
        button.classList.add("is-correct");
      }
    });

    if (!correct) {
      buttons[index].classList.add("is-wrong");
      active.playerHp = Math.max(0, active.playerHp - WRONG_DAMAGE);
      ui.feedback.textContent = "Not quite. " + question.explanation + " The office worker deals 10 damage.";
      ui.player.classList.remove("is-hit");
      void ui.player.offsetWidth;
      ui.player.classList.add("is-hit");
    } else {
      active.opponentHp = Math.max(0, active.opponentHp - CORRECT_DAMAGE);
      active.correct += 1;
      ui.feedback.textContent = "Correct. " + question.explanation + " You deal 15 damage.";
      ui.opponent.classList.remove("is-hit");
      void ui.opponent.offsetWidth;
      ui.opponent.classList.add("is-hit");
    }

    updateHp();

    window.setTimeout(function () {
      if (active.opponentHp <= 0) {
        finish("win");
      } else if (active.playerHp <= 0) {
        finish("lose");
      } else if (active.index + 1 >= active.data.questions.length) {
        finish("lose");
      } else {
        active.index += 1;
        active.busy = false;
        renderQuestion();
      }
    }, 1100);
  }

  function resetBattle() {
    active.index = 0;
    active.playerHp = MAX_HP;
    active.opponentHp = MAX_HP;
    active.busy = false;
    active.resolved = false;
    active.correct = 0;
    ui.player.classList.remove("is-hit");
    ui.opponent.classList.remove("is-hit");
    updateHp();
    renderQuestion();
  }

  function finish(result) {
    active.resolved = true;
    active.busy = false;
    ui.options.innerHTML = "";
    clearActions();

    if (result === "win") {
      passed[active.npcId] = true;
      savePassed();
      ui.prompt.textContent = "The " + active.data.opponent.toLowerCase() + " signs off this shift.";
      ui.progress.textContent = "Cleared with " + active.correct + " correct answers";
      ui.feedback.textContent = "Shift cleared. The next step is yours.";
      var continueButton = addAction("Continue", function () {
        var npc = pendingNpc;
        pendingNpc = null;
        closeBattle();
        if (npc) {
          window.setTimeout(function () {
            originalEmit("quest_step_check", npc);
          }, 0);
        }
      });
      continueButton.focus();
    } else {
      ui.prompt.textContent = "The shift is not cleared yet.";
      ui.progress.textContent = "No shift credit";
      ui.feedback.textContent = "Shift failed. Try again when you are ready.";
      var retryButton = addAction("Retry", resetBattle);
      addAction("Leave", function () {
        pendingNpc = null;
        closeBattle();
      });
      retryButton.focus();
    }
  }

  function openBattle(npcId) {
    var data = bank[npcId];
    if (!data) {
      return false;
    }

    build();
    active = {
      npcId: npcId,
      data: data,
      index: 0,
      playerHp: MAX_HP,
      opponentHp: MAX_HP,
      busy: false,
      resolved: false,
      correct: 0
    };

    ui.opponentName.textContent = data.opponent;
    ui.kicker.textContent = data.shift;
    ui.root.hidden = false;
    document.body.classList.add("p101-battle-open");
    updateHp();
    renderQuestion();
    ui.card.focus();
    return true;
  }

  function closeBattle() {
    if (!ui) {
      return;
    }
    ui.root.hidden = true;
    document.body.classList.remove("p101-battle-open");
    active = null;
  }

  bus.emit = function (event) {
    if (event === "quest_step_check") {
      var npc = arguments[1];
      var npcId = typeof npc === "string" ? npc : npc && npc._id;
      if (npcId && shouldGate(npcId, npc)) {
        if (firstMissing(npcId)) {
          showLock(npcId);
          return true;
        }
        if (!active || active.npcId !== npcId) {
          pendingNpc = npc;
          openBattle(npcId);
        }
        return true;
      }
    }
    return originalEmit.apply(null, arguments);
  };

  window.__python101 = window.__python101 || {};
  window.__python101.battle = {
    open: openBattle,
    close: closeBattle,
    isOpen: function () {
      return Boolean(active);
    },
    cleared: cleared,
    firstMissing: firstMissing,
    order: ORDER.slice()
  };
})();
