# DigiArtifact Time Manager

> 📊 **Offline-first time tracking, invoicing, and revenue management for freelancers and creators**

A modern, lightweight productivity suite designed to run smoothly on low-end hardware without requiring internet connectivity or cloud services. Built with Svelte 5, Vite 7, and IndexedDB for complete local data ownership.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![Svelte](https://img.shields.io/badge/svelte-5.39.6-orange.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.7.3-blue.svg)

---

## ✨ Features

### 🕐 Time Management
- **Clock In/Out System**: Track work sessions with live timers
- **Multi-Task Tracking**: Monitor up to 4 simultaneous tasks
- **Weekly Targets**: Set and track weekly hour goals (default: 60 hours)
- **Time Logs**: Detailed history with filtering and export

### 💼 Project & Client Management
- **Jobs & Tasks**: Create projects, set targets, track progress
- **Client Database**: Store contact info, activities, and billing addresses
- **Deals Pipeline**: Manage opportunities through stages (Lead → Won/Lost)
- **Per-Job Progress**: Real-time tracking of hours vs. targets

### 💰 Financial Tracking
- **Invoicing**: Generate invoices with line items, tax, and discounts
- **Payment Recording**: Track payments by method with references
- **Expense Tracking**: Categorize expenses, mark as billable
- **Product Catalog**: Create reusable products/services for invoicing
- **Revenue Analytics**: View income, outstanding balances, and trends

### 🎨 Modern UI/UX
- **Glassmorphism Design**: Beautiful gradient backgrounds with frosted glass cards
- **Light/Dark Modes**: Toggle between themes (light mode default)
- **LOW-END Mode**: Performance optimization for older devices
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Smooth Animations**: Polished interactions with hover effects

### 🔒 Privacy & Offline
- **100% Local**: All data stored in browser IndexedDB
- **No Cloud**: Zero external services or tracking
- **Offline-First**: Works without internet connection
- **Data Ownership**: Export/import your data anytime
- **No Account Required**: Just open and use

---

## 🚀 Quick Start

### Prerequisites
- **Node.js**: v20 or higher
- **npm**: v10 or higher
- **Modern Browser**: Chrome, Firefox, Edge, or Safari (latest versions)

### Installation

```powershell
# Clone the repository
git clone https://github.com/TheSeeker713/DigiArtifact-work.git

# Navigate to project directory
cd "DigiArtifact work/digiartifact-time-manager"

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173/`

### First Use

1. **Open the app** in your browser
2. **Light mode** is enabled by default with glassmorphism design
3. **Clock In** to start your first work session
4. **Create a job** in Jobs & Tasks to track projects
5. **Set weekly targets** on the Dashboard
6. All data is automatically saved to IndexedDB

---

## 📖 Documentation

- **[User Guide](docs/user-guide.md)**: How to use all features (time tracking, invoicing, etc.)
- **[Developer Guide](docs/dev-guide.md)**: Architecture, adding entities, repository pattern
- **[Performance Guide](docs/performance.md)**: Optimization, LOW-END mode, testing

---

## 🛠️ Tech Stack

### Core
- **[Svelte 5](https://svelte.dev/)**: Reactive UI framework with runes
- **[TypeScript 5.7](https://www.typescriptlang.org/)**: Type safety and IDE support
- **[Vite 7](https://vitejs.dev/)**: Lightning-fast build tool with HMR

### Styling
- **[Tailwind CSS 4](https://tailwindcss.com/)**: Utility-first CSS framework
- **Custom Glassmorphism**: Modern frosted glass effects
- **PostCSS**: CSS processing pipeline

### Data & State
- **[IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)**: Browser-native database
- **[idb](https://github.com/jakearchibald/idb)**: Promise-based IndexedDB wrapper
- **Svelte Stores**: Reactive state management

### Utilities
- **[date-fns](https://date-fns.org/)**: Modern date utility library
- **[uPlot](https://github.com/leeoniya/uPlot)**: Fast, lightweight charts

---

## 📂 Project Structure

```
digiartifact-time-manager/
├── src/
│   ├── lib/
│   │   ├── components/        # Reusable UI components
│   │   ├── repos/             # Repository pattern (data access)
│   │   ├── stores/            # Svelte stores (global state)
│   │   ├── types/             # TypeScript type definitions
│   │   └── db.ts              # IndexedDB setup
│   ├── routes/                # Page components (Dashboard, Jobs, etc.)
│   ├── workers/               # Web Workers for heavy operations
│   ├── App.svelte             # Root component
│   ├── app.css                # Global styles
│   └── main.ts                # Entry point
├── docs/                      # Documentation
│   ├── user-guide.md
│   ├── dev-guide.md
│   └── performance.md
├── public/                    # Static assets
└── package.json               # Dependencies
```

## 🎯 Key Features Explained

### Clock In/Out System
Track your work sessions with a single click. Timer runs in real-time, sessions persist across browser refreshes, and all hours automatically feed into weekly targets and job tracking.

### Multi-Task Tracking
Juggle multiple projects simultaneously by tracking up to 4 active tasks. Pause/resume individual tasks, see live timers, and maintain focus without losing track of parallel work.

### Glassmorphism UI
Modern frosted glass design with gradient backgrounds, blur effects, and smooth animations. Toggle between light mode (default) and dark mode for comfortable viewing in any lighting.

### LOW-END Mode
Performance optimization for older devices. Disables animations, reduces visual effects, and improves responsiveness on low-spec hardware (pre-2015 laptops, budget devices).

### Repository Pattern
Clean architecture separates UI from data access. All entities (Jobs, Clients, Invoices) use a consistent repository interface for CRUD operations, making the codebase maintainable and testable.

---

## 🎨 Screenshots

### Dashboard (Light Mode)
Beautiful glassmorphism cards showing work session status, weekly hours progress, and per-job tracking.

### Multi-Task Tracker
Monitor multiple projects simultaneously with live timers and pause/resume controls.

### Invoicing
Professional invoice generation with line items, tax calculations, and client billing addresses.

### Jobs & Tasks
Project management with target hours, hourly rates, and real-time progress tracking.

*Note: Screenshots coming soon! For now, run `npm run dev` to see the app in action.*

---

## ⚡ Performance

### Benchmarks
- **Bundle Size**: ~405 KB gzipped (under 630 KB budget)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s
- **Frame Rate**: 60 FPS (30 FPS in LOW-END mode)
- **Memory Usage**: < 100 MB typical

### Optimization Features
- Code splitting by route
- Lazy loading of heavy components
- IndexedDB query optimization with indexes
- Virtual scrolling for long lists
- Web Workers for heavy operations
- LOW-END mode for older devices

See [Performance Guide](docs/performance.md) for detailed benchmarks and optimization techniques.

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR at http://localhost:5173 |
| `npm run build` | Production build with code-splitting and optimization |
| `npm run preview` | Preview production build locally |
| `npm run check` | Run Svelte type checker and TypeScript validation |

---

## 🚢 Deployment

### Static Web Hosting
```bash
# Build for production
npm run build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - GitHub Pages
# - Any static host
```

### Desktop App (Future)
Electron wrapper planned for standalone desktop installation without browser dependency.

### Self-Hosting
Since everything runs client-side, you can:
1. Build the app (`npm run build`)
2. Copy `dist/` folder to any web server
3. Serve as static files
4. No backend required!

---

## 🤝 Contributing

Contributions are welcome! Please read our guidelines:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript strict mode
- Use Prettier for formatting
- Add types for all functions
- Test on LOW-END mode
- Update documentation

See [Developer Guide](docs/dev-guide.md) for detailed contribution instructions.

---

## 📋 Roadmap

### Current Version: 1.0.0
- ✅ Time tracking with Clock In/Out
- ✅ Multi-task tracking (up to 4 tasks)
- ✅ Jobs & client management
- ✅ Invoicing & payments
- ✅ Expense tracking
- ✅ Glassmorphism UI with light/dark modes
- ✅ LOW-END performance mode
- ✅ IndexedDB offline storage

### Future Enhancements
- 🔄 Export data to CSV/PDF
- 🔄 Customizable invoice templates
- 🔄 Calendar integration
- 🔄 Team/multi-user support
- 🔄 Electron desktop app
- 🔄 Mobile app (PWA)
- 🔄 Recurring invoices
- 🔄 Budget tracking
- 🔄 Tax reporting
- 🔄 Data sync (optional cloud backup)

---

## 🐛 Troubleshooting

### Data Not Persisting
- **Issue**: Data disappears after closing browser
- **Solution**: Ensure you're not in Private/Incognito mode. IndexedDB requires normal browsing mode.

### Performance Issues
- **Issue**: App is slow or laggy
- **Solution**: Enable LOW-END mode by clicking the toggle in the header.

### Theme Not Saving
- **Issue**: Light/dark mode resets on refresh
- **Solution**: Clear browser storage (F12 → Application → IndexedDB → Delete "datm-settings"), then set theme again.

### Build Errors
- **Issue**: `npm run build` fails
- **Solution**: Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`

For more troubleshooting, see the [User Guide](docs/user-guide.md#troubleshooting).

---

## 📊 Browser Support

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Opera | 76+ | ✅ Fully Supported |

**Requirements:**
- IndexedDB support
- ES2020 JavaScript
- CSS Grid and Flexbox

---

## 📦 Distribution

### Source Code
- **GitHub**: [TheSeeker713/DigiArtifact-work](https://github.com/TheSeeker713/DigiArtifact-work)
- **License**: MIT License (see below)
- **Open Source**: Free to use, modify, and distribute

### Release Artifacts
- **Web Build**: Static files for hosting
- **Desktop Wrapper**: Coming soon (Electron)
- **Documentation**: Comprehensive guides included

### No Cloud Dependency
Run completely offline. No registration, no cloud services, no tracking. Your data stays on your device.

## 📄 License

**MIT License**

Copyright (c) 2025 Jeremy Robards / DigiArtifact

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

---

## 🙏 Attribution & Credits

### Creator
**Jeremy Robards** / **DigiArtifact**
- GitHub: [@TheSeeker713](https://github.com/TheSeeker713)
- Project: DigiArtifact Time Manager

### Attribution Requirements
When using or redistributing this software:
1. **Retain License**: Include the MIT License text
2. **Include NOTICE**: Maintain the NOTICE file
3. **Credit Visible**: Display "Built with DigiArtifact Time Manager by Jeremy Robards" in derivative works

### Built With
- **Svelte 5**: Cybernetically enhanced web apps
- **Vite 7**: Next generation frontend tooling
- **Tailwind CSS 4**: Utility-first CSS framework
- **TypeScript**: JavaScript with syntax for types
- **IndexedDB**: Browser storage API
- **date-fns**: Modern JavaScript date utility library
- **uPlot**: Fast, lightweight charts

---

## 💬 Support & Community

### Get Help
- 📖 **Documentation**: See [docs/](docs/) folder
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/TheSeeker713/DigiArtifact-work/issues)
- 💡 **Feature Requests**: [GitHub Discussions](https://github.com/TheSeeker713/DigiArtifact-work/discussions)
- 📧 **Contact**: Open an issue for support

### Contributing
We welcome contributions! Whether it's:
- 🐛 Bug fixes
- ✨ New features
- 📝 Documentation improvements
- 🎨 UI/UX enhancements
- 🧪 Tests
- 🌐 Translations

See [Developer Guide](docs/dev-guide.md) for how to get started.

---

## ⭐ Star History

If you find this project useful, please consider giving it a star on GitHub! ⭐

---

## 🔗 Links

- **Repository**: [https://github.com/TheSeeker713/DigiArtifact-work](https://github.com/TheSeeker713/DigiArtifact-work)
- **Issues**: [https://github.com/TheSeeker713/DigiArtifact-work/issues](https://github.com/TheSeeker713/DigiArtifact-work/issues)
- **Discussions**: [https://github.com/TheSeeker713/DigiArtifact-work/discussions](https://github.com/TheSeeker713/DigiArtifact-work/discussions)
- **User Guide**: [docs/user-guide.md](docs/user-guide.md)
- **Developer Guide**: [docs/dev-guide.md](docs/dev-guide.md)
- **Performance Guide**: [docs/performance.md](docs/performance.md)

---

<div align="center">

**Made with ❤️ by Jeremy Robards**

**DigiArtifact Time Manager** - Empowering creators with offline-first productivity tools

[⭐ Star on GitHub](https://github.com/TheSeeker713/DigiArtifact-work) | [📖 Documentation](docs/) | [🐛 Report Bug](https://github.com/TheSeeker713/DigiArtifact-work/issues) | [💡 Request Feature](https://github.com/TheSeeker713/DigiArtifact-work/discussions)

</div>
