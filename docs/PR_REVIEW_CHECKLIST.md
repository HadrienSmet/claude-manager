# Pull Request Review Checklist

## Scope

- [ ] The branch solves the assigned task.
- [ ] No unrelated files were changed.
- [ ] No unnecessary refactor was introduced.
- [ ] Public APIs were not changed without explanation.

## Correctness

- [ ] Edge cases were considered.
- [ ] Error handling is present where needed.
- [ ] The implementation matches existing patterns.
- [ ] No obvious race condition was introduced.

## Git safety

- [ ] Branch name follows convention.
- [ ] Commit messages are clear.
- [ ] No protected branch was modified directly.
- [ ] No generated junk files were committed.

## Security

- [ ] No secrets were committed.
- [ ] No unsafe command execution was introduced.
- [ ] User-controlled input is validated where relevant.
- [ ] Git operations are constrained and auditable.

## Tests

- [ ] Relevant tests were added or updated.
- [ ] Existing tests pass.
- [ ] Lint/typecheck/build were run if available.
- [ ] Missing checks are documented.

## Documentation

- [ ] Architecture docs updated if needed.
- [ ] Git workflow docs updated if needed.
- [ ] Agent protocol docs updated if needed.

## Review decision

Choose one:

```txt
approved
request_changes
blocked
needs_human_decision
```

## Review notes
```txt
<Write concise notes here>
```