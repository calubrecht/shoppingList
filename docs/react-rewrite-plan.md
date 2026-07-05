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

- [ ] **Decide on appearance and styling.** Functionality has been prioritized over
      visual design so far — current look is plain/functional, not a deliberate design.
- [ ] **Packaging for release deployment.** `npm run build` → `dist/` is set up, but
      cutover mechanics aren't decided: cachebusting (legacy had its own scheme — see
      `bin/` and old `Cachebusting`/version-bump commits), how `dist/` actually gets
      published alongside the legacy app during the strangler-fig period, and when/how
      to flip `/` over to the React build.
- [ ] **Verify offline operation and resync afterward.** The "Offline Architecture"
      section above (mutation queue, Zustand persisted to localStorage, replay on
      reconnect) is still just a plan — none of it has actually been built yet. What
      *has* been built is a polling loop (`App.jsx`, 1s tick) for detecting changes made
      by *other* clients while online, which is a different problem (multi-client sync,
      not offline resilience) and doesn't cover the offline case at all.
- [ ] **Aisles aren't real DB entities.** An aisle only exists implicitly via the
      `aisle` column on `lists` (item) rows — there's no aisle table, so an aisle with
      zero items can't be persisted at all. This is *why* `addAisle`/`renameAisle` were
      never implemented server-side (confirmed via grep — no matching case in
      `service/index.php`'s dispatch; the React UI posts them but they silently
      no-op). Needs an actual `aisles` table (identity + sort order, independent of
      whether it currently has items) and the shop-list queries/save path updated to
      use it.
- [ ] **BUG: can't drag a menu item into an empty weekday.** `WeekDay`
      (`ui/src/components/WeekDay.jsx`) only wraps its items in a `<SortableContext>` —
      when a day has zero items, nothing on that day is registered as a drop target at
      all, since dnd-kit only tracks rects for elements that call `useSortable` /
      `useDroppable`, and an empty list renders none. `MenuTab.jsx`'s `handleDragEnd`
      already expects `over.id` to equal the day name as a fallback (`day ===
      over.id`), so the intent was there, but nothing makes the empty container itself
      droppable so that can resolve. Needs `WeekDay` to register the day container as
      a droppable (or render an empty-state placeholder inside the `SortableContext`)
      so empty days become valid drop targets.
- [ ] **BUG: duplicate "Default" row per user in `listNames`.** Confirmed live in the
      dev DB — every user, including the pre-existing `ca_lazerdwarf` account (not
      just ones created during this rewrite), has exactly two `("Default", userId)`
      rows. Root cause: `NativeAuth::register()`
      (`service/authPlugins/nativePlugin.php`) already inserts the `"Default"` row
      itself, but `login.php`'s top-level `register()` unconditionally calls
      `_createInternalLists($user)` again right after — the same function guards the
      *user*-creation call just above it with `getPluginName() != "NativeAuthentication"`,
      but that guard was never applied to the *list*-creation call, so every
      native-auth registration inserts the row twice. `listNames` also has no unique
      constraint (`PRIMARY KEY (listNameId)` only, per `.sql/lists.sql`), so nothing
      stops it. The legacy jQuery UI never surfaced the duplicate (likely deduped
      client-side); the React `<select>` in `SettingsTab.jsx` just renders the raw
      array, exposing it. Fix: drop the redundant `_createInternalLists` call for
      `NativeAuthentication` in `register()`, add a unique index on `listNames
      (userId, listName)`, and clean up existing duplicate rows.
