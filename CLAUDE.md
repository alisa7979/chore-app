# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack chore management web app for teams. Members are assigned recurring chores tracked on a calendar with completion status and reminders.

## Tech Stack

- **Backend:** Express.js + TypeScript, SQLite (Node 22 `DatabaseSync`), tsx runtime
- **Frontend:** React 18 + TypeScript, Vite, react-big-calendar, date-fns

## Key Directories

| Path | Purpose |
|------|---------|
| `chore-app/server/` | Express API server, DB init, route handlers |
| `chore-app/server/routes/` | REST endpoints: members, chores, instances |
| `chore-app/client/src/` | React app entry, API client, shared types |
| `chore-app/client/src/components/` | UI components (calendar, modals, panels) |

## Build & Dev Commands

All commands run from `chore-app/`:

```bash
npm run dev          # Start both server (port 3001) + client (port 5173) concurrently
npm run dev:server   # Server only (tsx watch)
npm run dev:client   # Client only (vite)
cd client && npm run build  # Production build (tsc + vite)
```

No test runner is configured.

## Additional Documentation

Check these when relevant:

- `.claude/docs/architectural_patterns.md` — API design, data model, state flow, DB conventions

## Adding new features or Fixing Bugs

**IMPORTANT**: When you work on a new feature or bug, create a git branch first. Then work on changes in that branch for the reminder of the session.