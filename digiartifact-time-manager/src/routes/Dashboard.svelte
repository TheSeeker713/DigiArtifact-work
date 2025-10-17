<script lang="ts">
  export let targets = { total: 60, freelancing: 20, content: 20, digital: 20 };
</script>

<section class="space-y-4">
  <header>
    <h2 class="text-2xl font-semibold text-brand-primary">Weekly Overview</h2>
    <p class="text-sm text-slate-400">
      Track logged hours against the 60/20/20 plan without needing a network connection.
    </p>
  </header>

  <article class="grid gap-4 md:grid-cols-2">
    <div class="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="text-lg font-medium text-slate-100">Time Targets</h3>
      <ul class="mt-2 space-y-1 text-sm text-slate-300">
        <li>Total weekly target: {targets.total} hrs</li>
        <li>Freelancing: {targets.freelancing} hrs</li>
        <li>Content: {targets.content} hrs</li>
        <li>Digital products: {targets.digital} hrs</li>
      </ul>
    </div>
    <div class="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
      <h3 class="text-lg font-medium text-slate-100">Offline Status</h3>
      <p class="mt-2 text-sm text-slate-300">
        IndexedDB persistence keeps recent sessions available even when GitHub is unreachable or the
        network drops.
      </p>
    </div>
  </article>
</section>
