# CLAUDE.md

Always follow the rules defined in "docs/CODING_STANDARDS.md".
These rules are mandatory.

## Project

This repository contains an application for orchestrating multiple AI coding agents on a Git repository.

The app must allow agents to:
- inspect a repository,
- create isolated branches,
- implement assigned tasks,
- commit changes,
- open or prepare pull requests,
- review other agents' branches,
- detect conflicts,
- assist with merges,
- keep a traceable history of decisions.

## Core rule

Never make broad architectural changes without first producing a short implementation plan.

Before editing files:
1. inspect the current repository structure,
2. identify the minimal files to change,
3. explain the intended change,
4. then implement.

## Product goal

Build a safe orchestration layer for parallel AI agents working on the same Git repository.

The system should optimize for:
- isolation between agents,
- reproducibility,
- auditability,
- rollback safety,
- human supervision,
- clear Git history.

## Agent behavior

When acting as a coding agent:

- Prefer small, focused changes.
- Do not rewrite unrelated files.
- Do not rename public APIs without explicit reason.
- Do not introduce a new framework unless already present or explicitly requested.
- Do not silently remove existing features.
- Do not fake successful tests.
- If tests cannot be run, clearly say why.
- If requirements are ambiguous, make the safest reasonable assumption and document it.

## Git safety rules

Claude must never directly merge into `main`, `master`, `production`, or `develop`.

For each task:
- create or use a dedicated branch,
- keep commits focused,
- include a clear commit message,
- document changed files,
- mention tests run,
- mention risks and follow-up work.

Branch naming convention:

```txt
agent/<agent-id>/<short-task-name>
```

Examples:
```txt
agent/planner/phase-0-repo-scan
agent/backend/add-branch-worker
agent/reviewer/check-merge-conflicts
```

## Commit message format

Use:
```txt
<type>(<scope>): <summary>

<context>
<tests>
<risks>
```

Allowed types:
- feat
- fix
- refactor
- test
- docs
- chore
- infra

Example:
```txt
feat(agent-runner): add branch creation workflow

Adds the initial service for creating isolated task branches.

Tests:
- npm test
- npm run lint

Risks:
- Does not yet handle remote branch race conditions.
```

## Development workflow

For every implementation task:

1. Read docs/AI_AGENT_PROTOCOL.md.
2. Read docs/ARCHITECTURE.md.
3. Create a short plan.
4. Implement the smallest useful slice.
5. Run available checks.
6. Summarize:
	- files changed,
	- behavior added,
	- tests run,
	- known limitations,
	- recommended next task.

## Testing expectations

Before claiming completion, run the relevant checks.

Prefer these commands if available:
```bash
pnpm run lint
pnpm run typecheck
pnpm test
pnpm run build
```

If a command does not exist, do not invent it. Say it is unavailable.

## Documentation expectations

Update documentation when behavior changes.

For orchestration, Git, agents, branches, merging, permissions, or task lifecycle changes, update at least one of:
- docs/AI_AGENT_PROTOCOL.md
- docs/GIT_WORKFLOW.md
- docs/ARCHITECTURE.md

## Security boundaries

Never expose or commit:
- API keys,
- tokens,
- .env files,
- private SSH keys,
- GitHub tokens,
- Claude/OpenAI/Anthropic secrets,
- user credentials.

Never run destructive commands unless explicitly requested.

Forbidden unless explicitly approved:
```bash
rm -rf
git reset --hard
git push --force
git clean -fd
docker system prune
```

## Output format after each task

End every task with:
```md
## Summary

## Files changed

## Tests run

## Risks

## Next recommended step
```
