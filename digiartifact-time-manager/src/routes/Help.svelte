<script lang="ts">
  let activeTab: 'about' | 'howto' = 'about'
</script>

<section class="space-y-6">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Help & Support</h2>
    <p class="text-sm text-slate-400">
      Everything you need to know about DigiArtifact Time Manager
    </p>
  </header>

  <nav class="flex gap-2 text-sm font-semibold">
    <button
      type="button"
      class={`rounded-lg px-4 py-2 transition ${
        activeTab === 'about'
          ? 'bg-brand-primary text-slate-900'
          : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
      }`}
      on:click={() => (activeTab = 'about')}
    >
      About
    </button>
    <button
      type="button"
      class={`rounded-lg px-4 py-2 transition ${
        activeTab === 'howto'
          ? 'bg-brand-primary text-slate-900'
          : 'border border-slate-700 text-slate-300 hover:bg-slate-800'
      }`}
      on:click={() => (activeTab = 'howto')}
    >
      How To
    </button>
  </nav>

  {#if activeTab === 'about'}
    <article class="space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
      <section>
        <h3 class="mb-3 text-lg font-semibold text-slate-100">About DigiArtifact Time Manager</h3>
        <div class="space-y-3 text-slate-300">
          <p>
            <strong class="text-brand-primary">DigiArtifact Time Manager</strong> is a comprehensive
            time tracking and project management solution designed for freelancers, agencies, and
            creative professionals.
          </p>
          <p>
            Built with modern web technologies, it offers offline-first capabilities, ensuring your
            data is always accessible and secure through local IndexedDB storage.
          </p>
        </div>
      </section>

      <section>
        <h4 class="mb-2 font-semibold text-slate-100">Key Features</h4>
        <ul class="ml-4 list-disc space-y-1 text-slate-300">
          <li>Multi-task tracking with up to 4 simultaneous timers</li>
          <li>Clock in/out system for overall work time tracking</li>
          <li>Client and project management</li>
          <li>Invoicing and payment tracking</li>
          <li>Expense and profitability analysis</li>
          <li>Product sales tracking</li>
          <li>Comprehensive reporting and CSV exports</li>
          <li>Light and dark mode themes</li>
          <li>High-contrast accessibility mode</li>
          <li>Performance optimizations for low-end devices</li>
        </ul>
      </section>

      <section>
        <h4 class="mb-2 font-semibold text-slate-100">Copyright & License</h4>
        <div class="space-y-2 text-xs text-slate-400">
          <p>© 2025 DigiArtifact / Jeremy Robards</p>
          <p>Licensed under the MIT License</p>
          <div class="space-y-1">
            <p><strong>Contact:</strong></p>
            <ul class="ml-4 list-disc">
              <li><a href="https://www.jeremyrobards.com" class="text-brand-primary hover:underline" target="_blank" rel="noopener">www.jeremyrobards.com</a></li>
              <li><a href="https://www.digiartifact.com" class="text-brand-primary hover:underline" target="_blank" rel="noopener">www.digiartifact.com</a></li>
              <li><a href="https://www.myceliainteractive.com" class="text-brand-primary hover:underline" target="_blank" rel="noopener">www.myceliainteractive.com</a> (coming soon)</li>
              <li><a href="https://www.p3epro.com" class="text-brand-primary hover:underline" target="_blank" rel="noopener">www.p3epro.com</a> - 11.11.2025 "The S33k3r"</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h4 class="mb-2 font-semibold text-slate-100">Version Information</h4>
        <p class="text-slate-400">Version 1.0.0 - October 2025</p>
      </section>
    </article>
  {:else}
    <article class="space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-6 text-sm text-slate-200">
      <section>
        <h3 class="mb-3 text-lg font-semibold text-slate-100">Getting Started</h3>
        <div class="space-y-3 text-slate-300">
          <div>
            <h5 class="mb-2 font-semibold text-slate-100">1. Clock In/Out System</h5>
            <p class="mb-2">Track your overall work hours for DigiArtifact:</p>
            <ul class="ml-6 list-disc space-y-1">
              <li>Navigate to the <strong>Dashboard</strong></li>
              <li>Click <strong>"Clock In"</strong> to start tracking your workday</li>
              <li>Click <strong>"Clock Out"</strong> when you're done</li>
              <li>View your total hours and earnings in the dashboard summary</li>
            </ul>
          </div>

          <div>
            <h5 class="mb-2 font-semibold text-slate-100">2. Multi-Task Tracking</h5>
            <p class="mb-2">Run up to 4 tasks simultaneously:</p>
            <ul class="ml-6 list-disc space-y-1">
              <li>Go to the <strong>Time</strong> page</li>
              <li>Click <strong>"Start New Task"</strong></li>
              <li>Select a client, job, and optionally a specific task</li>
              <li>Click <strong>"Start"</strong> to begin tracking</li>
              <li>Start additional tasks (up to 4 total)</li>
              <li>When you stop a task, time is calculated and saved automatically</li>
              <li>You'll be reminded if other tasks are still running</li>
            </ul>
          </div>

          <div>
            <h5 class="mb-2 font-semibold text-slate-100">3. Managing Clients & Projects</h5>
            <p class="mb-2">Organize your work:</p>
            <ul class="ml-6 list-disc space-y-1">
              <li>Navigate to <strong>Clients</strong> to add new clients</li>
              <li>Add jobs/projects for each client</li>
              <li>Track activities, contacts, and notes per client</li>
              <li>View client profitability and time spent</li>
            </ul>
          </div>

          <div>
            <h5 class="mb-2 font-semibold text-slate-100">4. Invoicing & Payments</h5>
            <p class="mb-2">Bill your clients:</p>
            <ul class="ml-6 list-disc space-y-1">
              <li>Go to <strong>Invoices</strong></li>
              <li>Create an invoice by selecting unbilled time logs</li>
              <li>Add manual line items, products, or expenses</li>
              <li>Record payments in the <strong>Payments</strong> section</li>
              <li>Track invoice status (draft, sent, partial, paid, overdue)</li>
            </ul>
          </div>

          <div>
            <h5 class="mb-2 font-semibold text-slate-100">5. Reports & Exports</h5>
            <p class="mb-2">Analyze your business:</p>
            <ul class="ml-6 list-disc space-y-1">
              <li>Visit the <strong>Reports</strong> page</li>
              <li>Filter by date range, client, or job</li>
              <li>View charts for time distribution and earnings</li>
              <li>Export data to CSV for external analysis</li>
            </ul>
          </div>

          <div>
            <h5 class="mb-2 font-semibold text-slate-100">6. Customization</h5>
            <p class="mb-2">Personalize your experience:</p>
            <ul class="ml-6 list-disc space-y-1">
              <li>Go to <strong>Settings</strong></li>
              <li>Change theme (Light/Dark mode)</li>
              <li>Enable high-contrast mode for accessibility</li>
              <li>Set your timezone and weekly target hours</li>
              <li>Enable low-end mode for better performance on older devices</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 class="mb-3 text-lg font-semibold text-slate-100">Keyboard Shortcuts</h3>
        <div class="space-y-2 text-slate-300">
          <table class="w-full border-collapse">
            <thead>
              <tr class="border-b border-slate-700">
                <th class="p-2 text-left">Shortcut</th>
                <th class="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-slate-800">
                <td class="p-2"><code class="rounded bg-slate-800 px-2 py-1">Ctrl/Cmd+K</code></td>
                <td class="p-2">Quick find (coming soon)</td>
              </tr>
              <tr class="border-b border-slate-800">
                <td class="p-2"><code class="rounded bg-slate-800 px-2 py-1">Alt+T</code></td>
                <td class="p-2">Start timer</td>
              </tr>
              <tr class="border-b border-slate-800">
                <td class="p-2"><code class="rounded bg-slate-800 px-2 py-1">Alt+P</code></td>
                <td class="p-2">Pause timer</td>
              </tr>
              <tr class="border-b border-slate-800">
                <td class="p-2"><code class="rounded bg-slate-800 px-2 py-1">Alt+S</code></td>
                <td class="p-2">Stop timer</td>
              </tr>
              <tr class="border-b border-slate-800">
                <td class="p-2"><code class="rounded bg-slate-800 px-2 py-1">Alt+A</code></td>
                <td class="p-2">Quick add time log (coming soon)</td>
              </tr>
              <tr>
                <td class="p-2"><code class="rounded bg-slate-800 px-2 py-1">Esc</code></td>
                <td class="p-2">Close menu/modal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h3 class="mb-3 text-lg font-semibold text-slate-100">Tips & Best Practices</h3>
        <ul class="ml-6 list-disc space-y-2 text-slate-300">
          <li>
            <strong>Clock in at the start of your day</strong> to track overall work hours,
            then use multi-task tracking for specific projects.
          </li>
          <li>
            <strong>Use descriptive job titles</strong> to make reporting and invoicing easier.
          </li>
          <li>
            <strong>Tag clients and deals</strong> for better organization and filtering.
          </li>
          <li>
            <strong>Export reports regularly</strong> for backup and external analysis.
          </li>
          <li>
            <strong>Enable low-end mode</strong> if you experience performance issues on older devices.
          </li>
          <li>
            <strong>Use keyboard shortcuts</strong> for faster navigation and task management.
          </li>
        </ul>
      </section>

      <section>
        <h3 class="mb-3 text-lg font-semibold text-slate-100">Troubleshooting</h3>
        <div class="space-y-3 text-slate-300">
          <div>
            <h5 class="mb-1 font-semibold text-slate-100">Data not loading?</h5>
            <p>Refresh the page. Data is stored locally in your browser's IndexedDB.</p>
          </div>
          <div>
            <h5 class="mb-1 font-semibold text-slate-100">Performance issues?</h5>
            <p>Enable "Low-end mode" in Settings to disable animations and optimize rendering.</p>
          </div>
          <div>
            <h5 class="mb-1 font-semibold text-slate-100">Can't see my data?</h5>
            <p>
              Make sure you're using the same browser and haven't cleared your browser data.
              Data is stored locally and not synced across devices.
            </p>
          </div>
        </div>
      </section>
    </article>
  {/if}
</section>
