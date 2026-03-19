# Repository Guidelines

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

## Project Structure & Module Organization

The main application lives in `frontend/`, a Next.js 15 App Router project. Put routes in `frontend/src/app`, reusable UI in `frontend/src/components/ui`, feature-specific views in `frontend/src/components/features`, shared client logic in `frontend/src/lib`, hooks in `frontend/src/hooks`, and Zustand state in `frontend/src/contexts`. Static assets belong in `frontend/public`. Repository-level notes and integration docs live in `doc/` and the Markdown guides at the repo root.

## Build, Test, and Development Commands

Run app commands from `frontend/`.

- `npm install`: install dependencies.
- `npm run dev`: start the local development server on port 3000.
- `npm run build`: create a production build and catch type or route issues.
- `npm run start`: serve the production build locally.
- `npm run lint`: run the Next.js ESLint ruleset.

## Coding Style & Naming Conventions

Use TypeScript with strict mode enabled and follow the existing App Router structure. Prefer 2-space indentation, PascalCase for React components, `use-*.ts` for hooks, and kebab-case file names such as `resume-process-upload-form.tsx`. Import internal modules through the `@/*` alias from `frontend/tsconfig.json`. Linting is defined in `frontend/eslint.config.mjs`; fix warnings before opening a PR.

## Testing Guidelines

There is no dedicated automated test suite configured yet. Until one is added, treat `npm run lint` and `npm run build` as required checks, and manually verify affected flows in the browser, especially login, uploads, SSE status updates, and protected pages. When adding tests later, colocate them with the feature or under `frontend/src/__tests__` and use `*.test.ts(x)`.

## Commit & Pull Request Guidelines

Recent history uses short, imperative commit subjects, sometimes with Chinese context. Keep commits focused and descriptive, for example `Add resume export pagination`. PRs should include a concise summary, linked issue or task, environment or API changes, and screenshots for UI updates. Call out any changes to `NEXT_PUBLIC_API_BASE_URL` usage or request/response contracts.
