# Electrical training lab: handoff for the next session

Read this first. Continue from the current state; do not restart or re-scan the project from scratch.

## What it is
An offline training web app for maintenance technicians: Bench (circuit simulator with meters), Projects (panel + process plant + PLC ladder), LOTO, PCB repair, Inspect, Guide. 9 languages. Owner: Momen (writes Egyptian Arabic, wants short answers; a team of reviewer agents + a QA pass before every delivery; never deliver links or buttons that do not work).

- Live (what users open and install): https://momenfouad93.github.io/electrical-lab/
  - Never rename the repo, the folder or the URL: installed phones keep this address.
  - Users get updates automatically: the service worker loads the page network-first, and the app checks `version.json` on open / return and shows "Update now".
  - Never clear or rename localStorage keys (`ellab.*`) without a migration.
- Source of truth: `source/` in this repo (copy of the lab folder). Repo root = built web app. `electrical-lab.html` at the root = the same app as one offline file (for the company laptop).

## Build, test, deploy
```
cd source
node build.js                        # -> dist/electrical-lab.html (+ dist/build.txt = build stamp)
node tools/pwa.js                    # -> pwa/ : index.html with hash CSP, sw.js, manifest, icons, version.json
node test/t_plant.js; node test/t_proj.js; for t in test/t_*.js; do node $t; done   # known old failures: t_inst.js (1 megger line), t_core.js (stale test: EL.models === EL.defs)
node test/ui_scratch.js d|m          # builds a tank project from scratch through the UI
for t in qa_projects qa_plant qa_ladder qa_bench qa_mobile qa_lang; do node test/$t.js; done   # QA click-through suites (qa_mobile: toolbar scroll + 1 off-screen-port check are known test notes)
node test/e2e_pwa_security.js        # serves pwa/ on :8099: CSP, offline, update bar, hostile files
node test/ui_proj.js d|m             # screenshots to /tmp/claude-0/shots
MSG="..." NOTE="..." REPO=<path of this repo clone> ./tools/deploy.sh
```
Playwright: `require('/opt/npm-tools/node_modules/playwright')` in the cloud sandbox.
i18n: strings are `[English, Arabic]` pairs; other languages come from `i18n/keys.json` (append new keys, keep ids) + `i18n/work/cNN.txt` blocks (`#id` + 7 lines fr, pt, zh, ru, pl, hu, es), then `node tools/i18n_build.js --check` and `node tools/i18n_build.js` (writes src/i18n_data.js). Extract new pairs with the logic in `tools/i18n_extract.js` (do not run it in place: it renumbers ids).

## Code map (source/src)
- `core.js` circuit solver + `EL.tick` (also steps the plant). `parts_*.js` part models, `parts_h.js` 3-wire 0-10 V transmitter TXV.
- `plant.js` process simulator: units (SUPPLY, TANK, PUMP, VALVE, SOLV, CHECK, FILTER, RO, HX, PT, PS, FS, TT, PG, FM, JUNC, DRAIN), linear hydraulic net per tick, links to panel parts by tag (pump.motor, tank.lt / sw[] / htr / tt, PT.tx, PS.sw, FS.sw, TT.tx, SOLV.sol). Motors get `state.pl` (load) from linked pumps.
- `ladder.js` LAD runtime for PLC24/PLC24R when `props.mode === 'ladder'`, program JSON in `props.lad`; `LD.check` static checks, `LD.why` rung diagnosis, sanitiser for files.
- `projects.js` ready projects (tank star-delta PLC, booster VFD, RO + heat exchanger).
- `circuit.js` serialize / deserialize (validates and caps imported files; includes `plant`).
- UI: `ui/projects_ui.js` (Projects tab, Panel/Plant/Ladder switch), `ui/plant_ui.js` + `ui/plant_art.js`, `ui/ladder_ui.js`, `ui/update.js` (SW register + update bar), rest as before.

## Security
- `tools/pwa.js` injects a hash-based CSP (only the shipped inline script runs; network only to self and api.anthropic.com for the optional AI photo check). If you add an inline script or a new external host, the CSP must allow it, then rerun `test/e2e_pwa_security.js`.
- Imported files go through `EL.deserialize` / `EL.plant.sanitize` / `EL.ladder.sanitize` (size caps, markup stripped). Keep new string fields escaped when rendered.
- The repo is public (free GitHub Pages): no company data, names or secrets in it.

## Changelog
- 2026-11-18: PWA published on GitHub Pages.
- 2026-11-21: Projects (panel + plant + ladder), 3 ready projects, network-first updates with update bar, hash CSP, import hardening, source moved into this repo.
  Engineering review fixes: starved pumps deliver only what the suction gives (so low-suction trips work), fail-safe wiring (LSHH/LSH on NC, transmitter-dead and KM1-feedback latched faults in the tank ladder), motor current scaled to pump load, RO osmotic pressure rises with recovery, RO temperature/recovery warnings, supply internal resistance, star time 10 s.
  R&D fixes: "Create it on the panel, wired" in every plant link (ui/autowire.js), PLC kit button in the Ladder view, side-by-side placement, phone fit, ladder rungs scale to phone width.
  QA fixes: < > kept in ladder/text programs on reload (circuit.js), selection bar above the phone dock, empty tank rendering, number limits, duplicate pipe toast, Ctrl+Z in Plant, ladder palette search.
  Not possible from the cloud session: repo branch protection (settings API blocked); secret scanning + push protection are on.
