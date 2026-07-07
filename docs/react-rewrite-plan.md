# React Rewrite Plan

## Strategy

Strangler fig — React frontend served at `/app/` alongside the existing jQuery UI at `/`.
Both talk to the same PHP backend. Compare behaviors side by side, then cut over when ready.
Backend and network protocol stay unchanged for now.

## Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | React (plain JS) | Not React Compiler variant — simpler to debug, enough for this scale |
| Build tool | Vite | `npm run build` → `dist/` for Apache |
| Drag and drop | @dnd-kit | Nested sortable (aisles + items); touch-first, no Hammer.js needed |
| State | Zustand + localStorage | Persisted local state for offline support |
| Dev server | `php -S localhost:5000` | Via `bin/runDevPhp`; Vite proxies `/service/` to it |

## Component Structure

```
<App>                         — auth state, current list, sync engine/context
  <TabBar>
  <LoginTab>
  <RegisterTab>
  <ForgotPasswordTab>
  <BuildListTab>
    <AisleList>               — dnd-kit SortableContext (aisles)
      <Aisle>                 — dnd-kit SortableContext (items)
        <Item>
  <ShopTab>                   — same data as BuildList, different view
    <AisleList>
      <Aisle>
        <ShopItem>            — check-off variant
  <MenuTab>
    <MenuItem>
  <SettingsTab>
  <AddItemDialog>             — React portals, rendered at App level
  <AddAisleDialog>
  <AddMenuItemDialog>
  <AddListDialog>
  <PrintView>
  <RecipeDialog>
  <AboutDialog>
```

Note: BuildList and Shop are two views of the same underlying `shop` list type.
Model this as one shared slice of state, not two independent ones.

## Offline Architecture

1. **Local state** — Zustand store persisted to localStorage on every change
2. **Mutation queue** — ordered array in localStorage: `[{id, action, payload}, ...]`
3. **Optimistic updates** — apply to local state immediately, then enqueue for server
4. **Sync loop** — flush queue on `online` event and periodic timer; dequeue on server success
5. **Conflict handling**:
   - Granular ops (`saveDoneState`, `saveCount`, `saveEnabledState`) are idempotent — safe to replay
   - Full list replace (`setShopList`) sends `ts`; server rejects if stale → pull fresh state, reapply queued granular ops on top

## Network Protocol

Keeping the existing JSON action-based POST protocol unchanged for now:
```json
POST /service/
{"action": "getShopList", "listName": "default"}
```

Future: move reads (`getShopList`, `getMenu`, `getListNames`) to GET requests
so the service worker can cache them for offline load. Mutations stay as POSTs —
they map cleanly onto the mutation queue.

## Dev Setup

```bash
# Terminal 1 — PHP backend
bin/runDevPhp          # php -S localhost:5000 rooted at project root

# Terminal 2 — React frontend
cd app/
npm run dev            # Vite on :5173, proxies /service/ to :5000
```

Vite proxy config (`app/vite.config.js`):
```js
server: {
  proxy: {
    '/service': 'http://localhost:5000'
  }
}
```

## Fixes Made to Existing Code

- `js/kitchen.js` — `postTo("tick", ...)` → `post(...)` (removes Apache rewrite dependency)
- `.sql/passwordTokens.sql` — removed trailing comma after PRIMARY KEY (MariaDB 11.8 fix)
- `service/index.php` — `apache_request_headers()` key lookup made case-insensitive

## Next Step

Scaffold the Vite+React project under `app/`, configure the proxy, and validate
that login/auth works through the proxy before writing any real UI components.

## TODO

- [x] **Decide on appearance and styling.** Functionality has been prioritized over
      visual design so far — current look is plain/functional, not a deliberate design.
- [x] **Packaging for release deployment.** `npm run build` → `dist/` is set up, but
      cutover mechanics aren't decided: cachebusting (legacy had its own scheme — see
      `bin/` and old `Cachebusting`/version-bump commits), how `dist/` actually gets
      published alongside the legacy app during the strangler-fig period, and when/how
      to flip `/` over to the React build.
- [x] **Verify offline operation and resync afterward.** Built: `persist` middleware
      on the Zustand store (`ui/src/store/useStore.js`), a mutation queue
      (`pendingMutations`, collapsed per action+key so repeated offline edits to the
      same field don't pile up), and queue-aware `post()`/`flushQueue()` in
      `ui/src/api.js`. `post()` catches network-level failures (`TypeError` from
      `fetch`, as opposed to a real HTTP error status) for a fixed set of mutation
      actions and queues them instead of throwing; every existing call site already
      applies its optimistic store update before calling `post()`, so this is
      transparent to them. `flushQueue()` replays the queue in order on the `online`
      event, after `checkLogin`, and opportunistically from the existing 1s `tick`
      poll. On a stale full-list-replace conflict (`setShopList`/`setMenu` reporting
      `error`), it adopts the server's returned list rather than trying to merge —
      confirmed via curl that the conflict response already includes the fresh
      `workingList`/`ts`, no extra round trip needed. Recipes and `addAisle`/
      `renameAisle` are explicitly out of scope (see below / next item). Verified
      end-to-end with a real Playwright run against the dev servers: toggled an item
      while offline (DevTools-style `context.setOffline(true)`), confirmed it queued
      and persisted to localStorage with the sync-status indicator showing, then
      confirmed the queue flushed and the change was actually durable server-side
      after reconnecting and reloading.
- [x] **BUG: brand-new accounts' first list interactions silently don't persist.**
      `getWorkingList()` (`service/shoppingList.php`) returns a hardcoded 7-item
      starter list (Lunchmeat, Swiss Cheese, ...) whenever the SQL query for a user's
      list returns zero rows — meant as a first-run welcome list, but it was never
      written to the DB. Every mutation (`saveEnabledState`, `saveCount`,
      `saveDoneState`, etc.) does `UPDATE ... WHERE userId=? AND id=?`, which matched
      nothing against a fresh account's real (empty) `lists` rows, so it silently
      no-opped — `execute()` returns true and `ts` still increments even at 0 affected
      rows, since none of these functions check the affected-row count. The starter
      list kept reappearing identically until the user's first genuine `INSERT`
      (e.g. `addItem`), at which point the SQL query started returning real rows and
      the hardcoded fallback disappeared for good. Confirmed via curl against a fresh
      `devagent` account: toggling a starter item returned success 3x with no DB
      change; adding a new item first, then toggling that, persisted correctly. Fixed
      by adding `seedStarterList()`, which writes the same starter items into both
      the `"saved"` and `"shop"` list types via the existing `setWorkingList()`
      (matching what a real first save already does), called from every
      account-creation path: registration (native and external auth plugins) and
      JIT internal-user creation on first login for external plugins.
      `getWorkingList()`'s synthesized fallback is left in place as a defensive
      no-op for edge cases (e.g. a manually cleared-out account) but is no longer
      hit for accounts created after this change. Verified end-to-end: a fresh
      registration now shows all 7 items immediately as real DB rows, and toggling
      one persists correctly across a reload.
- [x] **Aisles aren't real DB entities.** An aisle only existed implicitly via the
      `aisle` column on `lists` (item) rows — there was no aisle table, so an aisle
      with zero items couldn't be persisted at all. This is *why* `addAisle`/
      `renameAisle` were never implemented server-side (confirmed via grep — no
      matching case in `service/index.php`'s dispatch; the React UI posted them but
      they silently no-opped). Fixed with a new `listAisles(userId, listType,
      listNameId, aisleName, orderKey)` table, scoped by `listType` exactly like
      `lists` so aisle structure participates in the existing shop/saved
      save-and-revert model. `setWorkingList()` now optionally accepts an
      `aisleOrder` and replaces `listAisles` atomically alongside `lists`; when not
      given one (the legacy jQuery client, which has no concept of an aisle without
      items) it infers order from the items' aisle sequence instead, so a legacy
      save still works but can't preserve a currently-empty aisle — the accepted
      tradeoff. `getWorkingList()` returns the persisted order, defensively
      appending any stray aisle name that only appears on an item so nothing is
      silently dropped on read. `addAisle`/`renameAisle` are real operations now
      (shop-only, matching `addItem`/`deleteItem`'s live-edit convention;
      `renameAisle` cascades onto matching `lists.aisle` rows), and a new
      `removeAisle` (with a matching disabled-unless-empty delete button in
      `Aisle.jsx`) rounds it out. Backfilled `listAisles` for existing lists in the
      dev DB from their current item order. Verified end-to-end: an empty aisle
      survives a full save/drag-reorder (previously silently dropped), renaming an
      aisle with items updates both the aisle row and its items, and the remove
      button is blocked for non-empty aisles and works once emptied.
- [x] **BUG: can't drag a menu item into an empty weekday.** `WeekDay`
      (`ui/src/components/WeekDay.jsx`) only wrapped its items in a `<SortableContext>` —
      when a day had zero items, nothing on that day was registered as a drop target
      at all, since dnd-kit only tracks rects for elements that call `useSortable` /
      `useDroppable`, and an empty list rendered none. `MenuTab.jsx`'s `handleDragEnd`
      already expected `over.id` to equal the day name as a fallback (`day ===
      over.id`), so the intent was there, but nothing made the empty container itself
      droppable so that could resolve. Fixed by rendering a dedicated `useDroppable`
      placeholder (id = day name, with an `isOver`-driven hover style) only when a
      day has zero items, leaving the populated-day rendering path untouched. Also
      added a `DragOverlay` to `MenuTab.jsx` separately (the dragged item wasn't
      visible at all while crossing between days, only on drop). Verified via
      Playwright: dragged an item from Sunday into empty Monday, it moved
      correctly and persisted server-side after a reload.
- [x] **Restore `FAV_ICON` in the new UI.** The legacy app and PHP-rendered pages
      (`service/templates/resetPassword.php`, `expiredToken.php`) use the
      `$CONFIG["FAV_ICON"]` setting from `config.php` so a deploy can brand its own
      favicon. The React app's `ui/index.html` was hardcoding
      `<link rel="icon" ... href="/favicon.svg" />` (a leftover Vite-scaffold
      asset) instead, so per-deploy favicon configuration was lost for `/app/`.
      Since `ui/index.html` is a static build output with no PHP templating,
      reading `$CONFIG["FAV_ICON"]` at request time isn't practical without a
      build-time step - hardcoded it instead, pointing at the same
      `/favicon-32x32.png` (plus 16x16 and apple-touch-icon) the legacy page and
      reset-password templates already use. In production `/app/` and the site
      root share the same Apache `DocumentRoot`, so the absolute paths resolve
      without extra plumbing there; added dev-only Vite proxy entries
      (`/app/favicon-32x32.png` etc. → the PHP dev server) so they resolve
      locally too. Removed the now-unused `ui/public/favicon.svg`.
- [x] **Replace `docs/shoppingListScreenshot.PNG` with a screenshot of the new UI.**
      Replaced with a screenshot of the React Build List tab (`ui/`, `/app/`) for a
      brand-new registration, showing the seeded starter list (Lunchmeat, Swiss
      Cheese, Liverwurst, Tomatoes, Bran Flakes, Milk, Frozen Pizza) across its
      five aisles. Captured headlessly via the `run-shopping-list` skill's
      Playwright driver against the dev servers, registering a fresh throwaway
      account rather than the shared `devagent` one so the seeded-list behavior
      (see the earlier starter-list TODO) was actually exercised.
- [x] **Password reset flow needs a React-side redo, and appears currently broken.**
      The recovery email (`service/templates/recoveryEmail.php`) links to
      `<HOST>/resetPassword/<token>` — a path segment — but
      `service/resetPassword.php` reads the token from `$_GET["token"]`
      (a query string) and there's no Apache rewrite mapping the path form to it
      (`apacheConfig/kitchen.conf` only rewrites `tick` under `/service/`), so the
      link in the email 404s as-is. Separately, `resetPassword.php` renders
      `templates/resetPassword.php`/`expiredToken.php`, which are standalone
      PHP pages styled with the legacy `css/kitchen.css` and jQuery
      (`js/kitchen.js`'s `doResetPassword()`) — they don't match the new React UI
      at all. Needs: fixing the token URL (query param, or an actual rewrite rule),
      and either restyling these pages to match the new UI or moving the reset flow
      into `ui/` itself (with the emailed link pointing at `/app/...`).
      Fixed by moving the whole flow into `ui/`, keeping the emailed link's URL
      shape unchanged (`<HOST>/resetPassword/<token>`). Added a
      `RewriteRule ^resetPassword/.+$ /app/index.html [L]` to
      `apacheConfig/kitchen.conf` (mirrored in `ui/vite.config.js` via a small
      dev-only middleware) — since it's an internal rewrite rather than a
      redirect, the browser's URL and `window.location` keep the original
      `/resetPassword/<token>` path, so the token is read straight out of
      `location.pathname` in `App.jsx` rather than a query string. Added a
      `checkResetToken` action to `service/index.php` that reuses
      `getUsernameFromToken()` (`service/login.php`) and sets
      `$_SESSION["token"]` exactly as the old GET page did, so the pre-existing
      `doResetPassword` action's session check kept working unchanged. New
      `ResetPasswordTab.jsx` (modeled on `ForgotPasswordTab.jsx`) calls
      `checkResetToken` on mount and renders the expired/invalid message or the
      new-password form accordingly; `App.jsx` routes to it as a hidden tab
      (same pattern as the existing forgot-password tab) whenever a token is
      present and the user isn't logged in. Deleted the now-dead
      `service/resetPassword.php`, `service/templates/resetPassword.php`, and
      `service/templates/expiredToken.php`. Verified end-to-end against the dev
      servers: triggered `resetPassword` for the `devagent` account, pulled the
      token from the dev DB directly, confirmed an invalid token renders the
      expired-token error, and a valid token renders the form, resets the
      password, and the account can log in with the new password afterward.
- [x] **BUG: duplicate "Default" row per user in `listNames`.** Confirmed live in the
      dev DB — every user, including the pre-existing `ca_lazerdwarf` account (not
      just ones created during this rewrite), had exactly two `("Default", userId)`
      rows. Root cause: `NativeAuth::register()`
      (`service/authPlugins/nativePlugin.php`) already inserts the `"Default"` row
      itself, but `login.php`'s top-level `register()` unconditionally called
      `_createInternalLists($user)` again right after — the same function guarded the
      *user*-creation call just above it with `getPluginName() != "NativeAuthentication"`,
      but that guard was never applied to the *list*-creation call, so every
      native-auth registration inserted the row twice. Fixed by moving
      `_createInternalLists($user)` inside that existing guard, so it now only runs
      for non-native plugins (matching `_createInternalUser`'s scope). Added a
      `UNIQUE KEY (userId, listName)` constraint to `listNames` in `.sql/lists.sql`
      so this can't silently recur, and cleaned up the existing duplicate rows in the
      dev DB directly (no migration runner in this project) — confirmed each
      duplicate pair's higher-numbered `listNameId` had zero rows in `lists` before
      deleting it, then verified via a fresh registration that exactly one `Default`
      row is now created.
