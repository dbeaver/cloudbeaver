# CloudBeaver

## What is CloudBeaver?

CloudBeaver is an open-source, web-based database management application. Its modular frontend provides the database navigator, SQL editor, data editor, administration, and related features, and communicates with the CloudBeaver server through GraphQL.

## Frontend

### Scope

- These instructions apply to the frontend under `webapp/` in CloudBeaver Community Edition and to any other CloudBeaver edition or product that shares this frontend architecture.
- Do not modify `server/`, `deploy/`, or backend configuration unless the task explicitly requires it. Backend GraphQL schemas are an input to frontend code generation, not part of the default edit scope.
- Treat `package.json`, `.yarnrc.yml`, and the frontend CI workflows as the source of truth for tool and runtime versions; do not duplicate their version numbers in documentation.

### Project map

- `webapp/package.json`: Yarn Plug'n'Play workspace root and repository-wide frontend scripts.
- `webapp/packages/core-*`: shared application foundations, services, UI primitives, state, and infrastructure.
- `webapp/packages/plugin-*`: feature modules. A package normally registers services and bootstraps in `src/module.ts` and exposes its public API from `src/index.ts`.
- `webapp/packages/product-*`: CE product composition and Vite entry points. `product-default` is the runnable/bundled frontend; `product-default-impl` selects the CE plugin set.
- `webapp/packages/core-sdk`: GraphQL operations and generated client types.
- `webapp/common-typescript/@dbeaver/*` and `webapp/common-react/@dbeaver/*`: shared DBeaver utilities and React components used by the workspace.
- Tests are colocated with source as `*.test.ts` or `*.test.tsx`; styles are usually colocated CSS modules.

### Stack

TypeScript ES modules, React, MobX, the project DI/module registry, GraphQL Code Generator, Vite, Yarn workspaces with PnP, Vitest and Testing Library, ESLint, Prettier, CSS Modules, and Tailwind-based theming.

### Setup and common commands

Use the Node version configured by frontend CI and the Yarn version pinned in `webapp/package.json`. Run frontend commands from `webapp/` unless noted.

```sh
corepack enable
cd webapp
yarn install --immutable
```

```sh
# Start the frontend dev server; a compatible CloudBeaver API must run separately.
(cd packages/product-default && yarn dev)

# From webapp/: repository-wide checks.
yarn lint
yarn test
yarn validate-dependencies

# Production frontend build.
(cd packages/product-default && yarn bundle)
```

For a focused check, use a package's existing script, for example `yarn workspace @cloudbeaver/core-utils test` or `yarn workspace @cloudbeaver/plugin-sql-editor lint`. Do not invent a package script that is absent from its `package.json`.

Before pushing CE or EE changes, read and follow `.agents/skills/pre-push-checks/SKILL.md` in this repository to run ESLint and Prettier on all changed files.

Before creating a pull request or writing/updating its description, read and follow `.agents/skills/file-pr/SKILL.md` in this repository.

When writing or reviewing user-facing text, read and follow `.agents/skills/clean-copy/SKILL.md` in this repository.

### Working conventions

- Put changes in the smallest package that owns the behavior. Prefer existing `core-*` abstractions and UI primitives before adding cross-package helpers.
- Keep dependencies directed from plugins to core: `core-*` packages must never import or depend on `plugin-*` packages. Plugins may use public APIs from core packages and from other plugins, subject to the administration boundary and the no-cycles rule below.
- Put administration-only behavior in a separate package whose name ends with `-administration`. Public/non-administration plugins must not import or depend on administration packages.
- Keep the workspace package dependency graph acyclic; do not introduce direct or indirect circular dependencies.
- Import workspace packages through their public `@cloudbeaver/*` or `@dbeaver/*` exports; never reach into another package's `src/` directory.
- When adding a workspace dependency, update the package's `package.json` through Yarn. The configured `ts-project-linker` synchronizes `tsconfig.json` project references during a non-immutable install; edit references manually only if automatic linking cannot complete. Run `yarn validate-dependencies` afterward.
- Register services and bootstraps through the package's `src/module.ts`. Change product composition only when enabling or disabling a package for the CE product.
- Put user-visible text in the package localization files and follow the neighboring `LocaleService` pattern; do not hardcode UI copy in components.
- Add or change GraphQL operations as `.gql` files in `core-sdk`. Regenerate through `yarn workspace @cloudbeaver/core-sdk gql:gen`; never edit the ignored generated `src/sdk.ts` manually.
- Preserve valid license headers on existing source files. When modifying an existing source file, update the ending copyright year to the current four-digit calendar year while keeping its original starting year. For new source files, use the template below and replace `<CURRENT_YEAR>` with the current year; never leave the placeholder in committed code. Use the repository ESLint and Prettier configuration rather than manual formatting rules.
- Do not edit or commit generated/install artifacts such as `node_modules/`, `.pnp.*`, `lib/`, `dist/`, `coverage/`, or `allure-results/`.
- Add focused tests for behavior changes. Before handoff, run lint and tests for affected packages; run the repository-wide checks and product bundle for cross-cutting or product-composition changes.

### License header for new source files

```text
/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-<CURRENT_YEAR> DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
```

## Backend

- Before backend work, read and follow `../dbeaver/AGENTS.md` for inherited Java and Tycho conventions.
- Cloudbeaver does not use SWT or Eclipse RCP, and its backend is headless.
- Configuration file is generated using `apps/config-generator`. For making changes there, update `config/template/cloudbeaver-base.conf` or use patches (for specific product parameters).
- The backend must support at least the following databases: PostgreSQL, MySQL, Oracle, and SQL Server. Support for additional databases is optional.

### GraphQL API

- Use consistent names. IDs must use type `ID`; ID arguments and inputs must end with `Id`, for example `projectId`.
- Top-level methods follow `{pluginId}{methodName}`, for example `authLogin`, `rmListProjects`, and `navNodeChildren`. Mark new public API with `@since`.
- Preserve released APIs: deprecate instead of renaming or removing, include the deprecation version, and remove only after more than one year. EA-only APIs may change before public release.
- New arguments and input fields added to a released API must be optional.

### License header

- Please use header from ../dbeaver/docs/license_header.txt for backend source files.

### Deployment

- CloudBeaver Community runs on embedded Jetty. The standalone Docker
  image runs the application directly; cloud VM provisioning adds nginx
  in front of it.

## Code review

- Report defects introduced by the PR. Cite the file and line, explain when the defect occurs, and suggest a focused fix.
- Flag unintended changes to public APIs, persisted data, configuration, or existing user workflows.
- For a bug fix, check that a regression test covers the failing case. Flag tests weakened to make the change pass.

### Security

- Review changed code and its direct call paths. Report a security finding only when the PR introduces a realistic attack path. Cite the file and line, identify who can trigger it and the impact, and suggest a focused fix.
- Trace input from users, database contents, configuration, and remote services into SQL, shell commands, file paths, URLs, XML parsing, and deserialization. Check validation, encoding, escaping, canonicalization, and resource limits at the point of use.
- Check authentication, authorization, and default access. For operations accessible from Team Edition, verify that the server enforces the appropriate REALM permission. Verify that requests without the required permissions are rejected.
- Flag unsafe handling of credentials and database connection settings. Check code, tests, configuration, logs, exceptions, and documentation for exposed secrets, tokens, passwords, private keys, connection strings, or personal data. Do not quote sensitive values in the review.
- Check temporary-file permissions, archive extraction paths, redirects, TLS configuration (including certificate verification), and external-process execution when those operations change.

### OSGi and product features

- Keep OSGi model bundles usable headlessly. Flag model code or bundle manifests that depend on UI bundles, including SWT and JFace.
- Verify that each new bundle or plugin reaches its intended DBeaver desktop, CloudBeaver, or Team Edition product through an included feature. EE products can include CE features: if the product already includes the CE feature, check the bundle there once; do not search for a duplicate EE entry.

### Frontend and GraphQL

- Flag frontend imports that bypass package exports, create cycles, make core depend on plugins, or make public plugins depend on administration packages.
- For released GraphQL APIs, require new inputs and arguments to be optional. Deprecate fields before removal, record the version, and retain them for more than one year.

### Interface text

Review changed user-visible interface text for punctuation and tone. Apply these rules to titles, headings, labels, controls, commands, messages, descriptions, and helper text. Do not apply them to technical documentation or release notes unless the text is presented in the interface.

#### Periods

Do not use periods in titles, headings, labels, controls, commands, or other text that names an interface element or action. In messages, descriptions, and other explanatory prose, use normal sentence punctuation: end complete sentences with a period, including standalone messages, and do not add a period to a fragment.

#### Colons

Use a colon after a label that introduces an input field or a group of radio buttons or checkboxes. Do not use a colon when the label and the text inside the field form a single phrase.

#### Contractions

Do not use contractions in interface text. Write words in full, such as `The connection cannot be established` rather than `The connection can't be established`. Contractions are acceptable in longer reading-oriented content, such as release notes.

#### Question Marks

Use a question mark only in a confirmation alert that asks a direct question. Do not use questions in commands, links, labels, helper text, or informational messages; rewrite them as commands or statements.

#### Exclamation Points

Do not use exclamation points in interface text.

Report only clear violations introduced by the pull request and suggest the correct user-visible wording.
