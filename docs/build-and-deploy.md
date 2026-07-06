# Building and Deploying

This project has two parts that get built and packaged together:

- **Legacy static frontend** — plain HTML/CSS/JS served straight from the repo root (`shopping.html`, `css/`, `js/`, icons, etc.)
- **`service/`** — the PHP backend (API + login/password-recovery pages)
- **`ui/`** — the React + Vite frontend (the in-progress rewrite), served under `/app/`

## Local development

Vite requires Node.js version 20.19+ or 22.12+. Development has been done using Node 24.18.0.

Two helper scripts under `bin/` run the backend and frontend dev servers separately:

```bash
bin/runDevPhp     # php -S localhost:5000 -t .   (serves the legacy static site + service/)
bin/runDevReact   # cd ui && npm run dev         (Vite dev server with HMR)
```

For local dev, copy `service/config.php.ex` to `service/config.php` and fill in a local database (see [config.php](#configphp) below).

## Building the release tarball

`bin/package` builds the React app and produces a versioned tarball:

```bash
bin/package
```

This will:

1. Run `npm ci && npm run build` in `ui/`, producing `ui/dist`.
2. Read the version from `version.json` and write it to `version.txt`.
3. Stage the legacy static assets, `service/` (minus `config.php`), and the built React app (as `app/`) into a temp directory.
4. Tar it up as `shoppingList-<version>.tar.gz`.

**`service/config.php` is deliberately left out of the tarball.** A deploy should never overwrite the live server's database credentials and other environment-specific secrets. See [config.php](#configphp) below.

Bump the version first with `bumpVersion.py` (updates `version.json` and the version string embedded in `js/kitchen.js`):

```bash
./bumpVersion.py patch   # or major | minor | dev
./bumpVersion.py -v 3.2.0
```

## Deploying

Extract the tarball over the target directory and fix permissions so Apache can execute the PHP service:

```bash
tar -xzf shoppingList-<version>.tar.gz -C ~/www/kitchen
chgrp www-data -R ~/www/kitchen
chmod -R g+x ~/www/kitchen/service
```

Because `config.php` isn't part of the tarball, an existing deploy's config is untouched. **For a first-time deploy**, copy `service/config.php.ex` to `service/config.php` on the server and fill in real values before the site will work.

An Apache vhost example is in `apacheConfig/kitchen.conf`. Notable points:

- `DocumentRoot` is `~/www/kitchen`, with `shopping.html` as the legacy entry point.
- `/app/` (the built React app) gets `Cache-Control: no-cache` on the shell, while `/app/assets/` (Vite's content-hashed bundles) gets long-lived immutable caching.
- Under `/service/`, only `index.php` and `resetPassword.php` are directly reachable; everything else in `service/` is denied via `<Files *.php>`/`<FilesMatch>` and reached only through those two entry points.
- The two UIs live side by side and are reached at different paths: navigating to `<yoursite>` (i.e. `shopping.html` via `DirectoryIndex`) shows the legacy UI, while navigating to `<yoursite>/app/index.html` shows the new React UI. There's no redirect between them yet — both are live at once, which is what lets the React rewrite be deployed and tested without cutting over the legacy site.

CI/CD (a Jenkins job that calls `bin/package` and deploys the result) exists but its configuration is intentionally kept out of this repository.

## config.php

`service/config.php` holds all environment-specific configuration and secrets, and is never committed (it's gitignored and excluded from release tarballs). `service/config.php.ex` is the checked-in template — copy it to `config.php` and fill in real values for your environment:

```php
<?php

$CONFIG= array();

$CONFIG["DB_HOST"] = "localhost";
$CONFIG["DB_NAME"] = "shoppingList";
$CONFIG["DB_PORT"] = "3306";
$CONFIG["DB_USER"] = "";
$CONFIG["DB_PASSWORD"] = "";

$CONFIG["HOST"] = "http://shopping.example.org";
$CONFIG["BANNER_NAME"] = "Your Shopping List";
$CONFIG["BANNER"] = "";
$CONFIG["PASSWORD_RECOVERY_FROM"] = "passwordRecovery@shopping.example.org";
$CONFIG["FAV_ICON"] = "/favicon-32x32.png";

?>
```

| Key | Used by | Description |
|---|---|---|
| `DB_HOST` | `service/db.php` | MySQL host to connect to. |
| `DB_NAME` | `service/db.php` | Database name (schema is defined in `.sql/*.sql`). |
| `DB_PORT` | `service/db.php` | MySQL port, normally `3306`. |
| `DB_USER` | `service/db.php` | MySQL user the PHP service connects as. Needs read/write on the tables in `.sql/`. |
| `DB_PASSWORD` | `service/db.php` | Password for `DB_USER`. This is the main secret this file exists to keep out of git/tarballs. |
| `HOST` | `service/login.php` | Public base URL of the site, used to build links (e.g. password-recovery emails). |
| `BANNER_NAME` | `service/login.php`, reset/expired-token templates | Site name shown in the header/banner and email subject. |
| `BANNER` | reset/expired-token templates | URL/path of a banner image shown above `BANNER_NAME`. Empty string is fine. |
| `PASSWORD_RECOVERY_FROM` | `service/login.php` | "From" address used when sending password-recovery emails. |
| `FAV_ICON` | reset/expired-token templates | Path to the favicon used on the standalone PHP-rendered pages. |

The database itself needs to exist with the schema in `.sql/` (`users.sql`, `lists.sql`, `recipes.sql`, `settings.sql`, `passwordTokens.sql`) applied before `DB_USER`/`DB_PASSWORD` will do anything useful.
