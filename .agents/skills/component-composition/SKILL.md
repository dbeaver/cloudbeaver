---
name: component-composition
description: "Guides creation of CloudBeaver React components through children, slots, compound parts, and specialized components. Use when creating React components, designing their props, or choosing how callers supply content, actions, and layout regions."
---

# Component composition

Keep layout and behavior with the component; let its caller supply finished pieces of UI.
Design the interface around the component's own responsibilities. Let callers compose content
and actions instead of configuring nested UI through data, flags, and callbacks.

Components must have no more than **five props**, excluding `children` and UI slots.
If an interface exceeds this limit, use composition to move UI regions and their configuration
to the caller. Only genuine UI slots are exempt; renaming a configuration prop does not make it a slot.

## Sort every prop first

| A prop that… | Belongs… |
| --- | --- |
| Drives the component's own behavior (`value`, `open`, `onChange`, `disabled`) | On that component |
| Picks a look for the whole component (`size`, `variant`) | On the root |
| Fills one region (`title`, `description`, `icon`) | In `children`, a slot, or a part |
| Configures a nested element (`actionLabel`, `onAction`, `actionDisabled`, `actionClassName`) | On the element rendered by the caller |
| Selects substantially different markup or interaction (`inline`, `mode="drawer"`) | In a separate component sharing lower-level parts |
| Changes the rendered element (`as`, `tag`, `href`, `render`) | On the underlying primitive, using its supported API |

Keep native DOM props, accessibility attributes, refs, and controlled-state contracts intact.
A boolean that changes a class is not automatically a second component. Domain data also belongs
on a feature component that actually owns its behavior; do not turn every domain value into JSX.

## Choose the simplest pattern

1. **Children** for the main content. Start here.
2. **Slots** for a small, fixed set of regions. Type `<role>Slot` as `ReactNode`; place the value
   without inspecting it. Prefer `actionsSlot={<ConnectButton connection={connection} />}` to
   a label, visibility flag, disabled flag, and callback. Follow an existing local slot name when present.
3. **Render props** only when content needs state owned by the component. Expose a minimal typed
   argument, not the component's full store or internal implementation.
4. **Compound parts** when callers vary the presence, order, or configuration of regions.
   Reuse existing parts before introducing new wrappers.
5. **Separate components** when a mode selects another layout or interaction contract. Share
   parts underneath; keep small visual variants on the root.
6. **Wrap and specialize** an existing primitive when only defaults or feature wiring differ.
   Preserve its native and accessibility behavior instead of re-describing its API.

Choose a more structured pattern only when it reduces what real callers have to know.
Bundling props in `options`, renaming configuration to `xSlot`, or splitting internals while
keeping the same prop-heavy interface does not transfer ownership.

## Compound parts

- Name parts after their root and role: `ConnectionSummaryContent`, `ConnectionSummaryActions`.
  Use roles such as `Header`, `Title`, `Description`, `Content`, `Footer`, `Actions`, `Media`,
  `Icon`, `Group`, `Item`, `Separator`, `Trigger`, and `Label` only where they have a job.
- A simple layout part renders one semantic element, accepts that element's props, merges
  `className`, and forwards the remaining props and refs according to the local primitive's API.
  Zero to two custom props is a useful heuristic, not a limit for headless primitives or controls.
- Keep layout parts optional and let CSS adapt to their presence. Do not add `hasAction` or
  inspect, clone, or identify children to discover the layout. Semantic requirements still apply:
  a dialog needs an accessible name, and interactive parts need their provider and relationships.
- Keep whole-component appearance on the root. Use existing classes or `data-*` attributes and
  scoped CSS selectors for parts; do not add context merely to distribute size or spacing.
- Reuse the headless primitive's context/store for shared interactions. Add a local typed context
  only for behavior state that parts genuinely share; follow neighboring context and hook naming.
- A default sub-part can sit behind a convenience boolean if it is also exposed for callers
  needing control. Do not accumulate booleans to configure that default part.

Read [EXAMPLES.md](EXAMPLES.md) for worked examples using slots and compound parts.
