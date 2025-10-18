# DigiArtifact Time Manager - Developer Guide

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Repository Pattern](#repository-pattern)
5. [Web Worker Usage](#web-worker-usage)
6. [Adding a New Entity](#adding-a-new-entity)
7. [State Management](#state-management)
8. [Database Schema](#database-schema)
9. [Component Architecture](#component-architecture)
10. [Build & Deploy](#build--deploy)

---

## Architecture Overview

### Design Philosophy
DigiArtifact Time Manager follows these core principles:

1. **Offline-First**: All data stored in IndexedDB, no server required
2. **Performance**: Web Workers for heavy operations, lazy loading
3. **Type Safety**: TypeScript throughout
4. **Reactive**: Svelte 5 stores with fine-grained reactivity
5. **Modular**: Repository pattern for data access

### System Layers

```
┌─────────────────────────────────────┐
│         UI Layer (Svelte)           │
│  Components, Routes, Stores         │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      State Management Layer         │
│  Svelte Stores + Session Store      │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│     Repository Pattern Layer        │
│  BaseRepository + Entity Repos      │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│      IndexedDB Wrapper Layer        │
│    db.ts + Worker Interface         │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│         Browser IndexedDB           │
│   Persistent Local Storage          │
└─────────────────────────────────────┘
```

### Data Flow

**Read Operations:**
```
Component → Store → Repository → IndexedDB → Return Data → Update Store → Re-render UI
```

**Write Operations:**
```
User Action → Store Method → Repository → IndexedDB → Success → Update Store → Re-render UI
```

**Worker-Based Operations:**
```
Heavy Operation → Post to Worker → Worker Processes → postMessage Result → Update UI
```

---

## Technology Stack

### Core Framework
- **Svelte 5.39.6**: Reactive UI framework with runes
- **Vite 7.1.10**: Build tool and dev server
- **TypeScript 5.7.3**: Type safety and IDE support

### Styling
- **Tailwind CSS 4.1.14**: Utility-first CSS framework
- **@tailwindcss/postcss 4.1.14**: PostCSS plugin for Tailwind v4
- **PostCSS**: CSS processing

### Data & State
- **IndexedDB**: Browser-native database (via `idb` wrapper)
- **idb 8.0.1**: Promise-based IndexedDB wrapper
- **Svelte Stores**: Reactive state management

### Charting & Visualization
- **uPlot 1.6.31**: Fast, lightweight charts

### Date Handling
- **date-fns 4.1.0**: Modern date utility library

### Development Tools
- **Svelte Check**: Type checking for Svelte components
- **ESLint**: Code linting
- **Prettier**: Code formatting

---

## Project Structure

```
digiartifact-time-manager/
├── src/
│   ├── lib/
│   │   ├── components/           # Reusable UI components
│   │   │   ├── AppShell.svelte   # Main layout wrapper
│   │   │   ├── ClockInOut.svelte # Work session tracker
│   │   │   ├── MultiTaskTracker.svelte # Multi-task UI
│   │   │   ├── Navigation.svelte # Sidebar navigation
│   │   │   ├── PerformanceMonitor.svelte # FPS/memory stats
│   │   │   └── ToastHost.svelte  # Toast notifications
│   │   ├── repos/                # Repository pattern
│   │   │   ├── base.repo.ts      # Base repository class
│   │   │   ├── client.repo.ts    # Client entity repo
│   │   │   ├── deal.repo.ts      # Deal entity repo
│   │   │   ├── expense.repo.ts   # Expense entity repo
│   │   │   ├── invoice.repo.ts   # Invoice entity repo
│   │   │   ├── job.repo.ts       # Job entity repo
│   │   │   ├── payment.repo.ts   # Payment entity repo
│   │   │   ├── product.repo.ts   # Product entity repo
│   │   │   └── timeEntry.repo.ts # Time entry repo
│   │   ├── stores/               # Svelte stores
│   │   │   ├── sessionStore.ts   # Global session state
│   │   │   └── toastStore.ts     # Toast notifications
│   │   ├── types/                # TypeScript type definitions
│   │   │   ├── client.types.ts
│   │   │   ├── deal.types.ts
│   │   │   ├── expense.types.ts
│   │   │   ├── invoice.types.ts
│   │   │   ├── job.types.ts
│   │   │   ├── payment.types.ts
│   │   │   ├── product.types.ts
│   │   │   └── timeEntry.types.ts
│   │   └── db.ts                 # IndexedDB setup & wrapper
│   ├── routes/                   # Route/page components
│   │   ├── Dashboard.svelte      # Weekly dashboard
│   │   ├── Time.svelte           # Time tracking
│   │   ├── Jobs.svelte           # Jobs & tasks
│   │   ├── Clients.svelte        # Client management
│   │   ├── Deals.svelte          # Pipeline
│   │   ├── Products.svelte       # Product catalog
│   │   ├── Invoices.svelte       # Invoicing
│   │   ├── Payments.svelte       # Payment tracking
│   │   ├── Expenses.svelte       # Expense tracking
│   │   ├── Reports.svelte        # Analytics
│   │   ├── Settings.svelte       # App settings
│   │   └── Help.svelte           # Help & docs
│   ├── workers/                  # Web Workers
│   │   └── data.worker.ts        # Heavy data operations
│   ├── App.svelte                # Root component
│   ├── app.css                   # Global styles
│   ├── main.ts                   # Entry point
│   └── vite-env.d.ts             # Vite types
├── public/                       # Static assets
├── docs/                         # Documentation
│   ├── user-guide.md
│   ├── dev-guide.md
│   └── performance.md
├── package.json                  # Dependencies
├── tsconfig.json                 # TypeScript config
├── tailwind.config.cjs           # Tailwind config
├── postcss.config.cjs            # PostCSS config
├── vite.config.ts                # Vite config
└── README.md                     # Project readme
```

---

## Repository Pattern

### Why Repository Pattern?

The repository pattern provides:
1. **Abstraction**: UI doesn't need to know about IndexedDB details
2. **Reusability**: Common CRUD operations in base class
3. **Type Safety**: Generic typing ensures compile-time checks
4. **Consistency**: All entities follow same interface
5. **Testability**: Easy to mock repositories for testing

### BaseRepository Class

Located in `src/lib/repos/base.repo.ts`:

```typescript
export abstract class BaseRepository<T extends BaseRecord> {
  constructor(
    protected storeName: string,
    protected db: () => Promise<IDBPDatabase<DB>>
  ) {}

  // Create
  async create(entity: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const database = await this.db()
    const now = new Date().toISOString()
    const record = {
      ...entity,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    } as T
    await database.add(this.storeName as StoreNames<DB>, record)
    return record
  }

  // Read all
  async getAll(): Promise<T[]> {
    const database = await this.db()
    return await database.getAll(this.storeName as StoreNames<DB>)
  }

  // Read by ID
  async getById(id: string): Promise<T | undefined> {
    const database = await this.db()
    return await database.get(this.storeName as StoreNames<DB>, id)
  }

  // Update
  async update(id: string, updates: Partial<T>): Promise<T> {
    const database = await this.db()
    const existing = await this.getById(id)
    if (!existing) throw new Error(`${this.storeName} with id ${id} not found`)
    const updated = {
      ...existing,
      ...updates,
      id,
      updatedAt: new Date().toISOString(),
    } as T
    await database.put(this.storeName as StoreNames<DB>, updated)
    return updated
  }

  // Delete
  async delete(id: string): Promise<void> {
    const database = await this.db()
    await database.delete(this.storeName as StoreNames<DB>, id)
  }
}
```

### BaseRecord Interface

All entities extend this:

```typescript
export interface BaseRecord {
  id: string            // UUID v4
  createdAt: string     // ISO 8601 timestamp
  updatedAt: string     // ISO 8601 timestamp
}
```

### Entity-Specific Repositories

Example: `src/lib/repos/job.repo.ts`

```typescript
import { BaseRepository } from './base.repo'
import type { Job } from '../types/job.types'

export class JobRepository extends BaseRepository<Job> {
  constructor(db: () => Promise<IDBPDatabase<DB>>) {
    super('jobs', db)
  }

  // Custom query methods
  async getActiveJobs(): Promise<Job[]> {
    const all = await this.getAll()
    return all.filter(job => job.status === 'active')
  }

  async getJobsByClient(clientId: string): Promise<Job[]> {
    const all = await this.getAll()
    return all.filter(job => job.clientId === clientId)
  }
}
```

### Using Repositories in Components

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { JobRepository } from '$lib/repos/job.repo'
  import { getDB } from '$lib/db'

  const jobRepo = new JobRepository(getDB)
  let jobs = $state<Job[]>([])

  onMount(async () => {
    jobs = await jobRepo.getAll()
  })

  async function createJob(data: Partial<Job>) {
    const newJob = await jobRepo.create(data)
    jobs = [...jobs, newJob]
  }

  async function updateJob(id: string, updates: Partial<Job>) {
    await jobRepo.update(id, updates)
    jobs = await jobRepo.getAll() // Refresh
  }

  async function deleteJob(id: string) {
    await jobRepo.delete(id)
    jobs = jobs.filter(j => j.id !== id)
  }
</script>
```

---

## Web Worker Usage

### Why Web Workers?

Web Workers enable:
1. **Non-blocking operations**: Heavy processing doesn't freeze UI
2. **Better performance**: Utilizes multiple CPU cores
3. **Responsiveness**: UI remains smooth during data operations

### Worker Setup

Located in `src/workers/data.worker.ts`:

```typescript
// Worker receives messages from main thread
self.addEventListener('message', async (event: MessageEvent) => {
  const { type, payload } = event.data

  switch (type) {
    case 'PROCESS_REPORT':
      const result = await processHeavyReport(payload)
      self.postMessage({ type: 'REPORT_COMPLETE', result })
      break

    case 'EXPORT_DATA':
      const exportData = await exportAllData()
      self.postMessage({ type: 'EXPORT_COMPLETE', data: exportData })
      break
  }
})

async function processHeavyReport(params: any) {
  // Heavy computation here
  // No access to DOM, only data processing
  return processedData
}
```

### Using Workers from Components

```svelte
<script lang="ts">
  import { onMount } from 'svelte'

  let worker: Worker
  let result = $state<any>(null)

  onMount(() => {
    worker = new Worker('/src/workers/data.worker.ts', { type: 'module' })

    worker.addEventListener('message', (event) => {
      const { type, result: data } = event.data
      if (type === 'REPORT_COMPLETE') {
        result = data
      }
    })

    return () => worker.terminate()
  })

  function generateReport() {
    worker.postMessage({
      type: 'PROCESS_REPORT',
      payload: { /* params */ }
    })
  }
</script>
```

### Worker Best Practices

1. **Keep workers stateless**: Don't store data in workers
2. **Transfer large data**: Use `Transferable` objects when possible
3. **Error handling**: Always handle worker errors
4. **Terminate workers**: Clean up when component unmounts
5. **Fallback**: Provide non-worker fallback for older browsers

---

## Adding a New Entity

Follow these steps to add a new entity type:

### Step 1: Define TypeScript Types

Create `src/lib/types/myEntity.types.ts`:

```typescript
import type { BaseRecord } from './base.types'

export interface MyEntity extends BaseRecord {
  name: string
  description: string
  status: 'active' | 'inactive'
  // Add your fields
}

export type CreateMyEntityInput = Omit<MyEntity, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateMyEntityInput = Partial<CreateMyEntityInput>
```

### Step 2: Update Database Schema

In `src/lib/db.ts`, add to the `DB` interface:

```typescript
export interface DB extends DBSchema {
  // Existing stores...
  myEntities: {
    key: string
    value: MyEntity
    indexes: {
      'by-status': string
      'by-name': string
    }
  }
}
```

Update the `initDB` function:

```typescript
export async function initDB(): Promise<IDBPDatabase<DB>> {
  return await openDB<DB>('digiartifact-time-manager', 3, { // Increment version!
    upgrade(db, oldVersion, newVersion, transaction) {
      // Existing upgrades...

      if (oldVersion < 3) {
        const myEntityStore = db.createObjectStore('myEntities', { keyPath: 'id' })
        myEntityStore.createIndex('by-status', 'status')
        myEntityStore.createIndex('by-name', 'name')
      }
    },
  })
}
```

### Step 3: Create Repository

Create `src/lib/repos/myEntity.repo.ts`:

```typescript
import { BaseRepository } from './base.repo'
import type { MyEntity } from '../types/myEntity.types'
import type { IDBPDatabase } from 'idb'
import type { DB } from '../db'

export class MyEntityRepository extends BaseRepository<MyEntity> {
  constructor(db: () => Promise<IDBPDatabase<DB>>) {
    super('myEntities', db)
  }

  // Add custom query methods
  async getByStatus(status: 'active' | 'inactive'): Promise<MyEntity[]> {
    const database = await this.db()
    return await database.getAllFromIndex('myEntities', 'by-status', status)
  }

  async search(term: string): Promise<MyEntity[]> {
    const all = await this.getAll()
    return all.filter(entity => 
      entity.name.toLowerCase().includes(term.toLowerCase())
    )
  }
}
```

### Step 4: Create Route Component

Create `src/routes/MyEntities.svelte`:

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { MyEntityRepository } from '$lib/repos/myEntity.repo'
  import { getDB } from '$lib/db'
  import { toastSuccess, toastError } from '$lib/stores/toastStore'

  const repo = new MyEntityRepository(getDB)
  let entities = $state<MyEntity[]>([])
  let loading = $state(true)

  onMount(async () => {
    try {
      entities = await repo.getAll()
    } catch (error) {
      toastError('Failed to load entities')
    } finally {
      loading = false
    }
  })

  async function createEntity(data: CreateMyEntityInput) {
    try {
      const newEntity = await repo.create(data)
      entities = [...entities, newEntity]
      toastSuccess('Entity created')
    } catch (error) {
      toastError('Failed to create entity')
    }
  }
</script>

<div class="space-y-6 p-6">
  <header class="flex items-center justify-between">
    <h1 class="text-2xl font-bold">My Entities</h1>
    <button onclick={() => createEntity({...})}>+ New Entity</button>
  </header>

  {#if loading}
    <p>Loading...</p>
  {:else}
    <ul>
      {#each entities as entity (entity.id)}
        <li>{entity.name}</li>
      {/each}
    </ul>
  {/if}
</div>
```

### Step 5: Register Route

In `src/routes.ts` (or wherever routes are defined):

```typescript
import MyEntities from './routes/MyEntities.svelte'

export const routes = {
  // Existing routes...
  'my-entities': {
    component: MyEntities,
    title: 'My Entities',
    description: 'Manage your entities'
  }
}
```

### Step 6: Add to Navigation

In `src/App.svelte`, add to `navSections`:

```typescript
const navSections: NavSection[] = [
  {
    label: 'My Section',
    items: [
      {
        key: 'my-entities',
        title: 'My Entities',
        description: 'Manage your entities'
      }
    ]
  }
]
```

### Step 7: Test

1. Clear IndexedDB (F12 → Application → IndexedDB → Delete database)
2. Refresh app
3. Check that new object store is created (version should be 3)
4. Test CRUD operations
5. Verify data persists after refresh

---

## State Management

### Svelte 5 Stores

DigiArtifact uses Svelte 5's new `$state` runes for component-local state and custom stores for global state.

### Session Store

Located in `src/lib/stores/sessionStore.ts`:

```typescript
import { writable } from 'svelte/store'

interface SessionState {
  currentRoute: string
  lowEndMode: boolean
  performanceMonitorEnabled: boolean
  theme: 'light' | 'dark'
  activeTasks: ActiveTask[]
  activeSession: WorkSession | null
}

function createSessionStore() {
  const { subscribe, set, update } = writable<SessionState>({
    currentRoute: 'dashboard',
    lowEndMode: false,
    performanceMonitorEnabled: false,
    theme: 'light',
    activeTasks: [],
    activeSession: null
  })

  return {
    subscribe,
    setRoute: (route: string) => update(s => ({ ...s, currentRoute: route })),
    toggleLowEndMode: () => update(s => ({ ...s, lowEndMode: !s.lowEndMode })),
    toggleTheme: () => update(s => ({ ...s, theme: s.theme === 'light' ? 'dark' : 'light' })),
    // More methods...
  }
}

export const sessionStore = createSessionStore()
```

### Using Stores in Components

```svelte
<script lang="ts">
  import { sessionStore } from '$lib/stores/sessionStore'

  // Subscribe to entire store
  $: currentRoute = $sessionStore.currentRoute

  // Or destructure
  $: ({ theme, lowEndMode } = $sessionStore)

  function changeTheme() {
    sessionStore.toggleTheme()
  }
</script>
```

### Toast Store

Located in `src/lib/stores/toastStore.ts`:

```typescript
export function toastSuccess(message: string) {
  // Show success toast
}

export function toastError(message: string) {
  // Show error toast
}

export function toastInfo(message: string) {
  // Show info toast
}
```

---

## Database Schema

### Current Version: 2

Object stores and their indexes:

#### `clients`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-name`: `name` (string)
  - `by-email`: `email` (string)

#### `jobs`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-client`: `clientId` (string)
  - `by-status`: `status` (string)

#### `timeEntries`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-job`: `jobId` (string)
  - `by-date`: `date` (string, ISO 8601)

#### `deals`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-client`: `clientId` (string)
  - `by-stage`: `stage` (string)

#### `products`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-sku`: `sku` (string)
  - `by-type`: `type` (string)

#### `invoices`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-client`: `clientId` (string)
  - `by-status`: `status` (string)
  - `by-issue-date`: `issueDate` (string)

#### `payments`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-invoice`: `invoiceId` (string)
  - `by-date`: `date` (string)

#### `expenses`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-category`: `category` (string)
  - `by-date`: `date` (string)

#### `settings`
- **Key**: `key` (string)
- **Value**: `value` (any)

#### `workSessions`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-start`: `startTime` (string, ISO 8601)

#### `activeTasks`
- **Key**: `id` (string, UUID)
- **Indexes**:
  - `by-start`: `startTime` (string, ISO 8601)

### Migration Strategy

When updating schema:

1. **Increment database version** in `initDB()`:
   ```typescript
   return await openDB<DB>('digiartifact-time-manager', 3, { // Was 2
   ```

2. **Add upgrade logic**:
   ```typescript
   if (oldVersion < 3) {
     // Create new stores
     // Add new indexes
     // Migrate existing data if needed
   }
   ```

3. **Test migration**:
   - Test with existing data
   - Test with fresh install
   - Verify data integrity

---

## Component Architecture

### Component Hierarchy

```
App.svelte
├── AppShell.svelte
│   ├── Navigation.svelte
│   ├── Header.svelte
│   └── {ActiveRoute}
│       ├── Dashboard.svelte
│       │   ├── ClockInOut.svelte
│       │   └── MultiTaskTracker.svelte
│       ├── Time.svelte
│       ├── Jobs.svelte
│       └── ...
├── ToastHost.svelte
└── PerformanceMonitor.svelte (if enabled)
```

### Component Patterns

#### 1. Container/Presentation Split

**Container** (smart component):
```svelte
<script lang="ts">
  // Data fetching, business logic
  import { JobRepository } from '$lib/repos/job.repo'
  import JobList from './JobList.svelte'

  let jobs = $state<Job[]>([])
  // ... fetch logic
</script>

<JobList {jobs} on:delete={handleDelete} />
```

**Presentation** (dumb component):
```svelte
<script lang="ts">
  interface Props {
    jobs: Job[]
    ondelete?: (id: string) => void
  }

  let { jobs, ondelete }: Props = $props()
</script>

<ul>
  {#each jobs as job}
    <li>
      {job.name}
      <button onclick={() => ondelete?.(job.id)}>Delete</button>
    </li>
  {/each}
</ul>
```

#### 2. Composable Stores

```svelte
<script lang="ts">
  import { sessionStore } from '$lib/stores/sessionStore'
  import { derived } from 'svelte/store'

  const isLowEnd = derived(sessionStore, $s => $s.lowEndMode)
</script>

{#if $isLowEnd}
  <SimpleView />
{:else}
  <EnhancedView />
{/if}
```

#### 3. Error Boundaries

```svelte
<script lang="ts">
  import { onMount } from 'svelte'
  import { toastError } from '$lib/stores/toastStore'

  let error = $state<Error | null>(null)

  onMount(async () => {
    try {
      // Risky operation
    } catch (e) {
      error = e as Error
      toastError(e.message)
    }
  })
</script>

{#if error}
  <ErrorDisplay {error} />
{:else}
  <slot />
{/if}
```

---

## Build & Deploy

### Development

Start dev server:
```bash
npm run dev
```

Runs on `http://localhost:5173`

### Production Build

Build optimized bundle:
```bash
npm run build
```

Output: `dist/` folder

### Preview Production Build

```bash
npm run preview
```

### Type Checking

Run Svelte type checker:
```bash
npm run check
```

### Linting

```bash
npm run lint
```

### Deployment Options

#### 1. Static Hosting (Vercel, Netlify)
- Build with `npm run build`
- Deploy `dist/` folder
- Configure SPA routing (redirect all to `index.html`)

#### 2. Electron Desktop App
```bash
# Install electron
npm install -D electron electron-builder

# Build web app
npm run build

# Package as desktop app
npm run electron:build
```

#### 3. Docker Container
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npm run build
CMD ["npm", "run", "preview"]
```

### Environment Variables

Create `.env` file:
```
VITE_APP_NAME=DigiArtifact Time Manager
VITE_VERSION=1.0.0
```

Access in code:
```typescript
const appName = import.meta.env.VITE_APP_NAME
```

---

## Testing Strategy

### Unit Tests (Future)

```bash
npm install -D vitest @testing-library/svelte
```

Test repositories:
```typescript
import { describe, it, expect } from 'vitest'
import { JobRepository } from '$lib/repos/job.repo'

describe('JobRepository', () => {
  it('creates a job', async () => {
    const repo = new JobRepository(mockDB)
    const job = await repo.create({ title: 'Test Job' })
    expect(job.id).toBeDefined()
    expect(job.title).toBe('Test Job')
  })
})
```

### Integration Tests

Test full workflows:
```typescript
describe('Job workflow', () => {
  it('creates job, adds time entry, generates invoice', async () => {
    // Create job
    // Add time entry
    // Create invoice
    // Verify totals
  })
})
```

### E2E Tests (Playwright)

```bash
npm install -D @playwright/test
```

```typescript
import { test, expect } from '@playwright/test'

test('clock in and out', async ({ page }) => {
  await page.goto('http://localhost:5173')
  await page.click('text=Clock In')
  await expect(page.locator('text=Clock Out')).toBeVisible()
  await page.click('text=Clock Out')
  await expect(page.locator('text=Clock In')).toBeVisible()
})
```

---

## Performance Optimization

### Code Splitting

Vite automatically splits routes:
```typescript
const Dashboard = () => import('./routes/Dashboard.svelte')
```

### Lazy Loading

```svelte
<script lang="ts">
  let HeavyComponent = $state<any>(null)

  async function loadHeavy() {
    const module = await import('./HeavyComponent.svelte')
    HeavyComponent = module.default
  }
</script>

{#if HeavyComponent}
  <svelte:component this={HeavyComponent} />
{:else}
  <button onclick={loadHeavy}>Load</button>
{/if}
```

### IndexedDB Best Practices

1. **Use indexes** for frequent queries
2. **Batch operations** when possible
3. **Limit result sets** with cursor ranges
4. **Use transactions** for consistency

```typescript
// Good: Use index
const activeJobs = await db.getAllFromIndex('jobs', 'by-status', 'active')

// Bad: Get all then filter
const allJobs = await db.getAll('jobs')
const activeJobs = allJobs.filter(j => j.status === 'active')
```

### Virtual Scrolling

For long lists:
```bash
npm install svelte-virtual-list
```

---

## Debugging

### IndexedDB Inspector

1. Open DevTools (F12)
2. Go to **Application** → **IndexedDB**
3. Expand database
4. View object stores and data

### Performance Profiling

1. Enable Performance Monitor (toggle in header)
2. Watch FPS and memory usage
3. Use Chrome DevTools Performance tab
4. Record timeline and analyze

### Logging

Add debug logging:
```typescript
const DEBUG = import.meta.env.DEV

export function log(...args: any[]) {
  if (DEBUG) {
    console.log('[DEBUG]', ...args)
  }
}
```

---

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow Prettier formatting
- Use meaningful variable names
- Comment complex logic
- Keep functions small (<50 lines)

### Pull Request Process

1. Fork the repository
2. Create feature branch (`git checkout -b feature/my-feature`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push to branch (`git push origin feature/my-feature`)
5. Open Pull Request

### Commit Messages

Follow conventional commits:
```
feat: Add expense tracking
fix: Correct invoice total calculation
docs: Update dev guide
refactor: Simplify job repository
test: Add unit tests for payments
```

---

## License

MIT License - see LICENSE file for details.

---

**Version**: 1.0.0  
**Last Updated**: October 2025  
**Maintainer**: TheSeeker713
