ELECTRICAL TRAINING LAB - installable web app (PWA)
====================================================
Owner: Mo'men Fouad, Maintenance / Automation

WHAT THIS IS
A training tool for maintenance teams: electrical bench simulator, LOTO practice board,
PCB repair and inspection guides. 9 languages.

It is a static website. 4 items, about 3.4 MB in total:
  index.html              the whole application (HTML + CSS + JavaScript in one file)
  manifest.webmanifest    name, icons and colours used when the app is installed
  sw.js                   service worker: keeps a copy on the device so it opens offline
  icons/                  app icons

WHAT IT DOES NOT HAVE
  - no server code, no database, no login, no cookies
  - no company data, no personal data, no GMP records
  - it stores only the user's own settings (language, practice progress) in the browser
    on that device
  - no tracking, no third-party scripts, no CDN: everything is inside index.html

NETWORK CALLS
By default the app makes none after it has loaded. Two optional features can:
  1. "AI photo inspection" (Inspect tab): only if a user types in their own API key,
     the photo is sent to https://api.anthropic.com. Without a key nothing is sent.
     If company policy does not allow this, ask the owner for a build with it removed.
  2. Voice commands: use the browser's built-in speech recognition, which in Edge/Chrome
     may send audio to the browser vendor. It only runs when the user presses the
     microphone button. It can also be removed on request.

WHAT WE ASK FROM IT
  1. Host this folder as static files on any HTTPS web address the company approves.
     Examples: an internal IIS / intranet web server, Azure Static Web Apps,
     Azure Storage static website. HTTPS is required, otherwise it cannot be installed.
  2. Keep the 4 items together in the same folder, same names.
  3. Serve manifest.webmanifest as application/manifest+json (or application/json)
     and sw.js as text/javascript. Do not cache sw.js for a long time.
  4. Decide who can reach the address: company network only, or sign-in with a company
     account (Entra ID), or open. The app itself needs no accounts.
  5. Tell us the final address.

NOTE ON SHAREPOINT
Uploading index.html to a SharePoint document library is not enough: SharePoint Online
normally downloads .html files instead of running them, and a service worker cannot
work from a document library. That is why a web address is requested.

HOW USERS INSTALL IT (after it is hosted)
  Windows laptop, Edge or Chrome: open the address, then menu (...) > Apps >
      "Install this site as an app". It gets its own window and Start menu icon.
  iPhone / iPad, Safari: open the address, Share button > "Add to Home Screen".
  Android, Chrome: open the address, menu > "Install app" / "Add to Home screen".
After the first open it also works with no network.

HOW UPDATES REACH USERS
The page is loaded network-first by the service worker, and the app checks version.json
when it opens and when it comes back to the screen. When a newer build is published, users
see "A new version is ready - Update now". Offline, the last downloaded version keeps working.
To publish: replace the files (index.html, sw.js, version.json, ...) from the new build.

SECURITY
  - Content-Security-Policy (meta tag) with script hashes: only the shipped script can run,
    no external scripts, network only to this site (and api.anthropic.com only if a user
    enters their own key for the optional AI photo check).
  - Files a user opens (projects, circuits) are size-capped and cleaned before use.
  - No cookies, no accounts, no tracking. HTTPS is enforced by the host.

TESTED
Chromium desktop and phone size, 21 Nov 2026: service worker, offline reload, update bar,
no CSP violations across all tabs, hostile project files run no code.
Not yet tested on the company network or a managed (MDM) iPhone.
