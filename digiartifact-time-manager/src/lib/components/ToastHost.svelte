<script lang="ts">
  import { fade, fly, scale } from 'svelte/transition'

  import { toastStore, dismissToast, type Toast } from '../stores/toastStore'

  const toneClasses: Record<Toast['tone'], string> = {
    info: 'border-slate-700 bg-slate-900/90 text-slate-50',
    success: 'border-emerald-500/60 bg-emerald-900/50 text-emerald-200',
    warning: 'border-amber-500/60 bg-amber-900/40 text-amber-100',
    error: 'border-rose-500/60 bg-rose-900/50 text-rose-100',
  }
</script>

<div class="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 px-4 pb-6 sm:items-end sm:px-6">
  {#each $toastStore as toast (toast.id)}
    <div class="w-full max-w-sm" in:fly={{ y: 16, duration: 150 }} out:fade={{ duration: 120 }}>
      <article
        class={`pointer-events-auto w-full rounded-xl border px-4 py-3 shadow-lg backdrop-blur transition ${toneClasses[toast.tone]}`}
        role="status"
        aria-live="polite"
        transition:scale={{ duration: 120 }}
      >
        <div class="flex items-start gap-3">
          <div class="flex-1 text-sm">{toast.message}</div>
          <button
            type="button"
            class="text-xs font-semibold uppercase tracking-wide text-slate-300 hover:text-slate-50"
            on:click={() => dismissToast(toast.id)}
          >
            Close
          </button>
        </div>
      </article>
    </div>
  {/each}
</div>
