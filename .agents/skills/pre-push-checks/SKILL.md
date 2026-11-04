---
name: pre-push-checks
description: Run ESLint and Prettier on all changed files before pushing CloudBeaver CE or EE changes. Use for git push, publishing a branch, or creating/updating a PR that requires a push.
---

# Pre-push checks

Validate the complete change set before executing a user-authorized push. Apply this independently to every repository being pushed.

## 1. Prepare ESLint and Prettier

Read the repository instructions and `webapp/package.json`. Use the Node version specified by frontend CI and the pinned Yarn version. Run commands from the owning `webapp/` with its installed dependencies.

Read `webapp/eslint.config.mjs` and `webapp/.prettierrc.mjs`, including their shared configuration and applicable ignore rules. CE and EE use the shared `@cloudbeaver/eslint-config`; for cross-repository changes, check both workspaces against the intended sibling revisions.

Run **both ESLint and Prettier**: ESLint with `eslint-config-prettier` does not run the formatter.

Completion: both commands have an identified working directory and configuration; missing dependencies or configuration are reported as blockers.

## 2. Determine all changed files

Identify the repository root, current HEAD, and the PR target branch. For an existing PR, use its actual base; otherwise use the repository's development branch unless the user specified another target. Use the local base ref according to repository instructions; record its SHA. If it is missing, resolve it explicitly instead of guessing another branch.

Compute the merge base of the target and HEAD. Collect:

1. Added, copied, modified, renamed and type-changed destination paths from `git diff --name-only -z --diff-filter=ACMRT <merge-base> HEAD`.
2. Staged and unstaged changed paths for a working-tree preflight.
3. Untracked, non-ignored files from `git ls-files --others --exclude-standard -z`.

Deduplicate paths and keep existing regular files. Exclude deleted files from the ESLint and Prettier input lists. Handle nested repositories separately.

Use NUL-delimited Git output and argument arrays, preserving spaces, Unicode and special characters in filenames. Batch long argument lists. An empty file list is an explicit skip, not a command with no arguments that accidentally scans the whole repository.

Compare the **whole branch against its target**, not only the last commit, staged files, or the tracking branch: earlier commits may still contain failures.

Completion: record the base SHA, HEAD SHA, file count and selected check scopes.

## 3. Run ESLint and Prettier

Pass file paths relative to the owning `webapp/`, using separate argument arrays for each command.

- **ESLint:** run `yarn lint -- <files>` on every changed file covered by ESLint's configured file patterns. Preserve configured ignores. Warnings remain warnings; do not add `--max-warnings=0`.
- **Prettier:** run `yarn prettier --check --ignore-unknown -- <files>` using the applicable configuration and ignore rules. Include supported non-code files such as JSON, CSS, Markdown, YAML and GraphQL, not only TS/TSX. Report ignored and unsupported files honestly.
- **Configuration changes:** lint/format configuration changes can affect unchanged files. Follow the repository's broader verification requirements for those changes.

Check mode comes first. Fix errors in the task's scope; use `--fix` / `--write` only on the intended files, review the diff, then rerun the affected checks. Preserve unrelated user changes. A check failure is not a reason to silently disable a rule or filter out its file.

Completion: both commands have a result and every blocking failure is resolved or reported as a push blocker. Include nonzero setup/configuration exits, not just source diagnostics.

## 4. Validate the snapshot being pushed

The final gate must cover the committed content at the HEAD being pushed. A green working-tree check does not verify an older commit when staged or unstaged changes differ from HEAD. Check the committed snapshot in a correctly configured isolated worktree, or resolve/report the mismatch before pushing; preserve the user's working tree.

After fixes are committed under the user's authorization, rerun checks for that final snapshot. If HEAD, relevant files, check configuration or dependency revisions change after validation, refresh the affected checks. A remote ref change that alters the intended PR base also invalidates the recorded comparison.

Report the checked HEAD/base, commands, scopes and results. Proceed with the requested push only when the snapshot matches and ESLint and Prettier pass. This skill does not itself authorize a commit or push, and it does not install a Git hook for pushes made outside the agent.
