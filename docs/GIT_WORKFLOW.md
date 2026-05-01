# Git Workflow for AI Agents

## Protected branches

The following branches are protected:

```txt
main
master
develop
production
```

Agents must not commit directly to protected branches.

## Branch naming

Use:
```txt
agent/<role-or-agent-id>/<task-slug>
```

Examples:
```txt
agent/builder/add-task-runner
agent/reviewer/review-branch-service
agent/planner/phase-1-breakdown
```

## Before starting work

Run:
```bash
git status
git branch --show-current
git fetch --all --prune
```

Confirm:
- working tree is clean,
- current branch is correct,
- base branch is up to date.

## Creating a branch
```bash
git checkout <base-branch>
git pull
git checkout -b agent/<agent-id>/<task-slug>
```

## During work

Commit small logical chunks.

Avoid commits that mix:
- formatting,
- feature work,
- refactors,
- dependency changes,
- documentation.

## Before finishing

Run:
```bash
git status
git diff --stat
git diff
```
Then run available checks:
```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Merge readiness checklist

A branch is merge-ready when:
- it is based on the latest target branch,
- it has no unresolved conflicts,
- checks pass or failures are documented,
- review notes are addressed,
- documentation is updated,
- commit history is understandable.

## Conflict handling

When conflicts occur:
1. stop,
2. identify conflicting files,
3. explain why the conflict exists,
4. suggest a resolution,
5. do not blindly choose one side,
6. preserve both agents' intended behavior when possible.
