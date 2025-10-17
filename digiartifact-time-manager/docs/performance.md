# Performance Budgets

These budgets are binding for all feature work targeting low-end creator hardware (8 GB RAM, no dedicated GPU, 2019 laptop class, 10 Mbps connection).

- **Cold load:** ≤ 2.0 seconds on throttled hardware profile.
- **Time-to-interactive (TTI):** ≤ 2.5 seconds under the same profile.
- **Core JavaScript budget:** ≤ 180 KB gzipped for the critical path bundle.
- **Charts bundle:** ≤ 40 KB gzipped, delivered lazily only when analytics views are opened.

## Enforcement Strategy

- Vite bundle analyzer checks run in CI with hard fails when gzip budgets are exceeded.
- Lighthouse CI scripted run on a 10 Mbps / 4x CPU slow-down profile ensures cold load and TTI stay on target.
- Storybook (or equivalent) instrumentation captures module-level load timings to keep dynamic imports lean.
- CI smoke tests cover 10k-row CSV export to guarantee sub-2s completion without blocking the UI thread.

## Developer Guardrails

- Prefer progressive enhancement and code-split secondary routes via dynamic imports (`routes/index.ts`).
- Offload heavy aggregations, CSV generation, and AR aging to Web Workers before shipping to main.
- Default to low-end mode in development to expose perf regressions early (no chart animations, virtualized lists).
- Track and document third-party dependencies; weekly dependency review removes unused packages.
