# The Last Commit

A Python 101 learning game set on a small office campus. The Python student wakes up late, and five quests are waiting.

Live: https://abderrahim-lectures.github.io/the-last-commit/

## What is inside

- **Python PC** — walk up to the ATM computer on the wall and press `E`, or click `Use PC` on the marker. The window has three posts:
  - **LEARN PC** — 13 shifts that start at `print()` and end at classes.
  - **PLAY PC** — a sandboxed editor. Type Python, press Run, read the output. Code runs in the browser with Pyodide.
  - **ROUTE** — a short guide for the first five minutes, from finding the PC to the first quiz battle.
- **Quiz battles** — five NPCs ask questions in order, from the Office Worker to the Diver. Shifts must be cleared before the later battles open.
- **Controls** — `WASD` or arrow keys to move, `E` to use the PC, `Esc` to close the window, `Enter` or `Ctrl+Enter` to run code in the Play PC.

## Run it locally

Any static file server works. For example:

```sh
python3 -m http.server 8001
```

Then open http://127.0.0.1:8001/ in a browser.

## Deploy

Every push to `main` runs `.github/workflows/pages.yml` and publishes the site to GitHub Pages.
