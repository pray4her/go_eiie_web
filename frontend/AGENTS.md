# Repository Guidelines

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or major performance or security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn how to create and apply change proposals, follow spec format, and understand project conventions.

Keep this managed block so `openspec update` can refresh the instructions.
<!-- OPENSPEC:END -->

## Project Structure & Module Organization

This repository is a Next.js 15 App Router frontend. Put routes in `src/app`, shared UI in `src/components/ui`, feature views in `src/components/features`, reusable client logic in `src/lib`, hooks in `src/hooks`, Zustand stores in `src/contexts`, and shared types in `src/types`. Static files live in `public`. Keep feature files close to their route domain, for example `src/components/features/resume-process/*`.

## Build, Test, and Development Commands

Run commands from the repository root:
- `npm install`: install dependencies.
- `npm run dev`: start the local dev server on `http://localhost:3000`.
- `npm run lint`: run the Next.js ESLint ruleset.
- `npm run build`: create a production build and catch type or routing issues.
- `npm run start`: serve the production build locally.

## Coding Style & Naming Conventions

Use TypeScript with 2-space indentation and strict typing. Prefer PascalCase for React components, `use-*.ts` for hooks, and kebab-case filenames such as `resume-process-upload-form.tsx`. Import internal modules through the `@/*` alias from `tsconfig.json`. Follow `eslint.config.mjs` and fix lint issues before opening a PR.

## Testing Guidelines

There is no dedicated automated test suite yet. Treat `npm run lint` and `npm run build` as required checks. Manually verify login, uploads, protected routes, and SSE-driven status flows after relevant changes. When adding tests, colocate them with the feature or under `src/__tests__` and use `*.test.ts` or `*.test.tsx`.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects, sometimes with Chinese context. Keep each commit focused, for example `Add resume export pagination`. PRs should include a concise summary, linked issue or task, screenshots for UI changes, and any API or environment updates.

## Configuration Notes

Store local secrets in `.env`. Call out changes that affect `NEXT_PUBLIC_API_BASE_URL`, request payloads, or response contracts so reviewers can verify backend compatibility.
