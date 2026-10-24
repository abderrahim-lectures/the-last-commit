(function () {
  "use strict";

  function hide() {
    var title = document.getElementById("python101-title");
    if (title) {
      title.hidden = true;
    }
  }

  if (window.__python101Bus && window.__python101Bus.on) {
    window.__python101Bus.on("python101_present_ready", hide);
  }
})();
