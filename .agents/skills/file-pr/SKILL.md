---
name: file-pr
description: Use when creating a PR or writing or updating its description.
---

# File PR

## Prepare

1. Read repository instructions and identify the PR base and head. Resolve unclear scope before drafting.
2. Review the whole branch diff from the merge base to the intended head. Read affected implementations, public exports, registrations, and callers as needed.
3. Describe only changes included in the PR, keeping staged, unstaged, and untracked work separate.
4. Ground claims and diagrams in the code. Report compatibility and migration requirements only when verified.

## Title

Follow repository conventions, using recently merged PRs and Git history as references. Prefer a concise title explaining the outcome rather than the implementation. Use metrics only when supported by evidence.

Apply the same approach to commit messages when committing is requested.

## Description

Use the following four sections. Preserve any additional content required by the repository's PR template.

### Summary

Write one short paragraph, preferably one or two sentences: the user's problem, the solution, and the resulting behavior or benefit. Leave implementation details to the sections below.

Example:

> Export settings had to be entered again for every export. Users can now save them as named profiles and reuse them.

### Architecture

Name the affected packages and key components, explain their responsibilities, and show how they connect to the application through registrations or extension points.

Include a compact Mermaid `flowchart` showing relevant dependencies or data flow. Keep arrow meanings consistent and label them where needed. Mark components as new, changed, or unchanged using text.

For changes without structural impact, keep the diagram minimal and state that the architecture is unchanged.

### Entities and relationships

Identify new or changed domain entities. Include existing entities only to explain relevant relationships.

Use a table:

| Entity | Change | Relationships |
| ------ | ------ | ------------- |

Describe purpose, ownership, references, and cardinality where established by the code. Include lifecycle rules when affected.

When relationships change, include a Mermaid `erDiagram`, or a `flowchart` for associations that do not fit an ER model. Distinguish a logical domain model from a database schema.

If none change, write:

**No domain entities or relationships changed.**

### Core changes

Inspect the diff for changes in `core-*`, including `core-sdk` operations, and shared `@dbeaver/*` libraries. Check public contracts and extension points.

If core changes, explain:

- Which packages or contracts changed.
- Why the change belongs in core rather than the feature plugin.
- How it affects existing consumers.

Distinguish implementation changes from public API changes, including server API changes.

If core is unchanged, write:

**No core changes.**

Name reused core capabilities when useful.

## Scope

This skill formats the PR description. Committing, pushing, and creating or editing a PR require authorization within the user's request. Required pre-push checks still apply.
