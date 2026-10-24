let pyodide = null;
let currentId = 0;
let currentOut = "";

function post(message) {
  self.postMessage(message);
}

async function boot() {
  importScripts("https://cdn.jsdelivr.net/pyodide/v0.29.0/full/pyodide.js");
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.29.0/full/"
  });
  pyodide.setStdout({
    batched: function (text) {
      if (text) {
        currentOut += text;
      }
    }
  });
  pyodide.setStderr({
    batched: function (text) {
      if (text) {
        currentOut += text;
      }
    }
  });
  post({ type: "ready", version: pyodide.version || "Pyodide" });
}

const ready = boot().catch(function (error) {
  post({
    type: "boot-error",
    message: String(error && error.message ? error.message : error)
  });
});

self.onmessage = async function (event) {
  const data = event.data;
  if (!data || data.type !== "run") {
    return;
  }
  try {
    await ready;
  } catch (error) {
    post({ type: "error", id: data.id, message: "Python failed to load." });
    return;
  }
  if (!pyodide) {
    post({ type: "error", id: data.id, message: "Python is not ready." });
    return;
  }
  currentId = data.id;
  currentOut = "";
  let namespace = null;
  try {
    namespace = pyodide.runPython("{}");
    await pyodide.runPythonAsync(data.code, { globals: namespace });
    post({ type: "done", id: data.id, text: currentOut });
  } catch (error) {
    post({
      type: "error",
      id: data.id,
      text: currentOut + String(error && error.message ? error.message : error)
    });
  } finally {
    if (namespace) {
      try {
        namespace.destroy();
      } catch (ignore) {}
    }
  }
};
