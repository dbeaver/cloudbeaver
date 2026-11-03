---
name: component-state
description: Guides state management, component logic, and hook composition in CloudBeaver React components. Use when creating, changing, reviewing, or extracting component behavior, state, or hooks.
---

# Component state

Keep components easy to read: call hooks, connect their results, render UI.

- Move related state, derived values, and operations into a named hook. Several state fields,
  handlers, and effects for one task are a sign to extract it. A single local UI flag can stay.
- Extract complex logic into a separate hook even when it has no observable state. It can stay
  in the component when it is the component's direct responsibility and its only piece of logic.
- Give each hook one job. Do not move a large component into one equally large hook.
- If a hook owns observable state, use `useObservableRef` from `@cloudbeaver/core-blocks`.
- Return the state object itself, with values and operations. Do not spread it into a new object
  or return snapshots of its observable fields.

## useObservableRef

```ts
import { action, computed, observable } from 'mobx';
import { useObservableRef } from '@cloudbeaver/core-blocks';

function useSearchState(items: readonly string[]) {
  return useObservableRef(
    () => ({
      query: '',
      get filteredItems(): readonly string[] {
        return this.items.filter(item => item.includes(this.query));
      },
      setQuery(query: string) {
        this.query = query;
      },
    }),
    {
      query: observable.ref,
      items: observable.ref,
      filteredItems: computed,
      setQuery: action.bound,
    },
    { items },
  );
}
```

- Read changing inputs through `this` and pass them in the third argument. A closure in the
  factory can keep the first render's values.
- Keep editable local fields out of the update object: it overwrites local changes. Pass `false`
  when there are no inputs to update; omitting the third argument reapplies values from `init`.
- After `await`, wrap observable changes in `runInAction`; an action does not cover the continuation.
- Read observable fields inside an `observer` render or a tracked getter, not as snapshots
  destructured before that read. Otherwise MobX cannot track the source field.

## Compose hooks

Pass one hook's result into the next. Keep the connection visible instead of copying values
between independent states with effects. For example:

```ts
const source = useItemsSource(projectId);
const search = useItemsSearch(source);
const selection = useItemsSelection(search);
```

The receiving hook reads the source object in its getters and operations. If that source can
be replaced, pass it through the third argument of `useObservableRef`. Do not copy its current
fields into a second state. This keeps one owner for each value and preserves reactivity.

Keep hooks unconditional and at the top level. If the wiring itself grows, extract a composing
hook. A component coordinating several responsibilities should show the flow, not implement
all their state transitions.
