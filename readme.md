# Nivix Technology Website

Static HTML, CSS, and JavaScript site. No build step or package installation is required.

- `index.html` is the company home page.
- `studio/index.html` contains released Studio apps, staff, Cloudflare-hosted downloads, developer links, and site preferences.
- The latest Store browser UI libraries are transpiled to native JavaScript in `modules/`; shared Visual Identity and component styles are in `sheets/`.
- Public release links point to Nivix's existing download hosts. Installers are not stored in this repository.

Open `index.html` or `studio/index.html` directly in a browser, or serve this directory over HTTP. Studio uses ordered classic JavaScript scripts (for local-file compatibility) and local storage for preferences.
