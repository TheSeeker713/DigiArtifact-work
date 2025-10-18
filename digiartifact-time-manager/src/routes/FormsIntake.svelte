<script lang="ts">
  import { clientsRepo } from '../lib/repos/clientsRepo'
  import { contactsRepo } from '../lib/repos/contactsRepo'
  import { dealsRepo } from '../lib/repos/dealsRepo'
  import { activitiesRepo } from '../lib/repos/activitiesRepo'
  import { formSubmissionsRepo } from '../lib/repos/formSubmissionsRepo'
  import { toastError } from '../lib/stores/toastStore'

  let submitting = false
  let submitted = false

  type IntakeForm = {
    name: string
    email: string
    company: string
    budgetRange: string
    projectType: string
    timeline: string
    message: string
    consent: boolean
  }

  let form: IntakeForm = {
    name: '',
    email: '',
    company: '',
    budgetRange: '',
    projectType: '',
    timeline: '',
    message: '',
    consent: false,
  }

  const budgetRanges = [
    'Under $1,000',
    '$1,000 - $5,000',
    '$5,000 - $10,000',
    '$10,000 - $25,000',
    '$25,000 - $50,000',
    '$50,000+',
    'Not sure yet',
  ]

  const projectTypes = [
    'Video Editing',
    'Motion Graphics',
    'Color Grading',
    'Sound Design',
    'Full Production',
    'Consulting',
    'Training',
    'Other',
  ]

  const timelines = [
    'ASAP',
    '1-2 weeks',
    '1 month',
    '2-3 months',
    '3+ months',
    'Flexible',
  ]

  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  async function handleSubmit(event: Event) {
    event.preventDefault()

    if (!form.name.trim()) {
      toastError('Name is required.')
      return
    }

    if (!validateEmail(form.email)) {
      toastError('Valid email is required.')
      return
    }

    if (!form.company.trim()) {
      toastError('Company is required.')
      return
    }

    if (!form.consent) {
      toastError('You must consent to data storage.')
      return
    }

    submitting = true
    try {
      const todayIso = new Date().toISOString().slice(0, 10)

      // 1. Create client
      const client = await clientsRepo.create({
        name: form.company.trim(),
        billingEmail: form.email.trim(),
        status: 'prospect',
        tags: ['website-intake'],
        notes: `Budget: ${form.budgetRange || 'Not specified'}\nTimeline: ${form.timeline || 'Not specified'}\nProject: ${form.projectType || 'Not specified'}\n\n${form.message}`,
      } as any)

      // 2. Create contact
      const contact = await contactsRepo.create({
        clientId: client.id,
        name: form.name.trim(),
        email: form.email.trim(),
        title: 'Primary Contact',
      } as any)

      // 3. Parse budget for deal value estimate
      let valueEstimate = 0
      const budgetMap: Record<string, number> = {
        'Under $1,000': 500,
        '$1,000 - $5,000': 3000,
        '$5,000 - $10,000': 7500,
        '$10,000 - $25,000': 17500,
        '$25,000 - $50,000': 37500,
        '$50,000+': 75000,
        'Not sure yet': 5000,
      }
      valueEstimate = budgetMap[form.budgetRange] ?? 0

      // 4. Create deal
      const deal = await dealsRepo.create({
        clientId: client.id,
        title: `${form.projectType || 'Project'} - ${form.company}`,
        stage: 'Lead',
        valueEstimate,
        probability: 0.1,
        jobType: form.projectType || undefined,
        tags: ['website-intake'],
        stageChangedAt: todayIso,
      } as any)

      // 5. Create activity
      await activitiesRepo.create({
        clientId: client.id,
        contactId: contact.id,
        dealId: deal.id,
        type: 'Website Intake',
        date: todayIso,
        summary: `Form submitted: ${form.name} from ${form.company}. Budget: ${form.budgetRange}. Timeline: ${form.timeline}. Message: ${form.message.slice(0, 100)}${form.message.length > 100 ? '...' : ''}`,
        nextActionDate: todayIso,
      } as any)

      // 6. Store raw form submission
      await formSubmissionsRepo.create({
        source: 'website-intake',
        payload: {
          name: form.name,
          email: form.email,
          company: form.company,
          budgetRange: form.budgetRange,
          projectType: form.projectType,
          timeline: form.timeline,
          message: form.message,
        },
        createdDate: todayIso,
        consent: form.consent,
      } as any)

      submitted = true
    } catch (error) {
      console.error(error)
      toastError('Unable to submit form. Please try again.')
    } finally {
      submitting = false
    }
  }

  function resetForm() {
    form = {
      name: '',
      email: '',
      company: '',
      budgetRange: '',
      projectType: '',
      timeline: '',
      message: '',
      consent: false,
    }
    submitted = false
  }
</script>

{#if !submitted}
  <section class="mx-auto max-w-3xl space-y-6 px-4 py-8">
    <header class="text-center">
      <h1 class="text-3xl font-bold text-brand-primary">Let's Work Together</h1>
      <p class="mt-2 text-slate-400">
        Tell us about your project and we'll get back to you within 24 hours.
      </p>
    </header>

    <form class="space-y-6 rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-sm text-slate-200" on:submit={handleSubmit}>
      <div class="grid gap-6 md:grid-cols-2">
        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span class="font-semibold">
            Your Name <span class="text-red-400">*</span>
          </span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            placeholder="John Doe"
            bind:value={form.name}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span class="font-semibold">
            Email Address <span class="text-red-400">*</span>
          </span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            type="email"
            placeholder="john@example.com"
            bind:value={form.email}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span class="font-semibold">
            Company Name <span class="text-red-400">*</span>
          </span>
          <input
            class="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            placeholder="Acme Inc"
            bind:value={form.company}
            required
          />
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span class="font-semibold">Budget Range</span>
          <select
            class="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            bind:value={form.budgetRange}
          >
            <option value="">Select budget range</option>
            {#each budgetRanges as range}
              <option value={range}>{range}</option>
            {/each}
          </select>
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span class="font-semibold">Project Type</span>
          <select
            class="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            bind:value={form.projectType}
          >
            <option value="">Select project type</option>
            {#each projectTypes as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </label>

        <label class="flex flex-col gap-2 text-sm text-slate-300">
          <span class="font-semibold">Timeline</span>
          <select
            class="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
            bind:value={form.timeline}
          >
            <option value="">Select timeline</option>
            {#each timelines as timeline}
              <option value={timeline}>{timeline}</option>
            {/each}
          </select>
        </label>
      </div>

      <label class="flex flex-col gap-2 text-sm text-slate-300">
        <span class="font-semibold">Project Details</span>
        <textarea
          class="rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
          rows="6"
          placeholder="Tell us about your project, goals, and any specific requirements..."
          bind:value={form.message}
        ></textarea>
      </label>

      <label class="flex items-start gap-3 text-sm text-slate-300">
        <input
          class="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-950 text-brand-primary focus:ring-2 focus:ring-brand-primary"
          type="checkbox"
          bind:checked={form.consent}
          required
        />
        <span>
          I consent to having this website store my submitted information so they can respond to my inquiry. 
          <span class="text-red-400">*</span>
        </span>
      </label>

      <div class="flex flex-wrap gap-4 pt-4">
        <button
          type="submit"
          class="flex-1 rounded-lg bg-brand-primary px-6 py-3 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-brand-primary/90 disabled:opacity-60 sm:flex-none"
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit Inquiry'}
        </button>
        <button
          type="button"
          class="rounded-lg border border-slate-700 px-6 py-3 text-base font-semibold text-slate-200 transition hover:bg-slate-800"
          on:click={resetForm}
          disabled={submitting}
        >
          Clear Form
        </button>
      </div>
    </form>

    <footer class="text-center text-xs text-slate-500">
      <p>All data is stored locally and securely. We respect your privacy.</p>
    </footer>
  </section>
{:else}
  <section class="mx-auto max-w-2xl space-y-6 px-4 py-12 text-center">
    <div class="rounded-full bg-green-500/10 p-6 mx-auto w-24 h-24 flex items-center justify-center">
      <svg class="h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
      </svg>
    </div>

    <header>
      <h1 class="text-3xl font-bold text-slate-100">Thank You!</h1>
      <p class="mt-3 text-lg text-slate-300">
        Your inquiry has been submitted successfully.
      </p>
    </header>

    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-8 text-left">
      <h2 class="text-xl font-semibold text-slate-100">What Happens Next?</h2>
      <ul class="mt-4 space-y-3 text-slate-300">
        <li class="flex items-start gap-3">
          <span class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-primary">
            1
          </span>
          <span>
            <strong class="text-slate-100">We'll review your inquiry</strong> within 24 hours and assess 
            how we can best help with your project.
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-primary">
            2
          </span>
          <span>
            <strong class="text-slate-100">Expect a response via email</strong> with next steps, 
            questions, or a meeting invite to discuss your needs.
          </span>
        </li>
        <li class="flex items-start gap-3">
          <span class="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-primary/20 text-xs font-bold text-brand-primary">
            3
          </span>
          <span>
            <strong class="text-slate-100">We'll create a proposal</strong> tailored to your budget, 
            timeline, and project requirements.
          </span>
        </li>
      </ul>
    </article>

    <article class="rounded-xl border border-slate-800 bg-slate-900/70 p-6">
      <h3 class="font-semibold text-slate-100">Your Contact Information</h3>
      <dl class="mt-4 grid gap-3 text-left text-sm">
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <dt class="text-slate-400">Name:</dt>
          <dd class="font-semibold text-slate-100">{form.name}</dd>
        </div>
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <dt class="text-slate-400">Email:</dt>
          <dd class="font-semibold text-slate-100">{form.email}</dd>
        </div>
        <div class="flex justify-between border-b border-slate-800 pb-2">
          <dt class="text-slate-400">Company:</dt>
          <dd class="font-semibold text-slate-100">{form.company}</dd>
        </div>
        {#if form.budgetRange}
          <div class="flex justify-between border-b border-slate-800 pb-2">
            <dt class="text-slate-400">Budget:</dt>
            <dd class="font-semibold text-slate-100">{form.budgetRange}</dd>
          </div>
        {/if}
        {#if form.timeline}
          <div class="flex justify-between border-b border-slate-800 pb-2">
            <dt class="text-slate-400">Timeline:</dt>
            <dd class="font-semibold text-slate-100">{form.timeline}</dd>
          </div>
        {/if}
      </dl>
    </article>

    <div class="flex flex-wrap justify-center gap-4 pt-4">
      <button
        type="button"
        class="rounded-lg bg-brand-primary px-6 py-3 text-base font-semibold text-slate-900 shadow-lg transition hover:bg-brand-primary/90"
        on:click={resetForm}
      >
        Submit Another Inquiry
      </button>
    </div>

    <footer class="text-xs text-slate-500">
      <p>Questions? Email us at <a href="mailto:hello@example.com" class="text-brand-primary hover:underline">hello@example.com</a></p>
    </footer>
  </section>
{/if}
