# DigiArtifact Time Manager

Offline-first time and revenue manager for solo creators, optimized for low-end PCs (8 GB RAM, no GPU). This repository contains the Svelte + Vite + Tailwind skeleton that will evolve into the full product roadmap outlined in `PROJECT_NOTES.md`.

## Tech Stack

- Svelte 5 with TypeScript and Vite 7 (ESBuild bundling).
- Tailwind CSS with purge-ready `content` globs to stay within bundle budgets.
- IndexedDB-first persistence (data layer wiring upcoming) and dynamic route imports for code-splitting.

## Getting Started

```powershell
cd "c:\Users\Mycelia-Interactive\Dev\coding-projects\DigiArtifact work\digiartifact-time-manager"
npm install
npm run dev
```

The dev server defaults to `http://localhost:5173/`. Use the `--host` flag (via `npm run dev -- --host`) to expose the site on your LAN when testing low-end devices.

## Available Scripts

- `npm run dev` – start Vite in development mode with HMR.
- `npm run build` – produce a production build with code-split chunks.
- `npm run preview` – serve the production build locally for smoke testing.
- `npm run check` – run `svelte-check` and TypeScript against the project configs.

## Performance Budgets

Budget expectations are documented in `docs/performance.md`:

- Cold load ≤ 2.0s, TTI ≤ 2.5s on 2019 low-end laptop profiles.
- Core JS ≤ 180 KB gz, charts ≤ 40 KB gz via lazy loading.

CI automation will enforce these targets with Lighthouse and bundle analyzer jobs once the pipeline is wired.

## Distribution Plan

- Source will live on GitHub under MIT + NOTICE attribution.
- Release artifacts: web build (static) with optional desktop wrapper later.
- Users will clone or download releases to run everything locally without depending on cloud services.

## License & Attribution

- Licensed under the [MIT License](LICENSE); redistribution must retain the license text.
- Include the [NOTICE](NOTICE) file and visible credit to “DigiArtifact / Jeremy Robards” in derivative works.
- Contributions are accepted under the same license—see [CONTRIBUTING.md](CONTRIBUTING.md) and the [Code of Conduct](CODE_OF_CONDUCT.md).
