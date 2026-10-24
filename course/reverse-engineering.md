# Messenger: reverse-engineering dossier

This note records what the course uses from the public page at
`https://messenger.abeto.co/`, how the evidence was collected, and where each
claim stops.

## Scope and method

The target is the public title page and its public JavaScript bundle. No
account was created. No server endpoint was probed. No game session was
altered.

Tools:

- REA `6.7.0` through `npx`.
- `analyze-web-bundle`, `inspect-web-page`, and `capture-web-screenshot`.
- Chrome `156.0.8078.47` in headless mode with SwiftShader.
- A passive Chrome DevTools Protocol attachment.

Commands used:

```bash
npx -y rea-agents@6.7.0 list-browser-targets http://127.0.0.1:9222 \
  --allowed-origins https://messenger.abeto.co --format json

npx -y rea-agents@6.7.0 analyze-web-bundle http://127.0.0.1:9222 <target-id> \
  --allowed-origins https://messenger.abeto.co --observation-ms 8000 --format json

npx -y rea-agents@6.7.0 inspect-web-page http://127.0.0.1:9222 <target-id> \
  --allowed-origins https://messenger.abeto.co --observation-ms 4000 \
  --include-accessibility-text --include-console-text --include-storage-keys --format json

npx -y rea-agents@6.7.0 capture-web-screenshot http://127.0.0.1:9222 <target-id> \
  --allowed-origins https://messenger.abeto.co --format json
```

The capture date is 2026-10-22. REA evidence identifiers:

- Bundle: `ev_7940bbb4cc45f1a4342f7b4f3077c4c319d722494309573bff0ac51253c17f6f`
- Page: `ev_cbcfe5e0602b8a199699e9e4052190c8ed1a20c03a80097205dee9c3a01fd74e`
- Screenshot: `ev_9dd56f6cc81df7824326c3afcc517e60ff7a1b5f57b8b8e92f41794479ca426e`

## Artifacts

These captures are evidence for the claims below. Only
`assets/messenger-title.png` is included in this course.

| Artifact | Bytes | SHA-256 |
| --- | ---: | --- |
| `index.html` | 1,699 | `cef3bf3b53218dcd6997fd91827ebcc2b4d5a6a58aec32fea1f272a2e6db4f07` |
| `assets/App3D-DwM1eiaC.js` | 1,926,191 | `3b146c7d69d309b3af364e5198880d5975dae2b6daea496e89f8206bb91449d7` |
| `assets/webgl-CS4l6lxD.js` | 3,817 | `5b90d83ceccf7a770955637e8d5944f14877ccc7fd6ee390a16148f626bebe91` |
| `assets/style-BgpnrCnL.css` | 1,493 | `9f4eecf7a0f3f57040ef6d0154ad383eb4df76fa51d8f288372e790e701ea277` |
| `assets/messenger-title.png` | 135,495 | `fe2e7e94a5c17e60c6f180dfd82e6cdc446234600e450cf41c1e257bce801654` |

The page loads two module scripts. `webgl-CS4l6lxD.js` imports
`App3D-DwM1eiaC.js` and exposes `window.__webgl.start()`. The second file holds
the game, the UI runtime, and the third-party libraries.

## What the page is

- A WebGL2 game titled **Messenger**, made by [abeto.co](https://abeto.co).
- Tagline: "It's a small planet, but someone's gotta make the deliveries."
- The HTML body is empty. The app mounts after the bundle runs.
- The first screen is a rotating planet with a yellow **PLAY** button. The
  screenshot in `assets/` shows this state.
- The page prints a row of globe symbols and `by https://abeto.co` to the console.
- The renderer is three.js, revision 180 (`REVISION="180"`).
- The UI runtime is Svelte 5. The bundle includes Svelte 5 error codes such as
  `state_unsafe_mutation`.
- Supporting code includes protobufjs, a KTX2 loader, a Draco loader, a mesh
  BVH library, post-processing passes, and MSDF text.
- Several modules run in Web Workers: bitmap, character geometry, collision,
  Draco, EXR, geometry, glyph, and MSDF workers.

## The planet

The zone table in the bundle defines nine named spheres. Each entry has a
center and a radius. The course uses the names, and one table uses the
coordinates as a dictionary exercise.

| Key | Display name | Center (x, y, z) | Radius |
| --- | --- | --- | ---: |
| `square` | Main Square | 25.1548, 11.1266, 2.25704 | 8.75 |
| `factory` | Capital Corp. | -7.82486, 4.19171, -29.304 | 18.45 |
| `falls` | Smelly Falls | 8.09011, -13.7658, -12.4145 | 10 |
| `redhouse` | Red Cliff House | -14.4395, -6.11889, 27.0498 | 9 |
| `forest` | The Forest | -8.84153, -19.1808, 2.54687 | 13 |
| `graveyard` | Lucero Graveyard | 27.7006, -14.1946, 13.4392 | 8 |
| `cave` | Man's Cave | -21.7063, -6.80204, 6.28998 | 5 |
| `temple` | Mountain Temple | -10.1549, 34.7748, -3.82302 | 8 |
| `beach` | Scully's Beach | -13.1445, 15.572, -1.75282 | 8 |

The game checks the player position against these spheres and shows a zone
title when the player enters a new sphere.

## The cast

The bundle registers 20 characters. Seventeen have dialogue. These names and
lines are quoted in the course only where the lesson needs them.

| ID | Display name | Dialogue sample |
| --- | --- | --- |
| `office-worker` | Walking Man | "Sorry, I'm on my lunch break." |
| `office-worker-2` | Office Worker | "Senior associate executive chief vice director..." |
| `chef` | Shop Keeper | "Have you seen my daughter? I thought she'd be home by now..." |
| `caveman` | Cave Man | "Maybe I should just call in sick..." |
| `boss` | Boss | "Oh my..." |
| `flower-lady` | Flower Lady | "Tulips can take a while to bloom." |
| `scout` | Young Kid | "I think I hear my dad calling..." |
| `threekid` | Hacker Girl | "It's like painting, but with code!" |
| `factory-worker-a` | Factory Worker | "Shipments in... shipments out..." |
| `factory-worker-b` | Tengo | "The new guy is late again." |
| `female-scientist` | Doctor Frebi | "We'll need to build here... here... and also here..." |
| `factory-worker-c` | Getave | No dialogue. |
| `alien` | Pale Man | "I think I've seen you somewhere before..." |
| `male-scientist` | Doctor Frieb | "Let's see... First I'll need to calculate the radius of the bike tire..." |
| `diver` | Captain Steve | "Come on... open up..." |
| `mountainman` | Mountain Guy | "Do you hear that sound? Silence..." |
| `oldwoman` | Old Woman | "Thank you for delivering my offering." |
| `musician` | Dave the Musician | "Have you heard this one before?" |
| `fox` | Fox | No dialogue. |
| `owl` | Owl | No dialogue. |

## The five quests

`questData` in the bundle defines five chains and 13 steps. The course mirrors
these names and step counts in the final exercise.

| Quest ID | Description | Steps | Chain |
| --- | --- | ---: | --- |
| `quest-employee` | Falling off the corporate ladder | 3 | office worker → boss → office worker |
| `quest-caveman` | A man who's hiding from something | 3 | cave man → flower lady → cave man |
| `quest-scientists` | Scientists and mixed-up deliveries | 3 | factory worker → Doctor Frieb → Doctor Frebi |
| `quest-temple` | An offering to the mountain temple | 2 | old woman → mountain guy |
| `quest-musician` | A note lost at sea | 2 | Captain Steve → Dave the Musician |

Each step carries dialogue, a UI title, a UI instruction, a colour, and
sometimes a model for the received package. The game shows the instruction in
a quest box. Example: `TAKE THE BOSS'S NOTE TO THE OFFICE WORKER IN THE MAIN
SQUARE`.

## Persistence and runtime

- The page stores one local storage key: `App3D_data`.
- The quest controller keeps a `questProgress` map inside that wrapper. Each
  quest maps to a list of booleans, one per step.
- A full completed run resets the progress.
- The game emits audio events through `webgl_play_audio`,
  `webgl_play_positional`, `webgl_stop_audio`, `webgl_stop_positional`, and
  `webgl_set_audio_volume`.
- The bundle contains zone ambiances for beach, city, factory, forest, temple,
  and waterfalls, plus dialogue voice sets and a music track.
- The Avatar and NPC systems use skinned meshes, accessories, emojis, and
  text bubbles.
- The title screen and the game UI are one Svelte component tree over a
  three.js canvas.

## Multiplayer

The bundle contains a WebSocket client named `MicroRealmConnection`.

- Server: a Google Cloud Run relay. The exact host is omitted here because it
  is not needed for the course.
- Default room prefix: `planets-default`.
- The client sends position and state deltas at about 35 updates per second.
- The client pings every 20 seconds.
- Data is encoded with protobufjs. The client infers a protobuf schema from a
  plain JavaScript object.
- The client reconnects on visibility changes.

The course does not connect to this relay. The observation is static: the URL
and the protocol strings are present in the public bundle.

## Limits

- The bundle is minified and has no source maps.
- The analysis attached after the page loaded, so the initial network waterfall
  was not observed. Only later runtime facts were captured.
- The screenshot comes from headless Chrome with SwiftShader. A real GPU may
  render the scene differently.
- No server code, database, or account flow was observed.
- The quest text above is copied from the public bundle. It is game dialogue,
  not course prose.
- The exact multiplayer host, room contents, and player data were not accessed.

## How the course uses this

The course is an independent Python study companion. It does not redistribute
the game code. It uses names, counts, zone coordinates, and short quest lines
as concrete anchors for exercises. Each chapter marks the observed fact in a
"Field note" panel. The final exercise rebuilds the delivery office as a small
object-oriented Python program with five quests and 13 steps.

Messenger belongs to abeto.co. The screenshot is included for attribution and
study.
