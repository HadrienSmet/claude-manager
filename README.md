# claude-manager

Desktop application for managing Claude agents and sessions.

## Stack

- **Desktop** — Tauri 2 + React 19 + Tailwind CSS
- **API** — Node.js + Fastify 5
- **Language** — TypeScript everywhere
- **Workspace** — pnpm workspaces

## Structure

```
apps/
  desktop/          # Tauri + React frontend
  api/              # Fastify HTTP server

packages/
  shared/           # Shared types and utilities
  core/             # Core domain logic and config
  git-layer/        # simple-git wrapper
  command-runner/   # child_process/spawn wrapper
  file-system/      # fs/promises helpers + JSON store
  agent-runtime/    # Agent session lifecycle
```

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Rust (for Tauri) — https://rustup.rs

## Getting started

```bash
pnpm install

# Run API + Desktop in parallel
pnpm dev

# Or individually
pnpm dev:api
pnpm dev:desktop
```

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start all apps in parallel |
| `pnpm build` | Build packages then apps |
| `pnpm typecheck` | Type-check the entire workspace |
| `pnpm lint` | Run ESLint |
| `pnpm format` | Format with Prettier |
