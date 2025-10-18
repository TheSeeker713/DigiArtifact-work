<script lang="ts" generics="T">
  /**
   * VirtualList: renders only visible rows for performance on large datasets.
   * Inspired by svelte-virtual-list patterns.
   */
  export let items: T[] = []
  export let itemHeight = 40
  export let maxVisibleItems = 100

  let containerEl: HTMLDivElement
  let scrollTop = 0

  $: visibleCount = Math.min(items.length, maxVisibleItems)
  $: start = Math.floor(scrollTop / itemHeight)
  $: end = Math.min(start + visibleCount, items.length)
  $: paddingTop = start * itemHeight
  $: paddingBottom = (items.length - end) * itemHeight
  $: visibleItems = items.slice(start, end)

  function handleScroll() {
    if (containerEl) {
      scrollTop = containerEl.scrollTop
    }
  }
</script>

<div class="overflow-auto" style="max-height: {itemHeight * visibleCount}px;" bind:this={containerEl} on:scroll={handleScroll}>
  <div style="padding-top: {paddingTop}px; padding-bottom: {paddingBottom}px;">
    {#each visibleItems as item, index (start + index)}
      <div style="height: {itemHeight}px;">
        <slot {item} index={start + index} />
      </div>
    {/each}
  </div>
</div>
