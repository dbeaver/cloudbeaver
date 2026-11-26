---
name: cloudbeaver-frontend-form-parts
description: "Only for CloudBeaver frontend code under the owning repository's webapp/, including repositories explicitly inheriting this workflow. Load when creating, changing, or reviewing a FormPart implementation or contract, or when work on a consumer directly involves the FormPart lifecycle, such as loader(), isOutdated(), or isLoaded()."
---

# Form parts

Apply this workflow to FormPart implementations and to consumer changes that affect or depend on the FormPart lifecycle. UI work inside a form that leaves the lifecycle untouched is outside this workflow.

A `FormPart` adds functionality to a form, usually a tab. It loads, processes, and stores its own state and participates in the form lifecycle.

Keep `loader()`, `isOutdated()`, and `isLoaded()` in sync:

- Include every resource used by `loader()` in both checks, including dependencies loaded through helpers.
- In `isOutdated()`, combine `super.isOutdated()` and resource checks with `||`. Any outdated dependency makes the part outdated.
- In `isLoaded()`, combine `super.isLoaded()` and resource checks with `&&`. The part is loaded only when its loader has finished and all required dependencies are loaded.
- Use the same resource keys, includes, and conditions as `loader()`. If the loader skips a resource, for example in create mode or without an ID, skip its checks too.

Example for an unconditional resource dependency:

```ts
override isOutdated(): boolean {
  return super.isOutdated() || this.resource.isOutdated(this.key);
}

override isLoaded(): boolean {
  return super.isLoaded() && this.resource.isLoaded(this.key);
}
```

After a successful load, `isLoaded()` should be `true` and `isOutdated()` should be `false` until a dependency changes. Auto-loading retries while either condition is unmet. Checking a resource or key that `loader()` never refreshes can cause an infinite reload loop.

## Keep the ESLint contract synchronized

When changing the base `FormPart` API, update `webapp/packages/eslint-plugin/formPartContract.js` and its tests to match, then run `yarn workspace @cloudbeaver/eslint-plugin test` from `webapp/`.
