---
name: cloudbeaver-frontend-pr-description
description: "Only for PRs whose branch diff includes CloudBeaver frontend files under the owning repository's webapp/, including repositories explicitly inheriting this workflow. Load when drafting or updating the frontend architecture and core changes in a PR description. Backend-only PRs and unrelated repositories are outside this scope."
---

# CloudBeaver frontend PR description

Supplement the owning repository's PR description conventions with the frontend details below. Repository rules govern titles, commits, closing references, templates, and the PR lifecycle. Preserve required opening text and sections; integrate this guidance into the existing description rather than replacing it.

For mixed PRs, apply these conventions only to the frontend portion while keeping the description accurate for the whole diff.

## Frontend architecture

Inspect the branch diff from the merge base to the intended head. Identify affected frontend packages, their responsibilities, and how changed behavior connects through plugin registrations, bootstraps, or extension points.

Explain changes to dependency direction or public package contracts and their effect on consumers. Include these details in the description's architecture section using the repository's diagram conventions.

## Core changes

Inspect changes in `core-*`, including `core-sdk` operations, and shared `@dbeaver/*` libraries. Check public contracts and extension points.

If core changes, explain:

- Which packages or contracts changed.
- Why the change belongs in core rather than a feature plugin.
- How it affects existing consumers.

Distinguish implementation changes from public API changes, including server API changes. Name reused core capabilities when useful.

If core is unchanged, state: **No core changes.**

This skill supplies description content only; it does not authorize committing, pushing, or creating or editing a PR.
