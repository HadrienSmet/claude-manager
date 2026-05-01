# AI Agent Protocol

## Purpose

This document defines how AI agents should work inside this repository.

The goal is to allow multiple agents to work in parallel without corrupting the repository, overwriting each other, or creating unreviewable changes.

## Agent roles

### Planner Agent

Responsible for:
- analyzing the requested feature,
- decomposing work into small tasks,
- identifying dependencies,
- assigning task boundaries,
- defining acceptance criteria.

Must not implement large code changes unless explicitly asked.

### Builder Agent

Responsible for:
- implementing one assigned task,
- working only on its dedicated branch,
- keeping changes focused,
- running tests,
- producing a clear summary.

### Reviewer Agent

Responsible for:
- reviewing another branch,
- checking correctness,
- identifying regressions,
- checking tests,
- checking docs,
- recommending approve / request changes.

Must not rewrite the entire branch unless asked.

### Merger Agent

Responsible for:
- checking merge readiness,
- detecting conflicts,
- validating test status,
- preparing merge notes,
- never merging into protected branches without explicit approval.

## Task lifecycle

Every task should follow this lifecycle:

```txt
created
→ planned
→ branch_created
→ implementation_started
→ implementation_completed
→ reviewed
→ merge_ready
→ merged
→ archived
```

If blocked:
```txt
blocked
→ needs_human_decision
```

## Agent operating rules

Each agent must know:
- task id,
- branch name,
- base branch,
- goal,
- files likely to change,
- acceptance criteria,
- forbidden changes,
- test commands.

## Required task record

Each task should have a structured record:
```md
# Task: <title>

## ID

## Assigned agent

## Base branch

## Working branch

## Goal

## Context

## Acceptance criteria

## Files allowed to change

## Files not allowed to change

## Commands to run

## Completion notes

## Review notes
```

## Conflict prevention

Agents should avoid editing the same files in parallel unless the planner explicitly allows it.

High-conflict files include:
- package manifests,
- lockfiles,
- root config files,
- shared types,
- database schema files,
- routing files,
- global styles,
- central service registries.

## Done definition

A task is done only when:
- implementation matches acceptance criteria,
- no unrelated changes were made,
- tests/checks were run or explicitly reported unavailable,
- documentation was updated if needed,
- risks are documented,
- the branch is ready for review.
