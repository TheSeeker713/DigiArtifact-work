# User Guide: Clock In/Out & Multi-Task Tracking

## Quick Start

### Clock In/Out (Dashboard)

**Location**: Dashboard page (top of page)

**How to Use**:
1. Click the **"Clock In"** button when you start working
2. The timer will begin counting automatically (HH:MM:SS format)
3. You'll see:
   - Active status with a pulsing green indicator
   - Elapsed time in large numbers
   - Clock in time and hours for today
4. When done working, click **"Clock Out"**
5. Your session is automatically saved

**Note**: Only one work session can be active at a time.

---

### Multi-Task Tracking (Time Page)

**Location**: Time page (top section)

**Creating a Task**:
1. Click **"+ New Task"** button
2. Select a Job (required)
3. Optionally select a specific Task
4. Enter a Task Name (e.g., "Create homepage mockup")
5. Check/uncheck "Billable" as needed
6. Click **"Start Task"**

**Managing Tasks**:
- **Pause**: Temporarily stop the timer (elapsed time is saved)
- **Resume**: Continue from where you paused
- **Complete**: Finish the task and save it to your time logs
- **Delete (✕)**: Remove the task without saving to time logs

**Completing a Task**:
1. Click the **"Complete"** button
2. Add optional notes about what you accomplished
3. Confirm if the task is billable or not
4. Click **"Complete & Save"**
5. The task is saved to your time logs
6. If other tasks are still running, you'll see a reminder

**Limitations**:
- Maximum 4 tasks running simultaneously
- When you reach 4 tasks, the "+ New Task" button is disabled
- Complete or delete tasks to make room for new ones

---

## Tips & Best Practices

### Clock In/Out:
- ✅ **DO**: Clock in when you start your workday
- ✅ **DO**: Clock out when taking extended breaks or ending your day
- ✅ **DO**: Check your elapsed time throughout the day
- ❌ **DON'T**: Forget to clock out (your hours won't be saved properly)

### Multi-Task Tracking:
- ✅ **DO**: Use descriptive task names
- ✅ **DO**: Pause tasks when switching contexts
- ✅ **DO**: Complete tasks with notes for better records
- ✅ **DO**: Mark billable/non-billable accurately
- ❌ **DON'T**: Leave tasks running overnight
- ❌ **DON'T**: Start more than 4 tasks (system limit)

### Workflow Example:
1. **Morning**: Clock in on Dashboard
2. **Start Work**: Create task "Client call - Project X" on Time page
3. **Context Switch**: Pause task, start new task "Email responses"
4. **Complete Work**: Complete both tasks with notes
5. **End of Day**: Clock out on Dashboard

---

## Understanding the UI

### Clock In/Out Widget (Dashboard):
```
┌─────────────────────────────────────┐
│ Work Session          🟢 Active      │
├─────────────────────────────────────┤
│          Elapsed Time                │
│          02:34:12                   │
│                                      │
│ Clocked In    │  Hours Today         │
│ 09:30 AM     │  2.57                │
│                                      │
│     [Clock Out]                      │
└─────────────────────────────────────┘
```

### Multi-Task Tracker (Time Page):
```
┌─────────────────────────────────────┐
│ Active Tasks (2/4 active)   [+ New] │
├─────────────────────────────────────┤
│ ┌─────────────┐  ┌─────────────┐   │
│ │ Task 1      │  │ Task 2      │   │
│ │ 🟢 Running   │  │ 🟡 Paused    │   │
│ │ 01:23:45    │  │ 00:45:30    │   │
│ │ Billable    │  │ Non-billable│   │
│ │[Pause][Done]│  │[Resume][Done]│   │
│ └─────────────┘  └─────────────┘   │
└─────────────────────────────────────┘
```

---

## Keyboard Shortcuts

Currently, all actions require clicking buttons. Future versions may add:
- Alt+I: Clock In/Out
- Alt+T: New Task
- Alt+P: Pause/Resume active task
- Alt+Enter: Complete active task

---

## Troubleshooting

**Q: Timer isn't updating**
- A: Refresh the page. Timers may pause if the browser tab is inactive for extended periods.

**Q: Clock in button is disabled**
- A: You likely already have an active session. Clock out first before starting a new session.

**Q: Can't create a new task**
- A: You've reached the 4-task limit. Complete or delete an existing task first.

**Q: Completed task doesn't appear in time logs**
- A: Check the Time page's log list below. If it's not there, the task may have failed to save. Try again.

**Q: Lost my work session data**
- A: Data is stored in IndexedDB (browser storage). Clearing browser data will erase all records. Use browser backup features if concerned.

---

## Data & Privacy

- **Storage**: All data is stored locally in your browser's IndexedDB
- **Sync**: No cloud sync - data stays on your device
- **Backup**: Use browser export tools or clear site data carefully
- **Multi-Device**: Each device has its own independent data

---

## Getting Help

- **Built-in Help**: Click "Help" in the navigation menu
- **About**: Find version info and contact details in Help > About
- **How To**: Step-by-step guides in Help > How To

---

## Version Info

- Feature added: 2025-01
- Database version: 2
- Requires: Modern browser with IndexedDB support
