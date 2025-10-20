<script lang="ts">
  import { createEventDispatcher } from 'svelte'
  import type { DatabaseBackup } from '../services/databaseService'

  export let isOpen = false
  export let statistics: Record<string, number> = {}

  type PurgeStep = 'confirm' | 'offer-export' | 'final-confirmation' | 'purging' | 'complete'
  
  let currentStep: PurgeStep = 'confirm'
  let confirmationText = ''
  let exportOffered = false
  let purging = false
  let progress = { step: '', current: 0, total: 0 }
  let result: { deletedRecords: number; clearedStores: number } | null = null

  const dispatch = createEventDispatcher<{
    close: void
    export: void
    purge: { skipExport: boolean }
  }>()

  $: totalRecords = Object.values(statistics).reduce((sum, count) => sum + count, 0)

  function handleClose() {
    if (!purging) {
      dispatch('close')
      resetModal()
    }
  }

  function handleFirstConfirm() {
    currentStep = 'offer-export'
  }

  function handleExportData() {
    exportOffered = true
    dispatch('export')
  }

  function handleSkipExport() {
    currentStep = 'final-confirmation'
    confirmationText = ''
  }

  function handleAfterExport() {
    currentStep = 'final-confirmation'
    confirmationText = ''
  }

  function handleFinalPurge() {
    if (confirmationText.trim() !== 'THE PURGE') {
      return
    }
    dispatch('purge', { skipExport: !exportOffered })
  }

  function resetModal() {
    currentStep = 'confirm'
    confirmationText = ''
    exportOffered = false
    purging = false
    progress = { step: '', current: 0, total: 0 }
    result = null
  }

  export function setProgress(p: { step: string; current: number; total: number }) {
    purging = true
    currentStep = 'purging'
    progress = p
  }

  export function setComplete(r: { deletedRecords: number; clearedStores: number }) {
    purging = false
    currentStep = 'complete'
    result = r
  }

  function handleCompleteClose() {
    // Reload the page after successful purge
    window.location.reload()
  }
</script>

{#if isOpen}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    role="dialog"
    aria-modal="true"
    aria-labelledby="purge-modal-title"
  >
    <div class="w-full max-w-2xl rounded-xl border border-rose-800 bg-slate-900 shadow-2xl">
      <!-- Header -->
      <header class="border-b border-rose-800 bg-rose-950/40 px-6 py-4">
        <h2 id="purge-modal-title" class="text-xl font-bold text-rose-100">
          {#if currentStep === 'confirm'}
            ⚠️ Permanent Data Deletion
          {:else if currentStep === 'offer-export'}
            💾 Export Your Data First?
          {:else if currentStep === 'final-confirmation'}
            🔥 Final Confirmation Required
          {:else if currentStep === 'purging'}
            🗑️ Purging Data...
          {:else if currentStep === 'complete'}
            ✅ Data Purged Successfully
          {/if}
        </h2>
      </header>

      <!-- Body -->
      <div class="space-y-6 px-6 py-6">
        {#if currentStep === 'confirm'}
          <div class="space-y-4">
            <div class="rounded-lg border border-rose-700 bg-rose-900/30 p-4">
              <p class="text-sm font-semibold text-rose-200">
                ⚠️ WARNING: This action is PERMANENT and IRREVERSIBLE
              </p>
            </div>

            <div class="text-sm text-slate-300">
              <p class="mb-4">You are about to permanently delete ALL data from the application:</p>
              <ul class="ml-6 list-disc space-y-1">
                <li><strong>{statistics.clients || 0}</strong> Clients</li>
                <li><strong>{statistics.jobs || 0}</strong> Jobs</li>
                <li><strong>{statistics.timelogs || 0}</strong> Time Logs</li>
                <li><strong>{statistics.invoices || 0}</strong> Invoices</li>
                <li><strong>{statistics.payments || 0}</strong> Payments</li>
                <li><strong>{statistics.deals || 0}</strong> Deals</li>
                <li><strong>{statistics.activities || 0}</strong> Activities</li>
                <li><strong>{statistics.expenses || 0}</strong> Expenses</li>
                <li class="font-semibold text-rose-300">...and ALL other records</li>
              </ul>
              <p class="mt-4 font-semibold">
                Total: <span class="text-rose-300">{totalRecords} records</span> will be permanently deleted.
              </p>
            </div>

            <div class="rounded-lg border border-amber-700 bg-amber-900/30 p-4">
              <p class="text-sm text-amber-200">
                <strong>Note:</strong> This includes archived data. Once deleted, recovery is impossible.
              </p>
            </div>

            <p class="text-sm text-slate-400">
              This will also clear all localStorage and sessionStorage data related to the application.
            </p>
          </div>
        {:else if currentStep === 'offer-export'}
          <div class="space-y-4">
            <div class="rounded-lg border border-blue-700 bg-blue-900/30 p-4">
              <p class="text-sm font-semibold text-blue-200">
                💡 We recommend exporting your data before purging
              </p>
            </div>

            <p class="text-sm text-slate-300">
              Would you like to download a complete backup of all your data before proceeding with the purge?
            </p>

            <ul class="ml-6 list-disc space-y-1 text-sm text-slate-400">
              <li>Backup will be saved as a JSON file</li>
              <li>Can be imported later to restore your data</li>
              <li>Includes all records, settings, and relationships</li>
              <li>Takes only a few seconds</li>
            </ul>

            <div class="rounded-lg border border-amber-700 bg-amber-900/30 p-4">
              <p class="text-sm text-amber-200">
                <strong>Last chance:</strong> After this step, you won't be able to export the data.
              </p>
            </div>
          </div>
        {:else if currentStep === 'final-confirmation'}
          <div class="space-y-4">
            <div class="rounded-lg border border-rose-700 bg-rose-900/30 p-4">
              <p class="text-sm font-semibold text-rose-200">
                🔥 THIS IS YOUR FINAL WARNING
              </p>
            </div>

            <p class="text-sm text-slate-300">
              To confirm the permanent deletion of all {totalRecords} records, type the following phrase exactly:
            </p>

            <div class="rounded-lg border border-slate-700 bg-slate-800/50 p-4 text-center">
              <code class="text-lg font-bold text-rose-300">THE PURGE</code>
            </div>

            <input
              type="text"
              bind:value={confirmationText}
              placeholder="Type 'THE PURGE' to confirm"
              class="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/50"
              autocomplete="off"
            />

            {#if confirmationText && confirmationText.trim() !== 'THE PURGE'}
              <p class="text-sm text-rose-400">
                ❌ Text doesn't match. Please type exactly: THE PURGE
              </p>
            {/if}
          </div>
        {:else if currentStep === 'purging'}
          <div class="space-y-4">
            <div class="text-center">
              <div class="mb-4 inline-block h-16 w-16 animate-spin rounded-full border-4 border-rose-800 border-t-rose-400"></div>
              <p class="text-sm font-semibold text-slate-200">{progress.step}</p>
              {#if progress.total > 0}
                <p class="text-sm text-slate-400">
                  {progress.current} / {progress.total}
                </p>
              {/if}
            </div>

            <div class="h-2 overflow-hidden rounded-full bg-slate-800">
              <div
                class="h-full bg-rose-500 transition-all duration-300"
                style="width: {progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%"
              ></div>
            </div>

            <p class="text-center text-xs text-slate-500">
              Please wait while all data is being permanently deleted...
            </p>
          </div>
        {:else if currentStep === 'complete' && result}
          <div class="space-y-4">
            <div class="rounded-lg border border-green-700 bg-green-900/30 p-4 text-center">
              <p class="text-lg font-bold text-green-200">✅ Data Purge Complete</p>
            </div>

            <div class="space-y-2 text-sm text-slate-300">
              <p>
                <strong>Records deleted:</strong> {result.deletedRecords}
              </p>
              <p>
                <strong>Stores cleared:</strong> {result.clearedStores}
              </p>
            </div>

            <div class="rounded-lg border border-blue-700 bg-blue-900/30 p-4">
              <p class="text-sm text-blue-200">
                The page will reload automatically to complete the reset.
              </p>
            </div>
          </div>
        {/if}
      </div>

      <!-- Footer -->
      <footer class="border-t border-slate-800 bg-slate-950/50 px-6 py-4">
        <div class="flex justify-end gap-3">
          {#if currentStep === 'confirm'}
            <button
              type="button"
              class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              on:click={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-lg border border-rose-700 bg-rose-900 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-800"
              on:click={handleFirstConfirm}
            >
              Continue
            </button>
          {:else if currentStep === 'offer-export'}
            <button
              type="button"
              class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              on:click={handleSkipExport}
            >
              Skip Export
            </button>
            <button
              type="button"
              class="rounded-lg border border-blue-700 bg-blue-900 px-4 py-2 text-sm font-semibold text-blue-100 hover:bg-blue-800"
              on:click={handleExportData}
            >
              Export Data First
            </button>
          {:else if currentStep === 'final-confirmation'}
            <button
              type="button"
              class="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-700"
              on:click={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              class="rounded-lg border border-rose-700 bg-rose-900 px-4 py-2 text-sm font-semibold text-rose-100 hover:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed"
              on:click={handleFinalPurge}
              disabled={confirmationText.trim() !== 'THE PURGE'}
            >
              Purge All Data
            </button>
          {:else if currentStep === 'purging'}
            <p class="text-sm text-slate-400">Purging in progress...</p>
          {:else if currentStep === 'complete'}
            <button
              type="button"
              class="rounded-lg border border-green-700 bg-green-900 px-4 py-2 text-sm font-semibold text-green-100 hover:bg-green-800"
              on:click={handleCompleteClose}
            >
              Close & Reload
            </button>
          {/if}
        </div>
      </footer>
    </div>
  </div>
{/if}

<style>
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
