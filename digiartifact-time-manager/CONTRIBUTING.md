# Contributing to DigiArtifact Time Manager

Thanks for your interest in helping build the offline-first time manager. Please review these quick guidelines before opening an issue or pull request.

## Ways to Contribute
- Report bugs or performance regressions that violate the budgets in `docs/performance.md`.
- Suggest improvements to offline workflows, low-end optimizations, or IndexedDB data handling.
- Submit pull requests for features that align with the project roadmap (see `PROJECT_NOTES.md`).

## Development Workflow
1. Fork the repository and create a feature branch (`git checkout -b feature/your-topic`).
2. Run `npm install` followed by `npm run check` to ensure linting and type checks pass.
3. For UI work, document any bundle-size impacts and verify cold-load targets where possible.
4. Write or update tests when adding or changing functionality.
5. Submit a pull request describing the motivation, changes, and verification steps.

## Code Style
- Use TypeScript for all new modules.
- Favor composable Svelte components with lazy loading for non-critical routes.
- Keep dependencies minimal; justify any new package in the PR description.

## Commit Messages
- Follow conventional commit styling where practical (e.g., `feat:`, `fix:`, `chore:`).
- Reference related issues with `Fixes #123` or `Refs #123`.

## Attribution & Licensing
- All contributions are released under the MIT License of this project.
- Retain the attribution requirements noted in `LICENSE` and `NOTICE` when redistributing builds or documentation.

By contributing, you agree to follow our [Code of Conduct](CODE_OF_CONDUCT.md).
