# Cloud Command Center

An in-progress engineering portfolio dashboard built with React,
TypeScript, and Vite inside an Ubuntu lab VM.

## Workspace preview

![Cloud Command Center in dark mode with separate project cards and GitHub repository links](docs/images/workspace-dark.png)

*Local development build showing project selection, editable project cards, and a GitHub repository link. Project records currently reset on refresh; only the appearance preference persists.*

## Purpose

Organize personal GitHub projects, identify the next task, and
connect technical progress to measurable evidence.

Each user will be able to track their own projects. PulseForge and
Forge AI Platform are separate sample workstreams.

## Implemented

- Responsive command center layout.
- Project selection.
- Light, Dark, and System appearance options.
- Appearance preference saved in browser storage.
- Add and edit project records.
- Project names, categories, descriptions, and statuses.
- Validated GitHub repository links.

## Current limitations

Project changes are held in React memory and reset on refresh.
Only the appearance preference persists.

There are no accounts, shared database, automatic GitHub
synchronization, or live AI mentoring features yet.

## Run locally

Use the Node.js version recorded in .nvmrc.

```sh
npm ci
npm run dev
```

For development through a VM network adapter:

```sh
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

## Checks

```sh
npm run lint
npm run build
```

## Next milestone

Add browser-local project persistence with validation and
visible save errors. Then add current tasks and export/import.

## Planned

Milestones, incident records, ADRs, evidence tracking, deployment,
and operational verification.

## Project context

Independent portfolio and learning project, built with AI-assisted
guidance. Features are implemented incrementally and are not
represented as professional production experience.
