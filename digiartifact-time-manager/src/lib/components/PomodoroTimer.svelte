<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import type { PomodoroSettings } from '../types/entities'

  // Default Pomodoro settings
  let settings: PomodoroSettings = {
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartPomodoros: false,
    soundEnabled: true, // for future
  }

  let isRunning = false
  let isPaused = false
  let currentType: 'work' | 'short_break' | 'long_break' = 'work'
  let pomodoroCount = 0
  let timeRemaining = settings.workDuration * 60 // seconds
  let intervalId: number | null = null

  // Calculate progress percentage
  $: totalDuration = getCurrentDuration() * 60
  $: progress = ((totalDuration - timeRemaining) / totalDuration) * 100

  function getCurrentDuration(): number {
    if (currentType === 'work') return settings.workDuration
    if (currentType === 'short_break') return settings.shortBreakDuration
    return settings.longBreakDuration
  }

  function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  function tick() {
    if (timeRemaining > 0) {
      timeRemaining--
    } else {
      // Timer completed
      handleComplete()
    }
  }

  function handleComplete() {
    console.log('[Pomodoro] Timer completed:', currentType)
    
    if (currentType === 'work') {
      pomodoroCount++
      
      // Determine next break type
      if (pomodoroCount % settings.longBreakInterval === 0) {
        startBreak('long_break')
      } else {
        startBreak('short_break')
      }
    } else {
      // Break completed, optionally auto-start work
      if (settings.autoStartPomodoros) {
        startWork()
      } else {
        stop()
      }
    }
  }

  function start() {
    isRunning = true
    isPaused = false
    if (intervalId === null) {
      intervalId = window.setInterval(tick, 1000)
    }
    console.log('[Pomodoro] Started')
  }

  function pause() {
    isPaused = true
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    console.log('[Pomodoro] Paused')
  }

  function stop() {
    isRunning = false
    isPaused = false
    if (intervalId !== null) {
      clearInterval(intervalId)
      intervalId = null
    }
    console.log('[Pomodoro] Stopped')
  }

  function reset() {
    stop()
    currentType = 'work'
    pomodoroCount = 0
    timeRemaining = settings.workDuration * 60
    console.log('[Pomodoro] Reset')
  }

  function startWork() {
    currentType = 'work'
    timeRemaining = settings.workDuration * 60
    if (settings.autoStartPomodoros || isRunning) {
      start()
    } else {
      stop()
    }
  }

  function startBreak(type: 'short_break' | 'long_break') {
    currentType = type
    timeRemaining = type === 'short_break' 
      ? settings.shortBreakDuration * 60 
      : settings.longBreakDuration * 60
    
    if (settings.autoStartBreaks) {
      start()
    } else {
      stop()
    }
  }

  function skipToBreak() {
    if (currentType === 'work') {
      pomodoroCount++
      if (pomodoroCount % settings.longBreakInterval === 0) {
        startBreak('long_break')
      } else {
        startBreak('short_break')
      }
    }
  }

  function skipToWork() {
    startWork()
  }

  onMount(() => {
    console.log('[Pomodoro] Component mounted')
  })

  onDestroy(() => {
    if (intervalId !== null) {
      clearInterval(intervalId)
    }
  })
</script>

<article class="rounded-xl border border-slate-800 bg-slate-900/70 p-5 space-y-4">
  <header class="flex items-center justify-between">
    <h3 class="text-lg font-semibold text-slate-100">Pomodoro Timer</h3>
    <span class="text-xs text-slate-400">
      {#if currentType === 'work'}
        🍅 Session {pomodoroCount + 1}
      {:else if currentType === 'short_break'}
        ☕ Short Break
      {:else}
        🎉 Long Break
      {/if}
    </span>
  </header>

  <div class="space-y-4">
    <!-- Circular Progress -->
    <div class="relative flex items-center justify-center">
      <svg class="w-48 h-48 transform -rotate-90">
        <!-- Background circle -->
        <circle
          cx="96"
          cy="96"
          r="88"
          stroke="currentColor"
          stroke-width="8"
          fill="none"
          class="text-slate-700"
        />
        <!-- Progress circle -->
        <circle
          cx="96"
          cy="96"
          r="88"
          stroke="currentColor"
          stroke-width="8"
          fill="none"
          stroke-linecap="round"
          class={currentType === 'work' ? 'text-rose-500' : 'text-emerald-500'}
          style="stroke-dasharray: {2 * Math.PI * 88}; stroke-dashoffset: {2 * Math.PI * 88 * (1 - progress / 100)}; transition: stroke-dashoffset 0.5s linear;"
        />
      </svg>
      
      <!-- Time display -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <p class="font-mono text-5xl font-bold text-slate-50">
          {formatTime(timeRemaining)}
        </p>
        <p class="text-sm text-slate-400 mt-2">
          {currentType === 'work' ? 'Focus Time' : 'Break Time'}
        </p>
      </div>
    </div>

    <!-- Controls -->
    <div class="grid grid-cols-2 gap-3">
      {#if !isRunning || isPaused}
        <button
          on:click={start}
          class="rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 transition-colors"
        >
          {isPaused ? 'Resume' : 'Start'}
        </button>
      {:else}
        <button
          on:click={pause}
          class="rounded-lg bg-amber-600 px-4 py-3 font-semibold text-white hover:bg-amber-700 transition-colors"
        >
          Pause
        </button>
      {/if}
      
      <button
        on:click={reset}
        class="rounded-lg bg-slate-700 px-4 py-3 font-semibold text-white hover:bg-slate-600 transition-colors"
      >
        Reset
      </button>
    </div>

    <!-- Skip buttons -->
    <div class="flex gap-2 text-xs">
      {#if currentType === 'work'}
        <button
          on:click={skipToBreak}
          class="flex-1 rounded-md bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Skip to Break
        </button>
      {:else}
        <button
          on:click={skipToWork}
          class="flex-1 rounded-md bg-slate-800 px-3 py-2 text-slate-300 hover:bg-slate-700 transition-colors"
        >
          Skip to Work
        </button>
      {/if}
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-3 gap-3 text-sm pt-2 border-t border-slate-800">
      <div class="text-center space-y-1">
        <p class="text-xs text-slate-400">Completed</p>
        <p class="font-bold text-slate-200">{pomodoroCount}</p>
      </div>
      <div class="text-center space-y-1">
        <p class="text-xs text-slate-400">Work</p>
        <p class="font-bold text-slate-200">{settings.workDuration}m</p>
      </div>
      <div class="text-center space-y-1">
        <p class="text-xs text-slate-400">Break</p>
        <p class="font-bold text-slate-200">{settings.shortBreakDuration}m</p>
      </div>
    </div>

    <!-- Settings toggle (simple version) -->
    <details class="text-xs">
      <summary class="text-slate-400 cursor-pointer hover:text-slate-300">
        Pomodoro Settings
      </summary>
      <div class="mt-3 space-y-3 p-3 bg-slate-800/50 rounded-lg">
        <label class="flex items-center justify-between">
          <span class="text-slate-300">Auto-start breaks</span>
          <input
            type="checkbox"
            bind:checked={settings.autoStartBreaks}
            class="rounded"
          />
        </label>
        <label class="flex items-center justify-between">
          <span class="text-slate-300">Auto-start pomodoros</span>
          <input
            type="checkbox"
            bind:checked={settings.autoStartPomodoros}
            class="rounded"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-slate-300">Work duration (minutes)</span>
          <input
            type="number"
            min="1"
            max="60"
            bind:value={settings.workDuration}
            on:change={() => { if (currentType === 'work' && !isRunning) timeRemaining = settings.workDuration * 60 }}
            class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-slate-300">Short break (minutes)</span>
          <input
            type="number"
            min="1"
            max="30"
            bind:value={settings.shortBreakDuration}
            class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </label>
        <label class="flex flex-col gap-1">
          <span class="text-slate-300">Long break (minutes)</span>
          <input
            type="number"
            min="1"
            max="60"
            bind:value={settings.longBreakDuration}
            class="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-200"
          />
        </label>
      </div>
    </details>
  </div>
</article>
