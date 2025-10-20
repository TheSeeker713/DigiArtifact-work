<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { onboardingStore, onboardingSteps } from '../stores/onboardingStore'
  
  $: state = $onboardingStore
  $: currentStep = onboardingSteps[state.currentStepIndex]
  $: isFirstStep = state.currentStepIndex === 0
  $: isLastStep = state.currentStepIndex === onboardingSteps.length - 1
  $: progress = ((state.currentStepIndex + 1) / onboardingSteps.length) * 100
  
  let targetElement: HTMLElement | null = null
  let highlightRect = { top: 0, left: 0, width: 0, height: 0 }
  let tooltipPosition = { top: 0, left: 0 }
  
  function updateHighlight() {
    if (!currentStep?.target) {
      targetElement = null
      return
    }
    
    targetElement = document.querySelector(currentStep.target)
    if (!targetElement) {
      console.warn('[Onboarding] Target not found:', currentStep.target)
      return
    }
    
    const rect = targetElement.getBoundingClientRect()
    highlightRect = {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height,
    }
    
    // Calculate tooltip position based on preferred position
    calculateTooltipPosition(rect)
    
    // Scroll element into view
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  
  function calculateTooltipPosition(rect: DOMRect) {
    const tooltipWidth = 400
    const tooltipHeight = 250
    const padding = 20
    
    switch (currentStep.position) {
      case 'top':
        tooltipPosition = {
          top: rect.top + window.scrollY - tooltipHeight - padding,
          left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
        }
        break
      case 'bottom':
        tooltipPosition = {
          top: rect.top + window.scrollY + rect.height + padding,
          left: rect.left + window.scrollX + rect.width / 2 - tooltipWidth / 2,
        }
        break
      case 'left':
        tooltipPosition = {
          top: rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2,
          left: rect.left + window.scrollX - tooltipWidth - padding,
        }
        break
      case 'right':
        tooltipPosition = {
          top: rect.top + window.scrollY + rect.height / 2 - tooltipHeight / 2,
          left: rect.left + window.scrollX + rect.width + padding,
        }
        break
      case 'center':
      default:
        tooltipPosition = {
          top: window.innerHeight / 2 - tooltipHeight / 2 + window.scrollY,
          left: window.innerWidth / 2 - tooltipWidth / 2,
        }
        break
    }
  }
  
  function handleNext() {
    if (isLastStep) {
      onboardingStore.complete()
    } else {
      onboardingStore.next()
    }
  }
  
  function handlePrev() {
    onboardingStore.prev()
  }
  
  function handleSkip() {
    onboardingStore.skip()
  }
  
  function handleToggleDontShow() {
    onboardingStore.toggleDontShowAgain()
  }
  
  function handleKeyDown(event: KeyboardEvent) {
    if (!state.active) return
    
    if (event.key === 'Escape') {
      handleSkip()
    } else if (event.key === 'ArrowRight') {
      handleNext()
    } else if (event.key === 'ArrowLeft' && !isFirstStep) {
      handlePrev()
    }
  }
  
  $: if (state.active) {
    updateHighlight()
  }
  
  onMount(() => {
    window.addEventListener('resize', updateHighlight)
    window.addEventListener('keydown', handleKeyDown)
  })
  
  onDestroy(() => {
    window.removeEventListener('resize', updateHighlight)
    window.removeEventListener('keydown', handleKeyDown)
  })
</script>

{#if state.active}
  <!-- Dark overlay -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div class="onboarding-overlay" on:click={handleSkip}>
    <!-- Highlight cutout (SVG) -->
    {#if targetElement}
      <svg class="onboarding-highlight" style="pointer-events: none;">
        <defs>
          <mask id="highlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={highlightRect.left - 8}
              y={highlightRect.top - 8}
              width={highlightRect.width + 16}
              height={highlightRect.height + 16}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.7)"
          mask="url(#highlight-mask)"
        />
        <!-- Pulsing border around target -->
        <rect
          x={highlightRect.left - 8}
          y={highlightRect.top - 8}
          width={highlightRect.width + 16}
          height={highlightRect.height + 16}
          rx="8"
          fill="none"
          stroke="#3b82f6"
          stroke-width="3"
          class="pulse-border"
        />
      </svg>
    {:else}
      <!-- Full overlay for center-positioned steps -->
      <div class="onboarding-full-overlay"></div>
    {/if}
  </div>
  
  <!-- Tooltip card -->
  <!-- svelte-ignore a11y-click-events-have-key-events -->
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="onboarding-tooltip"
    style="top: {tooltipPosition.top}px; left: {tooltipPosition.left}px;"
    on:click|stopPropagation
  >
    <!-- Progress bar -->
    <div class="progress-bar">
      <div class="progress-fill" style="width: {progress}%"></div>
    </div>
    
    <!-- Content -->
    <div class="tooltip-content">
      <div class="step-indicator">
        Step {state.currentStepIndex + 1} of {onboardingSteps.length}
      </div>
      
      <h2 class="tooltip-title">{currentStep.title}</h2>
      <p class="tooltip-description">{currentStep.description}</p>
    </div>
    
    <!-- Footer controls -->
    <div class="tooltip-footer">
      <label class="dont-show-checkbox">
        <input
          type="checkbox"
          checked={state.dontShowAgain}
          on:change={handleToggleDontShow}
        />
        <span>Don't show again</span>
      </label>
      
      <div class="button-group">
        <button class="btn-skip" on:click={handleSkip}>
          Skip Tour
        </button>
        
        {#if !isFirstStep}
          <button class="btn-prev" on:click={handlePrev}>
            ← Previous
          </button>
        {/if}
        
        <button class="btn-next" on:click={handleNext}>
          {isLastStep ? 'Get Started' : 'Next →'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .onboarding-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 9998;
    pointer-events: auto;
  }
  
  .onboarding-full-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
  }
  
  .onboarding-highlight {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .pulse-border {
    animation: pulse 2s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
      stroke-width: 3;
    }
    50% {
      opacity: 0.5;
      stroke-width: 5;
    }
  }
  
  .onboarding-tooltip {
    position: absolute;
    width: 400px;
    max-width: 90vw;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    pointer-events: auto;
    overflow: hidden;
  }
  
  .progress-bar {
    height: 4px;
    background: #e5e7eb;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #06b6d4);
    transition: width 0.3s ease;
  }
  
  .tooltip-content {
    padding: 24px;
  }
  
  .step-indicator {
    font-size: 12px;
    font-weight: 600;
    color: #3b82f6;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  
  .tooltip-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 12px 0;
  }
  
  .tooltip-description {
    font-size: 14px;
    line-height: 1.6;
    color: #475569;
    margin: 0;
  }
  
  .tooltip-footer {
    padding: 16px 24px;
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  
  .dont-show-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #64748b;
    cursor: pointer;
    user-select: none;
  }
  
  .dont-show-checkbox input[type="checkbox"] {
    width: 16px;
    height: 16px;
    cursor: pointer;
  }
  
  .button-group {
    display: flex;
    gap: 8px;
  }
  
  .btn-skip,
  .btn-prev,
  .btn-next {
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    outline: none;
  }
  
  .btn-skip {
    background: transparent;
    color: #64748b;
  }
  
  .btn-skip:hover {
    color: #475569;
    background: #e2e8f0;
  }
  
  .btn-prev {
    background: #e2e8f0;
    color: #475569;
  }
  
  .btn-prev:hover {
    background: #cbd5e1;
  }
  
  .btn-next {
    background: linear-gradient(135deg, #3b82f6, #06b6d4);
    color: white;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }
  
  .btn-next:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }
  
  /* Dark theme support */
  :global(.dark) .onboarding-tooltip {
    background: #1e293b;
    color: #e2e8f0;
  }
  
  :global(.dark) .tooltip-title {
    color: #f1f5f9;
  }
  
  :global(.dark) .tooltip-description {
    color: #cbd5e1;
  }
  
  :global(.dark) .tooltip-footer {
    background: #0f172a;
    border-top-color: #334155;
  }
  
  :global(.dark) .dont-show-checkbox {
    color: #94a3b8;
  }
  
  :global(.dark) .btn-prev {
    background: #334155;
    color: #e2e8f0;
  }
  
  :global(.dark) .btn-prev:hover {
    background: #475569;
  }
  
  :global(.dark) .btn-skip:hover {
    background: #334155;
    color: #e2e8f0;
  }
</style>
