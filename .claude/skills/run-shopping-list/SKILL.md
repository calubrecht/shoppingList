---
name: run-shopping-list
description: Run, build, and screenshot the shopping-list app (PHP backend + React/Vite frontend at /app/) for verifying UI/styling changes. Use when asked to run the app, start the dev servers, or screenshot/verify a change in the React rewrite.
---

Paths below are relative to the repo root (`shoppingList/`), not this skill directory.

This is a PHP backend (`service/`) plus a React/Vite frontend (`ui/`,
served at `/app/`) plus the legacy jQuery UI (served at `/`). The
agent-facing way to drive it is headless Chromium via Playwright,
scripted by `driver.mjs` in this skill directory — there is no
`chromium-cli` in this environment, so this driver stands in for it.

## Prerequisites

One-time browser download (~180MB, no `sudo`/system packages needed —
verified working headless without `--with-deps`):

```bash
cd .claude/skills/run-shopping-list
npm install
npx playwright install chromium
```

## Start the dev servers

Two long-running processes. Check first — a dev session often already
has these up (look for `php -S` / `vite` in `ps aux`); don't double
launch, Vite will silently pick a new port (5174, 5175, ...) and you'll
be screenshotting the wrong instance.

```bash
# Terminal/background 1 — PHP backend on :5000
bin/runDevPhp

# Terminal/background 2 — Vite on :5173, proxies /service, /audio, /sl_icons to :5000
cd ui && npm run dev
```

Poll instead of sleeping:

```bash
# no -f: the PHP root path 404s by design, but that still proves the server answers
timeout 20 bash -c 'until curl -s -o /dev/null http://localhost:5000/; do sleep 1; done'
timeout 20 bash -c 'until curl -sf http://localhost:5173/app/ -o /dev/null; do sleep 1; done'
```

Stop with `kill` on the PIDs you started — don't `pkill -f vite`, it'll
also kill someone else's dev session.

## Run (agent path)

```bash
node .claude/skills/run-shopping-list/driver.mjs <out.png> [view]
```

`view` is one of `login`, `register`, `buildlist` (default), `shop`,
`menu`, `settings`, `about`, `recipes`. For anything except
`login`/`register` the driver logs in with a fixed dev account
(`devagent` / `DevAgent123!`, env-overridable via `SHOPLIST_USER` /
`SHOPLIST_PASS`) and registers it automatically on first use if login
fails. That account's data (a shared "Default" list — lists in this
app aren't per-user-scoped, so any logged-in account sees the same
household list) persists across runs in whatever DB the PHP backend
is pointed at.

Example — verify the build-list tab renders after a styling change:

```bash
node .claude/skills/run-shopping-list/driver.mjs /tmp/buildlist.png buildlist
```

Then look at `/tmp/buildlist.png`. For a one-off custom flow (adding
an item, opening a specific dialog), copy `driver.mjs` as a starting
point — it's a plain Playwright script, not a black box.

## Run (human path)

Open `http://localhost:5173/app/` in a real browser. Useless headless.
The legacy jQuery UI is at `http://localhost:5000/` / `http://localhost:5173/`
(root, not `/app/`) for comparison.

## Test

```bash
cd ui && npm run lint
```

No frontend test suite exists yet (Vite scaffold only).

## Gotchas

- **PHP root path 404s.** `http://localhost:5000/` (and `:5173/`,
  the legacy jQuery route) returns 404 by design — there's no static
  index at repo root in this dev layout. Don't use `curl -sf` to poll
  readiness there, it treats the 404 as failure and the loop times
  out even though the server is up; use plain `curl -s` and just
  check it responds at all.
- **`text=Shop` matches the wrong thing.** Playwright's `text=` engine
  substring-matches, so `text=Shop` also matches "Your **Shop**ping
  List" in the header (which opens the About dialog, not the Shop
  tab). Scope tab clicks to `.navBar .tab:has-text("Shop")`.
- **New accounts aren't empty.** Registering a fresh user lands on the
  same shared "Default" list as every other account (aisles/items
  persist server-side, not per-user) — don't be surprised to see
  existing data on a "new" account.
- **`npx playwright install --with-deps` fails here** (`sudo: a
  terminal is required`). Plain `npx playwright install chromium`
  (no `--with-deps`) works fine headless without installing any apt
  packages.
- **Vite port drift.** If :5173 is taken by a stale process, `npm run
  dev` silently binds :5174/:5175/etc. Check `ss -ltnp | grep 517` and
  point `SHOPLIST_URL` at the real port, or kill the stale process
  first — leftover Vite instances from old sessions accumulate
  otherwise.
