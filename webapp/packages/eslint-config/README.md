# Frontend lint policy

CloudBeaver CE and EE both use `@cloudbeaver/eslint-config/flat.js`.

Naming conventions are advisory: interface `I` prefixes, service/resource variable
names, and function names produce warnings rather than blocking PRs. Functions
with an inferred name (for example, an `onSubmit` property) need no explicit name.

Correctness and loading-boundary checks remain blocking, including React Hooks
rules (such as `rules-of-hooks` and `refs`), synchronous component imports from
`.ts` files, and duplicate imports. Other rule severities remain defined in
`flat.js`; this is not a blanket downgrade of lint errors.

Run the configuration regression suite from `webapp/`:

```sh
yarn workspace @cloudbeaver/eslint-config test
```

The suite runs the actual flat configuration against small source examples using
Node's test runner. This JavaScript-only package does not require application
builds or the DOM test environment.
