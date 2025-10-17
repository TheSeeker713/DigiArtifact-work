# DigiArtifact Time Manager — Project Roadmap

## 1) Vision & Scope
**Build a fast, offline‑first time & revenue manager** for solo creators that scales to a small team. Target low‑end PCs (8 GB RAM, no GPU). Free to use and rebuild with attribution.

**Primary modules**: Time & Scheduling, Jobs/Tasks, Clients (mini‑CRM), Money (Quotes/Invoices/Payments/Expenses), Products (digital sales), Intake Form, Reports/Charts.

**Distribution**: Open‑source repo on GitHub with downloadable builds (web and optional desktop wrapper later).

---

## 2) Outcomes (MVP → Release)
- **MVP (Solo)**: Log time; set weekly targets (60 hrs total, 20/20/20 per job); track clients; raise invoices; record payments; see charts; CSV export; all offline in the browser.
- **Team‑ready (R1)**: Roles (Owner/Manager/Worker); pipeline board; AR aging; intake form that creates leads; expenses; product sales tracking; backups.
- **Polish (R2)**: Low‑end mode auto‑tuning; web worker offloads; list virtualization; incremental aggregates; optional desktop (Tauri) build; calendar export.

**Non‑goals (now)**: Multi‑tenant SaaS, online sync, payment processing, OAuth.

---

## 3) Users & Jobs‑to‑be‑Done
- **Owner/Creator (you):** Plan week, log time, invoice clients, track AR, keep to 60/20/20.
- **Manager (future):** Schedule/approve time, manage pipeline, oversee invoices.
- **Worker (future):** View schedule, clock in/out, log tasks.

---

## 4) Operating Constraints (Low‑End First)
- Cold load ≤ **2.0s**; TTI ≤ **2.5s** on 2019 laptop (10 Mbps).
- JS core bundle ≤ **180 KB** gz; charts ≤ **40 KB** gz (lazy‑loaded).
- Memory steady‑state ≤ **250 MB** with 5k logs.
- Idle CPU < **3%**; CSV export 10k rows < **2s** without UI jank.

**Low‑end mode**: disable chart animations, virtualize lists, cap initial rows, reduce CSS effects; worker offloads for heavy queries/exports.

---

## 5) Architecture & Stack
- **Framework**: Svelte (or Solid). If React needed → Preact + signals.
- **Styling**: Tailwind (purged) or Pico.css.
- **Storage**: IndexedDB via `idb` (local‑first). Optional SQLite WASM later for heavy reports.
- **Charts**: uPlot (lazy import). No animations in low‑end mode.
- **Dates**: date‑fns (tree‑shaken). Timezone fixed to **America/Los_Angeles**.
- **Workers**: Web Workers for aggregations, CSV, AR aging, large queries.
- **Build**: Vite + code‑split routes; strict ESLint/Prettier; GitHub Actions for build.

---

## 6) Data Model (MVP essentials)
- **Settings**: week_target_hours=60; per_job_targets={Freelancing:20, Content:20, Digital:20}; week_start_day; timezone.
- **Jobs**(id, title, client_id?, rate?, status)
- **Tasks**(id, job_id, name)
- **TimeLogs**(id, person_id?, job_id, task_id?, start_dt, end_dt, duration_min, note, billable)
- **Clients**(id, name, billing_email, phone, website, tags, status)
- **Contacts**(id, client_id, name, email, phone, title)
- **Deals/Projects**(id, client_id, title, stage, value_est, probability, job_type)
- **Invoices**(id, client_id, issue_dt, due_dt, status, subtotal, tax, total, currency)
- **InvoiceItems**(id, invoice_id, type, job_id?, description, qty, unit_price, amount)
- **Payments**(id, invoice_id, received_dt, method, amount, reference)
- **Expenses**(id, job_id?, client_id?, category, vendor, amount, dt, note)
- **Products**(id, sku, title, price, channel)
- **ProductSales**(id, product_id, dt, qty, gross, fees, net, channel_ref)
- **Activities**(id, client_id, contact_id?, deal_id?, type, dt, summary, next_action_dt?)
- **FormSubmissions**(id, source, payload_json, created_dt, consent)
- **Audit**(id, entity, entity_id, action, before_json, after_json, ts)

*Indexes*: TimeLogs by week/job; Invoices by status/due_dt; Payments by invoice; Activities by client/date.

---

## 7) Features by Release
### MVP (Sprint 1–2)
- Job/Task creation form; dynamic selectors.
- Time logger (start/pause/stop; manual entry) with overlap guard.
- Weekly dashboard: total vs 60; per‑job bars vs 20/20/20.
- Clients CRUD; simple Deals list with stages (no board yet).
- Invoices → Payments; status + outstanding; CSV exports (time, billing).
- Reports/Charts (lazy): Hours vs target; Revenue by month; Per‑job distribution.
- Backups: JSON export/import; soft‑delete + audit.

### Release 1 (Sprint 3–4)
- Kanban pipeline board; weighted pipeline.
- AR aging report (0–30/31–60/61–90/90+).
- Intake/contact public form → auto lead + activity.
- Expenses; Product SKUs + Sales; profitability by job/client.
- Low‑end mode: toggle + auto‑detect; list virtualization.

### Release 2 (Sprint 5+)
- Web Worker aggregation; incremental aggregates on write.
- Optional Tauri desktop build; calendar export (ICS/one‑way GCal).
- Rate cards, billable vs non‑billable filters, saved reports.

---

## 8) UX Principles
- Keyboard‑first: global hotkeys for timer; quick‑add dialogs.
- Week focus: default view is current week summary with clear targets.
- Zero‑distraction: minimal motion; readable at 125–150% DPI.
- Undo/Restore: soft deletes with simple recovery drawer.

---

## 9) Security, Privacy, Offline
- Local‑first; no external calls by default.
- Optional email templates later; avoid storing secrets.
- Audit trail for edits; confirm destructive actions.

---

## 10) Packaging & Licensing
- **License**: Apache‑2.0 with **NOTICE** requiring attribution.
- **Repo**: MIT‑style simplicity acceptable but Apache‑2.0 better for attribution + patents.
- **Distribution**: GitHub Releases (zip), docs site with quickstart.

---

## 11) Testing & Quality Gates
- Seed data (10k logs, 1k activities, 500 invoices) fixture.
- Performance CI: bundle size check; Lighthouse CI (PWA not required now).
- Unit tests: repositories, time math, AR buckets, invoice totals.
- E2E smoke: create job → log time → invoice → payment → reports.

---

## 12) Risks & Mitigations
- **Perf regressions** → Budgets + CI checks + Workers.
- **Data loss** → Auto backup daily; manual export; audit trail.
- **Scope creep** → Phase gates; backlog triage weekly.

---

## 13) Milestones & Deliverables
- **Sprint 0 (1–2 days)**: Repo, scaffold, data layer, settings seed, design tokens.
- **Sprint 1 (1 week)**: Jobs/Tasks, Time Logger, Weekly Dashboard, CSV export.
- **Sprint 2 (1 week)**: Clients, Invoices/Payments, Reports (hours/revenue), Backups.
- **Sprint 3 (1 week)**: Pipeline board, AR aging, Intake form, Expenses.
- **Sprint 4 (1 week)**: Products & Sales, Low‑end mode, virtualization, docs site.

Deliverables each sprint: tagged release, CHANGELOG, user guide update.

---

## 14) Definition of Done (DoD)
- Meets performance budgets on throttled hardware profile.
- No critical console errors; P95 action < 100ms.
- Data export/import works; backups verified.
- Docs: Quickstart, User Guide, Dev Guide, License + NOTICE.
- Accessibility pass: keyboard ops; basic ARIA; high contrast.

---

## 15) Future Enhancements (Backlog)
- Multi‑user sync; auth & roles; read‑only share links.
- Email/send invoices; payment links; tax rules by region.
- Calendar two‑way sync; mobile PWA packaging; widget timer.
- Analytics: cohort revenue, win/loss insights, SKU funnels.

---

## 16) Glossary
- **AR**: Accounts Receivable (unpaid invoices).
- **Low‑end mode**: Performance profile for 8 GB/no‑GPU machines.
- **Incremental aggregates**: Pre‑computed totals updated on write.

