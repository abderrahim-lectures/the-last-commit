# Messenger Lab: Python 101 to OOP

A story-driven Python course in one page. The story is set on the small planet
from the WebGL game [Messenger](https://messenger.abeto.co/) by
[abeto.co](https://abeto.co). The course goes from the first `print` to
classes, inheritance, and composition (OOP).

Thirteen shifts. Each shift has a scene, a field note from the game's public
bundle, one Python idea, and a challenge. The challenge runs in the browser
with [Pyodide](https://pyodide.org/). Hidden tests check the code.

## Run it

Pyodide uses a web worker, so open the page through a local server.

```bash
cd course/messenger-python-101-poo
python3 -m http.server 8000
```

Then open <http://localhost:8000/>.

The first **Run** downloads Pyodide from jsDelivr. Later runs use the browser
cache. The page itself has no build step.

## Use it

- **Run** executes the code in the editor.
- **Check** runs the hidden tests and marks the shift complete.
- **Ctrl + Enter** runs the code.
- **Tab** inserts four spaces. **Shift + Tab** and **Escape** leave the editor.
- **Reset** restores the starter code.
- Drafts and progress stay in `localStorage`.

The editor for each shift is isolated. Shifts 10 and 11 include the `Package`
class, so they also work when opened directly.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | The course, styling, Pyodide worker, and all challenges. |
| `reverse-engineering.md` | Evidence, commands, observed facts, and limits. |
| `assets/messenger-title.png` | Title screen capture, used with attribution. |

## The story in one paragraph

You arrive as a courier on a planet with nine zones and twenty characters.
Five delivery chains wait: a letter that should not reach the boss, a postcard
from a man hiding in a cave, two scientists with mixed-up mail, an offering for
the mountain temple, and a wet note for Dave. The office terminal teaches you
Python one shift at a time. At the end you rebuild the delivery office as an
object-oriented program with five quests and 13 steps.

## Evidence and attribution

The technical details come from the public bundle at
`https://messenger.abeto.co/`, captured on 2026-10-22. The dossier records the
artifact hashes, the REA commands, the zone table, the cast, the five quests,
and the limits of the analysis.

Messenger belongs to abeto.co. This is an independent study companion. It does
not redistribute the game code. Short quest lines and names are used as
anchors for the exercises.

Pyodide is loaded from `https://cdn.jsdelivr.net/pyodide/v0.29.0/full/`.
