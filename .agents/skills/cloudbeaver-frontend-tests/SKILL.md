---
name: cloudbeaver-frontend-tests
description: Add tests, write tests, or test a file in the CloudBeaver frontend. Use for any webapp core or plugin test request, especially when the package is missing Vitest scripts, dependencies, TypeScript references, DOM or DI setup, mocks, or previously disabled tests.
---

# CloudBeaver Frontend Tests

Set up the smallest environment required by the test, implement the test, and leave the package passing its focused checks.

## Workflow

1. Read `AGENTS.md`, the target package's `package.json` and `tsconfig.json`, the root `webapp/vitest.config.ts`, and the shared test configuration it exports. Identify the package name and its existing build, test, lint, and dependency-validation scripts.

2. Find one nearby package with active tests of the same kind. Prefer the same package family and dependencies over a superficially similar test. Treat current configuration and active code as authoritative; commented or skipped tests may preserve obsolete APIs.

3. Classify the narrowest required environment:

   - **Pure**: Vitest only; instantiate functions or services directly.
   - **DOM**: shared React test environment and Testing Library; use `renderInApp` only when a service provider is required.
   - **Application**: CloudBeaver DI lifecycle, module registration, GraphQL/MSW mocks, or application services through `@cloudbeaver/tests-runner`.

4. Wire the package by comparing it with the chosen peer:

   - Add `"test": "dbeaver-test"` when absent.
   - Add only test tools and libraries actually required by scripts or test imports. The normal baseline is `@dbeaver/cli`, `@dbeaver/react-tests`, `typescript`, and `vitest`; application helpers require `@cloudbeaver/tests-runner`.
   - Add workspace dependencies with Yarn from `webapp/`, preserving the dependency section and range convention used by the peer.
   - Run a non-immutable Yarn install so the configured TypeScript project linker synchronizes project references. Inspect the resulting `tsconfig.json`; edit references manually only when the linker cannot produce the required reference.
   - Ensure `src/**/*.test.ts` and `src/**/*.test.tsx` are covered by the package's existing `include` rules and compile from `src` to `lib`. Do not add a package-local Vitest config when the root config already supplies the environment.

5. Implement colocated `*.test.ts` or `*.test.tsx` tests. Use `.js` suffixes for relative imports. Keep fixtures local unless they are reusable package-level mocks; put reusable mocks under `__custom_mocks__` and declare every imported package in the correct dependency section.

6. For application tests, read the current implementations of `@cloudbeaver/tests-runner` and `core-di` before writing setup. Register current modules through `module.ts`, then create the application with the current `createApp()` API. Replace legacy manifest imports and `createApp(...manifests)` calls rather than recreating the removed manifest layer. Import every required module registration before application startup, and install focused GraphQL/MSW and known-console-message expectations for observable side effects.

   The shared Vitest configuration currently uses `isolate: false` in order to increase tests run speed. Test files in the same worker share the module cache and global environment, so module registration, mocks, globals, timers, environment variables, console handlers, DOM state, and open resources can affect later files. Make setup idempotent, restore mutable state in `afterEach` or `afterAll`, reset mocks and handlers to their declared baseline, unload applications, and close servers, sockets, and timers. Check that every test declares and initializes its own required dependencies and mocks instead of relying on another file having run first.

7. Build before testing. The shared Vitest configuration discovers compiled `lib/**/*.test.js`, so a source test that has not compiled is not runnable.

   ```sh
   yarn workspace <package-name> build
   yarn workspace <package-name> test
   yarn workspace <package-name> lint
   yarn workspace <package-name> validate-dependencies
   ```

8. Diagnose failures at the owning layer:

   - A missing test file usually means compilation did not emit it or the command ran from the wrong workspace.
   - A PnP resolution error means the importing package lacks a declared dependency.
   - A TypeScript project error means a workspace dependency/reference is missing or stale.
   - A missing service means its current module was not registered or an application dependency was omitted.
   - Unexpected console output must be asserted or fixed, not globally suppressed.

9. Confirm the test would fail for the behavior it protects, then restore the implementation and rerun the focused checks. Run root `yarn test` and `yarn validate-dependencies` only for shared test-infrastructure or cross-package changes. Leave generated `lib`, coverage, install, and test-result artifacts uncommitted.

   Because isolation is disabled, also run the complete affected package suite rather than only the new file. When shared modules, registries, mocks, or test helpers changed, run the broader workspace suite to expose order-dependent state leakage. A test must pass both alone and with its neighboring suite.

## Boundaries

- There is no plugin-level "tests unsupported" switch. Test support is the combination of scripts, dependencies, compilation, active tests, and a passing build.
- Prefer pure tests over booting the application. Use the DI environment only when direct construction would bypass behavior under test.
- Preserve package boundaries: import another workspace through public exports or documented mock exports, never through its `src` directory.
- Keep production dependencies out of `devDependencies`; test-only imports belong in `devDependencies` unless the package also imports them from production code.
- A package build failure blocks meaningful test execution because Vitest runs emitted JavaScript. Report unrelated pre-existing build failures explicitly rather than claiming the environment works.
- Do not enable per-file isolation locally to hide leaked state. Keep the package compatible with the shared root configuration and fix ownership and cleanup at the source.
