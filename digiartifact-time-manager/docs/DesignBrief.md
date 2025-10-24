# DigiArtifact Time Manager — UX Strategy & Design Brief

**Version:** 1.0  
**Last Updated:** October 24, 2025  
**Status:** Draft — Foundation Document

---

## 1. Product Vision

**{ProjectName}**: DigiArtifact Time Manager

### Elevator Pitch
DigiArtifact Time Manager is an **offline-first, background-AI time management application** designed exclusively for Windows. It helps solo developers and neurodivergent creatives track time, maintain focus, and understand their productivity patterns—without the cognitive overhead of chat interfaces or always-online requirements.

### Core Philosophy
- **Offline-first**: Works seamlessly without internet; AI processing happens locally
- **Background intelligence**: AI analyzes patterns quietly, surfaces insights proactively
- **No chat UI**: Direct manipulation and forms—no conversational interfaces
- **Windows-native**: Leverages OS-level integrations, keyboard shortcuts, and system tray
- **ND-friendly by default**: Low stimulation, predictable, calm

---

## 2. User Personas

### `{Persona_Primary}`: The Solo Developer
**Name:** Alex Chen  
**Age:** 28  
**Context:** Freelance full-stack developer, works from home, juggles 3-5 concurrent projects

**Needs:**
- Accurate time tracking across multiple projects without manual overhead
- Understanding which hours are most productive
- Preventing burnout by tracking actual vs. planned work hours
- Minimal context-switching between tools

**Pain Points:**
- Forgets to start/stop timers
- Gets distracted by complex tool UIs
- Needs to work offline during travel or internet outages
- Overwhelmed by gamification and notifications

**Success Looks Like:**
- Tracks time passively with minimal interaction
- Reviews weekly focus hours (`{KPI_WeeklyFocusHours}`) trends
- Maintains 90-day retention (`{KPI_UserRetention90d}`)

---

### `{Persona_Secondary}`: The ND Creative
**Name:** Jordan Martinez  
**Age:** 34  
**Context:** Graphic designer with ADHD, sensory sensitivities, time blindness challenges

**Needs:**
- Gentle reminders without jarring notifications
- Visual progress indicators that are calming, not stressful
- Keyboard-first navigation (mouse use can be draining)
- Predictable layouts—no surprise UI changes

**Pain Points:**
- Time blindness makes duration estimation difficult
- Notification fatigue from productivity apps
- Motion and animations trigger sensory overload
- Complex menus cause decision paralysis

**Success Looks Like:**
- Completes full focus sessions (`{KPI_SessionCompletionRate}` > 75%)
- Uses app daily during primary work hours (`{PrimaryUseHours}`: 9am–5pm)
- Feels calm and supported, not pressured

---

## 3. Jobs-to-be-Done (JTBD)

When I want to...
1. **Start tracking time** → I need a one-click action from system tray or global hotkey
2. **Focus without distractions** → I need a focus mode that blocks notifications and shows gentle progress
3. **Review my week** → I need a visual dashboard showing time distribution by project/category
4. **Understand my patterns** → I need AI insights presented clearly without overwhelming detail
5. **Plan tomorrow** → I need to see unfinished tasks and estimated time to completion
6. **Work offline** → I need full functionality without internet dependency
7. **Customize my experience** → I need accessible settings with clear explanations

---

## 4. Success Metrics (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| `{KPI_SessionCompletionRate}` | > 75% | % of focus sessions completed without manual stop |
| `{KPI_WeeklyFocusHours}` | 20–40 hrs | Average deep work hours per user per week |
| `{KPI_UserRetention90d}` | > 60% | % of users active after 90 days |
| Time-to-first-value | < 5 min | From install to first successful time entry |
| Keyboard nav coverage | 100% | All core actions accessible via keyboard |
| WCAG AA compliance | 100% | All UI elements meet contrast/size requirements |

---

## 5. Neurodivergent-Friendly (ND) Design Principles

**Policy Reference:** `{ND_Policy_URL}`

### 5.1 Visual Design
- **Low stimulation**: Muted color palette, high contrast for readability
- **Minimal motion**: Animations disabled by default; opt-in for micro-interactions
- **Clear hierarchy**: Large, readable type (16px base minimum)
- **Generous spacing**: Breathing room between interactive elements
- **Consistent iconography**: Same icon = same action across all contexts

### 5.2 Interaction Design
- **Keyboard-first**: Every action has a keyboard shortcut
- **Predictable layout**: Navigation and content areas stay in fixed positions
- **Clear focus states**: High-contrast outlines for keyboard navigation
- **Forgiving inputs**: Auto-save, undo/redo, no data loss on mistakes
- **Gentle feedback**: Subtle success states, no jarring alerts

### 5.3 Cognitive Load Reduction
- **Progressive disclosure**: Advanced features hidden until needed
- **Clear labels**: No jargon, plain language throughout
- **Empty states**: Helpful guidance, not blank screens
- **Error prevention**: Validation before destructive actions
- **Opt-in gamification**: Points/streaks available but not forced

### 5.4 Accessibility Checklist
- [ ] WCAG AA color contrast (4.5:1 for text, 3:1 for UI components)
- [ ] All interactive elements ≥ 44×44px touch target
- [ ] Full keyboard navigation with visible focus indicators
- [ ] Screen reader support (ARIA labels, semantic HTML)
- [ ] Reduced motion preference respected (Windows settings)
- [ ] Text scales to 200% without breaking layout
- [ ] No time-based UI changes (except clock)

---

## 6. Information Architecture (IA)

### 6.1 Top-Level Navigation

```
┌─────────────────────────────────────────────────────────────────────┐
│ DigiArtifact Time Manager                          [_] [□] [×]      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌─────────────┐                                                    │
│  │ PRIMARY NAV │                                                    │
│  ├─────────────┤                                                    │
│  │ Dashboard   │◄── Default view (today's summary + quick actions) │
│  │ Tasks       │    Task list, estimates, priorities                │
│  │ Focus       │    Timer, ambient sounds, distraction blocking     │
│  │ Time        │    Clock view, manual entries, calendar            │
│  │ Journal     │    Daily notes, reflections, mood tracking         │
│  │ Settings    │    Preferences, integrations, appearance           │
│  │ AI Diag.    │    AI insights, pattern analysis, diagnostics      │
│  └─────────────┘                                                    │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 6.2 Dashboard IA Map

```
Dashboard
│
├─── Today's Summary
│    ├─ Total time tracked (HH:MM)
│    ├─ Focus sessions completed
│    ├─ Current streak (days)
│    └─ Top 3 projects (time %)
│
├─── Quick Actions
│    ├─ [Start Timer] (Alt+T)
│    ├─ [Focus Mode] (Alt+F)
│    └─ [Add Manual Entry] (Alt+M)
│
├─── Active Timer Widget (if running)
│    ├─ Project name
│    ├─ Elapsed time
│    └─ [Pause] [Stop] buttons
│
├─── This Week Overview (bar chart)
│    └─ Daily focus hours (Mon–Sun)
│
└─── AI Insights Card (1-2 sentences max)
     └─ e.g., "Your peak focus is 10am–12pm. Consider blocking this time."
```

### 6.3 Focus Mode IA Map

```
Focus Mode
│
├─── Session Setup
│    ├─ Project selector (dropdown)
│    ├─ Duration (25/50/90 min presets + custom)
│    └─ Options
│        ├─ [ ] Enable ambient sounds
│        ├─ [ ] Block notifications (Windows Focus Assist)
│        └─ [ ] Auto-start break timer
│
├─── Active Session View
│    ├─ Large circular progress indicator
│    ├─ Remaining time (HH:MM:SS)
│    ├─ Project name (top)
│    ├─ [Pause] [+5 min] [Stop] (bottom)
│    └─ Optional: Ambient sound controls (volume slider)
│
├─── Break View
│    ├─ "Break time!" message
│    ├─ Break duration countdown
│    ├─ [Skip Break] [Start Next Session] buttons
│    └─ Gentle animation (if motion enabled)
│
└─── Session Complete
     ├─ Summary (time tracked, session #)
     ├─ Optional: Reflection prompt ("How focused were you? 1-5")
     └─ [Start Another] [Back to Dashboard] buttons
```

---

## 7. Core Screen Definitions

### 7.1 Dashboard
**Purpose:** At-a-glance overview of today's activity and quick access to primary actions.

**Key Elements:**
- Time summary cards
- Quick action buttons (keyboard shortcuts visible on hover)
- Active timer widget (if running)
- Weekly trend chart
- Single AI insight card (dismissible)

**Empty State:**
> "Welcome to DigiArtifact! Start tracking time by pressing **Alt+T** or clicking **Start Timer** below."

### 7.2 Tasks
**Purpose:** Manage task list with time estimates and completion tracking.

**Key Elements:**
- Filterable task list (All / Today / Week)
- Add task form (inline)
- Time estimates (optional)
- Drag-to-reorder
- Archive completed tasks

**Empty State:**
> "No tasks yet. Add your first task to start planning your time."

### 7.3 Focus
**Purpose:** Distraction-free timer with ambient sounds and Windows Focus Assist integration.

**Key Elements:**
- Session configuration panel
- Large, readable timer display
- Pause/resume controls
- Optional ambient sounds (rain, cafe, etc.)
- Break timer automation

**Empty State:**
> "Ready to focus? Choose a project and duration to begin your session."

### 7.4 Time (Clock View)
**Purpose:** Manual time entry, calendar view, and historical editing.

**Key Elements:**
- Calendar widget (week/month views)
- Manual entry form (project, start, end, notes)
- Edit/delete existing entries
- Export options (CSV)

**Empty State:**
> "No time entries for this period. Tracked time will appear here."

### 7.5 Journal
**Purpose:** Daily reflections, mood tracking, and notes.

**Key Elements:**
- Date selector
- Rich text editor (minimal formatting)
- Mood/energy level selector (1-5 scale)
- Auto-save

**Empty State:**
> "Capture your thoughts for today. What went well?"

### 7.6 Settings
**Purpose:** Configure app behavior, appearance, integrations, and accessibility.

**Sections:**
- General (startup behavior, notifications)
- Appearance (theme, font size, motion)
- Keyboard shortcuts (customizable)
- Integrations (calendar sync, export)
- Accessibility (screen reader, high contrast)
- Data & Privacy (export, backup, clear data)

### 7.7 AI Diagnostics
**Purpose:** Transparency into AI analysis, pattern insights, and suggestions.

**Key Elements:**
- Pattern cards (e.g., "Peak focus hours")
- Suggestions (e.g., "Try time-blocking Tuesdays")
- Data used for analysis (transparency)
- Toggle AI features on/off

**Empty State:**
> "Not enough data yet. AI insights appear after 7 days of tracking."

---

## 8. UX Writing Guidelines

### Tone
- **Encouraging but not pushy**: "You completed 3 focus sessions today!" (not "Keep your streak going!")
- **Clear over clever**: "Start Timer" (not "Begin Your Journey")
- **Supportive**: Assume users are doing their best; never blame or shame

### Voice Characteristics
- Calm, steady, reliable
- Informative without being verbose
- Empathetic to time blindness and executive function challenges

### Button Labels
- Use action verbs: "Start", "Pause", "Save", "Export"
- Avoid ambiguous labels: "OK", "Submit"
- Include keyboard shortcuts in tooltips

### Error Messages
**Pattern:**
```
[What happened] + [Why] + [How to fix]
```

**Example:**
> "Couldn't save time entry. The start time is after the end time. Please check your times and try again."

---

## 9. Design Patterns

### 9.1 Empty States
**Structure:**
- Icon or illustration (simple, not decorative)
- Short heading (8 words max)
- 1-2 sentences explaining what goes here
- Primary action button

**Example (Tasks):**
```
[Checklist Icon]
No tasks yet
Add your first task to start planning your time.
[+ Add Task]
```

### 9.2 Error States
**Structure:**
- Error icon (⚠️ or ❌)
- Error title
- Explanation + remediation steps
- Retry button or alternative action

**Example (Sync Error):**
```
❌ Calendar sync failed
We couldn't connect to your Google Calendar. Check your internet connection 
and try again. Your local data is safe.
[Retry] [Work Offline]
```

### 9.3 Success States
**Approach:** Subtle, not disruptive
- Inline text color change (green)
- Small checkmark icon
- Fade out after 3 seconds
- No modal dialogs for routine actions

---

## 10. Windows-Specific Considerations

### 10.1 Keyboard Shortcuts (Windows-first)
| Action | Shortcut | Context |
|--------|----------|---------|
| Start/stop timer | `Alt+T` | Global |
| Focus mode | `Alt+F` | Global |
| Add manual entry | `Alt+M` | In-app |
| Quick switch view | `Ctrl+1-7` | In-app (Dashboard=1, Tasks=2, etc.) |
| Settings | `Ctrl+,` | In-app |
| Search/command palette | `Ctrl+K` | In-app |

### 10.2 System Tray Integration
- Show active timer status in tray icon (time overlay)
- Right-click menu: Start Timer, Focus Mode, Open Dashboard, Quit
- Hover tooltip: Current project + elapsed time

### 10.3 Focus Assist Integration
- When Focus mode starts, optionally enable Windows Focus Assist (Priority Only)
- Restore previous Focus Assist state when session ends

### 10.4 Notifications
- Use Windows native toast notifications (Action Center)
- Respect "Do Not Disturb" and "Quiet Hours"
- No sound by default (opt-in only)

---

## 11. Accessibility Requirements

### Contrast Targets
- Normal text (16px+): **4.5:1** minimum
- Large text (24px+): **3:1** minimum
- UI components (buttons, inputs): **3:1** minimum
- Focus indicators: **3:1** against adjacent colors

### Keyboard Navigation
- All interactive elements reachable via `Tab` / `Shift+Tab`
- Logical tab order (top-to-bottom, left-to-right)
- Visible focus indicators (2px outline, high contrast)
- Skip links for screen readers ("Skip to main content")

### Motion & Animation
- Respect `prefers-reduced-motion` (Windows Ease of Access settings)
- All animations can be disabled in Settings
- Critical information never conveyed by motion alone

### Screen Reader Support
- Semantic HTML (headings, landmarks, lists)
- ARIA labels for icon buttons
- Live regions for dynamic content (timer updates)
- Alt text for all informational images

---

## 12. Acceptance Criteria for UI Tickets

**Definition of Ready:**
A UI ticket is ready for development when:
- [ ] Screen mockup or detailed description provided
- [ ] User story defined (As a... I want to... so that...)
- [ ] Keyboard shortcuts documented
- [ ] Empty state content written
- [ ] Error state behavior defined
- [ ] Accessibility requirements noted
- [ ] Success criteria measurable

**Definition of Done:**
A UI component is complete when:
- [ ] Visual design matches ND-friendly principles
- [ ] Keyboard navigation works correctly
- [ ] Screen reader announces elements properly
- [ ] Color contrast verified (automated + manual)
- [ ] Reduced motion respected
- [ ] Empty/error states implemented
- [ ] Unit tests pass (where applicable)
- [ ] Manual QA on Windows 10 & 11 completed

---

## 13. Design Deliverables Roadmap

### Phase 1: Foundation (Current)
- [x] Design Brief (`DesignBrief.md`)
- [ ] Color palette & typography system
- [ ] Component library (buttons, inputs, cards)
- [ ] Icon set (minimal, consistent style)

### Phase 2: Core Screens
- [ ] Dashboard mockups (default view)
- [ ] Focus Mode flow (setup → active → break → complete)
- [ ] Tasks list + add/edit forms
- [ ] Settings screen layout

### Phase 3: Advanced Features
- [ ] AI Diagnostics screen
- [ ] Journal editor
- [ ] Time/Calendar view
- [ ] Onboarding flow

### Phase 4: Polish
- [ ] Micro-interactions (opt-in animations)
- [ ] Dark mode refinement
- [ ] Windows 11 visual updates
- [ ] Accessibility audit

---

## 14. Open Questions & Future Considerations

1. **AI transparency:** How much insight into AI reasoning do users want?
2. **Gamification:** What's the threshold between motivating and stressful?
3. **Social features:** Is there any value in team/shared time tracking? (Probably not for v1)
4. **Mobile companion:** Notification relay or lightweight mobile view?
5. **Windows 10 vs 11:** Should UI adapt to Windows 11's rounded corners?

---

## 15. References & Resources

- **Neurodivergent design:** `{ND_Policy_URL}`
- **WCAG 2.1 AA:** https://www.w3.org/WAI/WCAG21/quickref/
- **Windows design guidelines:** https://learn.microsoft.com/en-us/windows/apps/design/
- **Keyboard accessibility:** https://webaim.org/techniques/keyboard/

---

## Appendix A: ASCII IA Hierarchy (Full App)

```
DigiArtifact Time Manager
│
├─── Dashboard (Home)
│    ├─ Today's Summary
│    ├─ Quick Actions
│    ├─ Active Timer Widget
│    ├─ This Week Chart
│    └─ AI Insight Card
│
├─── Tasks
│    ├─ Task List (filter: All/Today/Week)
│    ├─ Add Task Form
│    ├─ Time Estimates
│    └─ Archive
│
├─── Focus
│    ├─ Session Setup
│    │   ├─ Project selector
│    │   ├─ Duration presets
│    │   └─ Options (sounds, DND)
│    ├─ Active Session View
│    │   ├─ Progress circle
│    │   ├─ Controls (pause/stop)
│    │   └─ Ambient sounds
│    ├─ Break Timer
│    └─ Session Complete Summary
│
├─── Time (Clock)
│    ├─ Calendar View (week/month)
│    ├─ Manual Entry Form
│    ├─ Edit Existing Entries
│    └─ Export (CSV)
│
├─── Journal
│    ├─ Date Selector
│    ├─ Rich Text Editor
│    ├─ Mood/Energy Selector
│    └─ Auto-save
│
├─── Settings
│    ├─ General
│    ├─ Appearance
│    ├─ Keyboard Shortcuts
│    ├─ Integrations
│    ├─ Accessibility
│    └─ Data & Privacy
│
└─── AI Diagnostics
     ├─ Pattern Cards
     ├─ Suggestions
     ├─ Data Sources
     └─ Toggle AI On/Off
```

---

## Appendix B: Typical User Flow Example

**Scenario:** Alex starts a morning work session

```
1. Open app (or already in system tray)
   ↓
2. Dashboard → Click "Start Timer" or press Alt+T
   ↓
3. Quick timer dialog appears
   ├─ Project: [Dropdown: "Client Website Redesign"]
   ├─ Duration: ○ 25 min  ●50 min  ○ Custom
   └─ [Start] button
   ↓
4. Timer starts → Dashboard shows active timer widget
   │  (Timer also visible in system tray icon)
   ↓
5. Alex works... 50 minutes pass
   ↓
6. Gentle notification: "Session complete! Take a break?"
   ├─ [Take 10 min break]
   └─ [Start another session]
   ↓
7. Alex clicks "Take break" → Break timer starts
   ↓
8. Break ends → Notification: "Break's over. Ready to focus?"
   ↓
9. Repeat or return to Dashboard to review time tracked
```

---

**Document Control:**
- **Owner:** UX Lead / Product Manager
- **Review Cycle:** Quarterly or before major feature releases
- **Feedback:** Submit via GitHub issues with label `ux-strategy`

---

*End of Design Brief*
