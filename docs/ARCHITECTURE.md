# Architecture

## System purpose

This application coordinates multiple AI agents working on a Git repository.

It provides:
- task planning,
- branch creation,
- agent execution,
- status tracking,
- review workflows,
- merge preparation,
- audit logs.

## Core concepts

### Repository

A Git repository managed by the system.

### Agent

An AI worker assigned to a specific role and task.

### Task

A bounded unit of work assigned to one agent.

### Branch

An isolated Git branch created for a task.

### Run

A single execution attempt by an agent.

### Review

A structured evaluation of a branch before merge.

### Merge plan

A pre-merge report describing conflicts, risks, and readiness.

## Suggested modules

```txt
src/
  domain/
    agents/
    tasks/
    repositories/
    branches/
    reviews/
    merges/

  services/
    git/
    agent-runner/
    orchestration/
    audit/

  infrastructure/
    persistence/
    queue/
    github/
    filesystem/

  ui/
    dashboard/
    task-detail/
    branch-detail/
```

## Domain boundaries

### Agent orchestration

Responsible for:
- assigning tasks,
- starting agent runs,
- tracking status,
- preventing duplicate work.

### Git service

Responsible for:
- cloning repositories,
- checking status,
- creating branches,
- committing,
- pushing,
- detecting conflicts.

### Review service

Responsible for:
- diff inspection,
- checklist validation,
- risk detection,
- producing review reports.

### Audit service

Responsible for:
- recording agent actions,
- storing command history,
- linking commits to tasks,
- preserving decisions.

## Design principles
- Keep Git operations explicit.
- Make every agent action auditable.
- Prefer deterministic workflows.
- Never rely only on chat history for state.
- Store task state in the app database.
- Store code changes in Git.
- Store reasoning summaries, not hidden chain-of-thought.
- Make human approval possible before destructive actions.

## Non-goals for early versions

Avoid implementing these too early:
- automatic production deployment,
- fully autonomous merging into main,
- complex permission systems,
- custom model fine-tuning,
- multi-repository dependency graphs.

## Phase 0 target

Phase 0 should prove that the app can:
- register a repository,
- create a task,
- create a branch for that task,
- run or simulate an agent,
- record the result,
- show status,
- prepare a review summary.
