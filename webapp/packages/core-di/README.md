# Effect dependency injection

`core-di` integrates Effect services and layers with CloudBeaver's existing
`module.ts` contributions, application startup and React. Effect owns service
acquisition, layer memoization and resource finalization. The module linker
composes layers; it does not inspect constructors or instantiate classes.

## Declaring a service

```ts
import { Context, Effect, Layer } from '@cloudbeaver/core-di';

export class ExampleService extends Context.Service<ExampleService>()('@cloudbeaver/example/ExampleService', {
  make: Effect.gen(function* makeExampleService() {
    const api = yield* ApiService;

    return {
      refresh: () => api.refresh(),
    };
  }),
}) {
  static readonly dependencies = () => [ApiService] as const;
  static readonly layer = Layer.effect(this, this.make);
}
```

- Use a package-qualified, unique service key. A class name alone is not unique
  across plugins (for example, `LocaleService`).
- `dependencies` lists the inputs of the raw layer for the dynamic module linker.
  Keep it aligned with the layer's requirements. Alternatively, export a fully
  composed layer with `Layer.provide` and omit already satisfied inputs.
- Dependency keys are read lazily, after module evaluation.
- In a statically composed graph, Effect checks layer requirements through the
  type system. Dynamic module lists additionally need runtime graph validation;
  `App` performs it before preload side effects.
- Capture dependencies in `make`. Operations should normally return Effects
  with no remaining service requirements, and should not call `runPromise`.
- Use `Effect.acquireRelease` / `Effect.addFinalizer` for owned resources. A
  `dispose` method is not automatically a finalizer in a native Effect layer.

Existing class implementations use `ExampleServiceImpl`, a native
`ExampleServiceDI extends Context.Service` key, and the public value alias
`ExampleService`. The public type alias still denotes the implementation. This
keeps existing MobX and Promise consumers intact while making construction
explicit: `new ExampleServiceImpl(...)`, not `new ExampleService(...)`.
The implementation-owning layer registers its cleanup with `disposeService`;
aliases and borrowed application instances do not acquire a second owner.

## Module contributions

```ts
export default ModuleRegistry.add({
  name: '@cloudbeaver/example',
  services: () => [ExampleService],
  bootstraps: () => [ExampleBootstrap],
  scoped: () => [ExampleViewerService],
});
```

The existing product composition selects modules. Services and bootstrap keys
are linked into the application graph; scoped layers are acquired inside feature
scopes. For caller-owned models, inject an explicit factory service (see
`SqlEditorModelFactory`) rather than resolving transient constructors.

## Startup and shutdown

1. Validate the application graph, without acquisition.
2. Acquire preload services, then call every preload `register`, then every `load`.
3. Acquire the remaining application graph, borrowing the preload instances.
4. Call every bootstrap `register`, then every bootstrap `load` in module order.
5. Render React using the acquired service context.

Lifecycle methods can return `void`, `Promise<void>` or `Effect<void, E>`.
They are executed explicitly, not as parallel layer-construction side effects.
Native bootstrap services do not need to extend the legacy `Bootstrap`
implementation base.

Application services are acquired before the regular registration phase. Do not
put behavior that depends on other bootstrap registrations in constructors.
The application serializes start/restart/shutdown. Shutdown interrupts managed
operations, awaits feature cleanup and disposes application runtimes before the
preload runtime. Failed startup rolls back acquired resources.

## React and feature scopes

`useService(Key)` synchronously reads an acquired value. It does not construct
services during render, and React unmount does not dispose application services.
`useRuntime().runPromise(program)` is the boundary for running Effect operations.

Create a feature scope with explicit `Context` inputs. Application instances are
borrowed; scoped instances and their finalizers belong to that scope. Sibling and
nested scopes do not share acquired scoped instances. Dynamic action selection
contributes key-to-key aliases, not constructors or conditional resolvers.

For scoped layers, explicitly call `scope.serviceProvider.acquireService(Key)`
outside React rendering. For asynchronous layers, await
`scope.serviceProvider.acquireServiceAsync(Key)`
before rendering a consumer; subsequent `useService` / `getService` lookups are
synchronous. Mount the feature subtree under its scope's `ServiceProvider`.
Await `[Symbol.asyncDispose]()` when the owner supports asynchronous shutdown.
Synchronous owners can initiate `[Symbol.dispose]()`; application shutdown still
awaits pending cleanup. Operations started through a scope are interrupted when
it closes.
