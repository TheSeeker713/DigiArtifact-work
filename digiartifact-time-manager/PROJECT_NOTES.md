# Project Notes — DigiArtifact Time Manager

## Roadmap Summary
- Build a fast, offline-first time and revenue manager that starts with solo creators and can expand to a small team, packaged under a free license that requires attribution (Apache-2.0 + NOTICE).
- Core MVP modules: time logging with 60/20/20 job targets, jobs/tasks, mini-CRM for clients and deals, invoices and payments, product catalog and sales, charts/reports, backups, and CSV exports with all data stored locally via IndexedDB (idb helper).
- Performance and hardware constraints: optimized for low-end PCs (8 GB RAM, no discrete GPU) with cold load ≤ 2.0s, TTI ≤ 2.5s, JS bundle ≤ 180 KB gz, charts ≤ 40 KB gz, memory ≤ 250 MB at scale, idle CPU < 3%, CSV export 10k rows < 2s; provide a low-end mode with list virtualization and minimal animations.
- Architecture preferences: Svelte or Solid with Vite build, Tailwind or Pico.css styling, uPlot charts (lazy-loaded), date-fns for time math, and Web Workers handling heavy aggregations and exports.
- Distribution plan: open-source GitHub repository delivering downloadable builds (web-first, optional desktop wrapper later) with GitHub Actions, documentation (Quickstart, User Guide, Dev Guide), and Apache-2.0 licensing.

## Acceptance Criteria (Sprint 0)
- Repo scaffolded under `digiartifact-time-manager` with clear offline-first mandate, low-end optimization notes, and GitHub distribution strategy documented.
- Project tooling decisions align with roadmap defaults (Svelte/Vite stack, IndexedDB persistence, uPlot, date-fns) or capture rationale for variance.
- Local persistence wiring plan defined (IndexedDB schemas matching MVP data model) along with backup/export/import expectations.
- Performance budgets and low-end mode behaviors codified in project documentation to guide future stories and tests.
- Licensing setup prepared for Apache-2.0 with NOTICE to ensure attribution once code is added.
