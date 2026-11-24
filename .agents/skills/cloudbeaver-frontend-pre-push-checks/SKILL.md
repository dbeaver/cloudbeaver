---
name: cloudbeaver-frontend-pre-push-checks
description: "Only for pushes whose branch diff contains CloudBeaver frontend files under the owning repository's webapp/ covered by its tooling, including repositories explicitly inheriting this workflow. Load before an authorized push, including branch publication and PR pushes. Backend-only pushes and unrelated repositories are outside this scope."
---

# Pre-push checks

Before a user-authorized push, select the applicable files as described in step 2. If the list is empty, skip this workflow before frontend setup; this does not block the push.

## 1. Prepare

Follow repository instructions and use its configured Node/Yarn versions. Run from the owning `webapp/` with installed dependencies and the applicable ESLint/Prettier configurations and ignores. For cross-repository frontend changes, check each owning repository using the intended dependency revisions.

## 2. Select changed files

Use the actual PR base, or the repository's development branch unless the user specifies another target. Resolve missing refs explicitly. Record base and HEAD SHAs; compare the **whole branch** from their merge base:

`git diff --name-only -z --diff-filter=ACMRT <merge-base> HEAD -- ':(top,literal)webapp/'`

For working-tree preflight, also include staged, unstaged and untracked non-ignored files under `webapp/`. Deduplicate and keep existing regular files; handle nested repositories separately. Use NUL-delimited paths and argument arrays, batching as needed. Explicitly skip empty lists.

## 3. Run both checks

Pass paths relative to `webapp/`, respecting each tool's configured scope and ignores:

- **ESLint:** `yarn lint -- <files>`. Keep warnings non-blocking.
- **Prettier:** `yarn prettier --check --ignore-unknown -- <files>`. Include supported non-code files; report ignored/unsupported files as skipped.

ESLint does not run Prettier. Configuration changes may require broader checks under repository rules. Check first; apply `--fix` / `--write` only to intended files, review the diff and rerun affected checks. Preserve unrelated changes and resolve failures without suppressing rules or excluding failing files.

## 4. Verify the pushed snapshot

Validate the committed HEAD being pushed. If the working tree differs, check HEAD in a configured isolated worktree or resolve/report the mismatch. Rerun affected checks after authorized fix commits or changes to HEAD, base, relevant files, configuration or dependencies.

Report checked HEAD/base, commands, file counts/scopes and results. Push only with passing checks for that snapshot; setup errors and unresolved failures block the push. Commit/push authorization must come from the user.
