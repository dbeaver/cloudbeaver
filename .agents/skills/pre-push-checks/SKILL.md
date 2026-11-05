---
name: pre-push-checks
description: Run ESLint and Prettier before pushing CloudBeaver CE or EE changes, including branch publication and PR pushes.
---

# Pre-push checks

Apply these checks to each repository before a user-authorized push.

## 1. Prepare

Follow repository instructions and use its configured Node/Yarn versions. Run from the owning `webapp/` with installed dependencies and the applicable ESLint/Prettier configurations and ignores. For CE/EE cross-repository changes, use the intended sibling revisions.

## 2. Select changed files

Use the actual PR base, or the repository's development branch unless the user specifies another target. Resolve missing refs explicitly. Record base and HEAD SHAs; compare the **whole branch** from their merge base:

`git diff --name-only -z --diff-filter=ACMRT <merge-base> HEAD`

For working-tree preflight, also include staged, unstaged and untracked non-ignored files. Deduplicate and keep existing regular files; handle nested repositories separately. Use NUL-delimited paths and argument arrays, batching as needed. Explicitly skip empty lists.

## 3. Run both checks

Pass paths relative to `webapp/`, respecting each tool's configured scope and ignores:

- **ESLint:** `yarn lint -- <files>`. Keep warnings non-blocking.
- **Prettier:** `yarn prettier --check --ignore-unknown -- <files>`. Include supported non-code files; report ignored/unsupported files as skipped.

ESLint does not run Prettier. Configuration changes may require broader checks under repository rules. Check first; apply `--fix` / `--write` only to intended files, review the diff and rerun affected checks. Preserve unrelated changes and resolve failures without suppressing rules or excluding failing files.

## 4. Verify the pushed snapshot

Validate the committed HEAD being pushed. If the working tree differs, check HEAD in a configured isolated worktree or resolve/report the mismatch. Rerun affected checks after authorized fix commits or changes to HEAD, base, relevant files, configuration or dependencies.

Report checked HEAD/base, commands, file counts/scopes and results. Push only with passing checks for that snapshot; setup errors and unresolved failures block the push. Commit/push authorization must come from the user.
