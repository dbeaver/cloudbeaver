---
name: extend-at-seams
description: "Add new behavior through the product's existing plugin architecture and extension points instead of reshaping working code. Use when planning or implementing a feature, integration, action, screen, or background task, and whenever a change would add branches, flags, modes, or parameters to an existing module, contract, or component."
---

# Extend at seams

Modules are open for extension and closed for modification. A feature arrives as new code plugged
into a seam that already exists, so existing behavior keeps the shape it was reviewed and tested in,
and the diff shows what was added.

The product already has a plugin architecture. A seam is a place built to take one more
contribution: a service registry, an executor's handlers, a UI placeholder, a list of actions,
or a collection of providers. Plugins connect their contributions through bootstraps and the
existing registration mechanisms. The host does not need to know each contributing feature.

This is not a licence to build another plugin system. Reuse the existing architecture; a new
extension point earns its place when a second concrete case exists, not before.

## Choose the owner

- A self-contained feature belongs in a new plugin. Its own resources, API-facing behavior,
  services, state, and UI are signs of ownership, not a checklist: a feature does not need every
  layer to deserve a plugin.
- A small addition to a subject already owned by a plugin belongs in that plugin, usually as a
  new unit registered through an existing seam. Do not create a package for every handler or button.
- The new plugin owns its behavior and integration code. Its bootstraps connect it to public
  extension points; the host does not import the new plugin to recognize it.
- Keep shared infrastructure independent of feature plugins and dependencies acyclic.

## Steps

1. State the new behavior in one sentence and name its owner.
2. Find its seam. Look at how the closest existing behavior of the same kind was added: what
   owns it, how it registers its contributions, and how the host invokes them. Copy that shape.
3. Sort every edit to existing code into one of four kinds:
   - **Registration.** Plugging the new unit into a supported extension point: registering a
     plugin, service, or bootstrap; attaching an executor handler; contributing to a placeholder;
     or exposing a new method on a facade for the subject it owns. Always fine.
   - **Closed union.** A new variant of a discriminated union, handled wherever the compiler
     points. Fine. That is the union doing its job. Never swap it for a registry to dodge the edit.
   - **Growth.** New branches, flags, modes, or parameters inside an existing service, resource,
     handler, or component so it also covers the new feature. This is the edit to avoid. Put the
     new case in its own unit and let the existing extension point or caller select it.
   - **Correction.** The existing code is wrong, or its shape cannot take the new case. Stop and
     propose it separately, with the reasoning and cost. Do not fold it into the feature without
     approval.
4. If no seam fits, distinguish a missing integration point from the first local implementation:
   - For the first implementation within its owner, write the code where it belongs. Do not add
     a registry, interface, or loader for hypothetical future variants.
   - If integrating a new plugin requires changing a host, propose the smallest suitable seam
     using the existing architecture. Name the host behavior and the new contribution,
     what moves, the public contract, and the cost. Wait for approval before introducing it.
5. If the same growth is about to happen a second time, propose the seam. Name both concrete
   cases, what moves, and what it costs. Wait for approval. This rule concerns a new extension
   point, not another contribution to an extension point the product already has.
6. In the plan and final report, write: "Extends via <seam>. Modifies <symbol> because
   <registration | closed union | approved correction>." List every existing symbol the diff
   changes. Report an approved new seam explicitly; do not hide a host refactor under registration.

## Plugging the new unit in

- Keep integration wiring in bootstraps and feature logic in the feature's own units.
- Participate in existing lifecycles through executor handlers rather than feature-specific
  branches inside the publisher. Respect the seam's execution, ordering, and cleanup contract.
- Contribute UI through existing placeholders and registries. Keep applicability and visibility
  rules with the contribution when the seam supports them.
- Consume other modules through their public contracts. The host exposes the seam; the plugin
  supplies the behavior.
- Enable the plugin through the existing product composition mechanism.

## Placing the new logic

- New logic for a new subject is a new module, not new methods on a module that owns something
  else. Sharing data is not sharing a subject: two read models over the same data can have
  different owners.
- A new method on an existing module is extension when it belongs to the subject that module owns.
- Feature-specific resources, services, and API orchestration stay with the feature. Reuse shared
  transport and infrastructure through their existing contracts.
- An outside system gets its own adapter. The rest of the feature talks to the adapter rather
  than spreading the external SDK across services and components.
- In the UI, a new user action or screen is a new slice. A component does not grow branches for
  a new caller's use case: use an existing placeholder or slot, build a new component from the
  same parts, or propose a missing seam through the approval step above.

## Shared contracts

When two deployables share a contract, one of them deploys first. Grow the contract so the other
keeps working in between:

- Add operations and messages rather than changing existing ones incompatibly.
- A new optional field is additive. A new required input, or a renamed, removed, or retyped field,
  is a breaking change and counts as a correction.
- A new failure the consumer must handle differently is a new error type. Existing errors keep
  their identity.

## When modifying is right

- Fixing a bug.
- Adding a variant to a closed union.
- Deleting dead paths or compatibility code whose callers are gone.
- Writing the first local implementation where no seam exists.
- An approved correction or seam proposal.

## Red flags

- A boolean or mode parameter added to an existing function so it serves the new feature.
- An `if` on the new feature or plugin identity inside a host service, handler, or component.
- A host importing its contributing plugin, shared infrastructure depending on a feature, or a
  dependency cycle.
- A self-contained feature's state, resources, and integration logic scattered across host plugins.
- A parallel registry or plugin loader when the existing architecture already provides the seam.
- A speculative extension point with only one concrete case.
- A shared contract reshaped inside a feature change.

## Placeholder pattern

A placeholder lets plugins register UI contributions without changing the host.

Pass only the fundamental domain entities that define the placeholder's context. Contributions
derive their own UI state from those entities or obtain it from the relevant context. Do not add
derived flags or convenience props to the placeholder contract: this couples the host to its
contributions and makes the shared seam grow with individual UI needs.

## Pattern examples — reserved

TODO: Add further agreed patterns here later.
