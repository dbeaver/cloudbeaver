/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { Context, Effect, Layer, disposeService } from './Service.js';

import { App } from './App.js';
import { Disposable } from './Disposable.js';
import { IServiceProvider } from './IServiceProvider.js';
import type { IModule } from './ModuleRegistry.js';

const applications: App[] = [];

function createApp(module: IModule): App {
  const app = new App([module]);
  applications.push(app);

  return app;
}

afterEach(async () => {
  await Promise.all(applications.splice(0).map(app => app.unload()));
});

describe('Effect application lifecycle', () => {
  it('preserves preload barriers and runs every register before any load', async () => {
    const events: string[] = [];

    class Preload extends Context.Service<Preload, { register(): void; load(): Promise<void> }>()('test/lifecycle/preload') {
      static readonly layer = Layer.succeed(this, {
        register: () => {
          events.push('preload.register');
        },
        load: async () => {
          await Promise.resolve();
          events.push('preload.load');
        },
      });
    }

    class First extends Context.Service<
      First,
      {
        register(): Effect.Effect<void>;
        load(): Effect.Effect<void>;
      }
    >()('test/lifecycle/first') {
      static readonly layer = Layer.effect(
        this,
        Effect.sync(() => {
          expect(events).toEqual(['preload.register', 'preload.load']);
          return {
            register: () =>
              Effect.sync(() => {
                events.push('first.register');
              }),
            load: () =>
              Effect.sync(() => {
                events.push('first.load');
              }),
          };
        }),
      );
    }

    class Second extends Context.Service<Second, { register(): void; load(): void }>()('test/lifecycle/second') {
      static readonly layer = Layer.succeed(this, {
        register: () => {
          events.push('second.register');
        },
        load: () => {
          events.push('second.load');
        },
      });
    }

    const app = createApp({ name: 'lifecycle', preloads: () => [Preload], bootstraps: () => [First, Second] });

    await app.start();
    await app.start();

    expect(events).toEqual(['preload.register', 'preload.load', 'first.register', 'second.register', 'first.load', 'second.load']);
  });

  it('shares dependencies, supports Effect methods and rebuilds only after awaited disposal', async () => {
    const events: string[] = [];
    let generation = 0;

    class Shared extends Context.Service<Shared, { generation: number }>()('test/runtime/shared') {
      static readonly layer = Layer.effect(
        this,
        Effect.acquireRelease(
          Effect.sync(() => ({ generation: ++generation })),
          value =>
            Effect.promise(async () => {
              await Promise.resolve();
              events.push(`disposed:${value.generation}`);
            }),
        ),
      );
    }

    class Consumer extends Context.Service<
      Consumer,
      {
        shared: Context.Service.Shape<typeof Shared>;
        read(): Effect.Effect<number>;
      }
    >()('test/runtime/consumer') {
      static readonly dependencies = () => [Shared];
      static readonly layer = Layer.effect(
        this,
        Effect.gen(function* makeConsumer() {
          const shared = yield* Shared;
          return { shared, read: () => Effect.succeed(shared.generation) };
        }),
      );
    }

    const app = createApp({ name: 'runtime', services: () => [Shared, Consumer] });
    await app.start();
    const provider = app.getServiceProvider()!;
    const consumer = provider.getService(Consumer);

    expect(consumer.shared).toBe(provider.getService(Shared));
    expect(await provider.runPromise(consumer.read())).toBe(1);
    expect(provider.getService(IServiceProvider)).toBe(provider);

    await app.restart();
    expect(events).toEqual(['disposed:1']);
    expect(app.getServiceProvider()!.getService(Shared).generation).toBe(2);
    expect(() => provider.getService(Shared)).toThrow('disposed');

    await app.unload();
    await app.unload();
    expect(events).toEqual(['disposed:1', 'disposed:2']);
  });

  it('rolls back acquired services when a bootstrap fails', async () => {
    let disposed = 0;

    class Resource extends Context.Service<Resource, object>()('test/rollback/resource') {
      static readonly layer = Layer.effect(
        this,
        Effect.acquireRelease(Effect.succeed({}), () =>
          Effect.sync(() => {
            disposed++;
          }),
        ),
      );
    }

    class Failing extends Context.Service<Failing, { load(): Effect.Effect<never, Error> }>()('test/rollback/failing') {
      static readonly dependencies = () => [Resource];
      static readonly layer = Layer.effect(
        this,
        Effect.gen(function* makeFailingBootstrap() {
          yield* Resource;
          return { load: () => Effect.fail(new Error('startup failed')) };
        }),
      );
    }

    const app = createApp({ name: 'rollback', services: () => [Resource], bootstraps: () => [Failing] });

    await expect(app.start()).rejects.toThrow('startup failed');
    expect(disposed).toBe(1);
    expect(app.getServiceProvider()).toBeNull();
  });

  it('does not create services when a declared dependency is missing', async () => {
    let constructed = false;

    class Missing extends Context.Service<Missing, object>()('test/missing/input') {}

    class Consumer extends Context.Service<Consumer, object>()('test/missing/consumer') {
      static readonly dependencies = () => [Missing];
      static readonly layer = Layer.effect(
        this,
        Effect.gen(function* makeMissingConsumer() {
          yield* Missing;
          constructed = true;

          return {};
        }),
      );
    }

    const app = createApp({ name: 'missing', services: () => [Consumer] });

    await expect(app.start()).rejects.toThrow('test/missing/input');
    expect(constructed).toBe(false);
  });

  it('serializes simultaneous starts and awaits an asynchronous service constructor', async () => {
    let constructed = 0;
    let registered = 0;

    class AsyncService extends Context.Service<AsyncService, { register(): Effect.Effect<void> }>()('test/concurrent/service') {
      static readonly layer = Layer.effect(
        this,
        Effect.promise(async () => {
          await Promise.resolve();
          constructed++;

          return {
            register: () =>
              Effect.sync(() => {
                registered++;
              }),
          };
        }),
      );
    }

    const app = createApp({ name: 'concurrent', bootstraps: () => [AsyncService] });

    await Promise.all([app.start(), app.start()]);

    expect(constructed).toBe(1);
    expect(registered).toBe(1);
    expect(app.getServiceProvider()!.getService(AsyncService)).toBeDefined();
  });
});

describe('Effect feature scopes', () => {
  it('starts synchronous model cleanup immediately when a UI owner closes its scope', async () => {
    let released = false;

    class Model extends Disposable {
      protected override dispose(): void {
        released = true;
      }
    }

    class ScopedModel extends Context.Service<ScopedModel, Model>()('test/synchronous-scope/model') {
      static readonly layer = Layer.effect(
        this,
        Effect.acquireRelease(
          Effect.sync(() => new Model()),
          model => Effect.promise(() => disposeService(model)),
        ),
      );
    }

    const app = createApp({ name: 'synchronous-scope', scoped: () => [ScopedModel] });
    await app.start();
    const scope = app.getServiceProvider()!.createScope();
    scope.serviceProvider.acquireService(ScopedModel);

    scope[Symbol.dispose]();

    expect(released).toBe(true);
    await scope[Symbol.asyncDispose]();
  });

  it('acquires asynchronous scoped services before synchronous UI lookup and interrupts scoped work on close', async () => {
    class AsyncScoped extends Context.Service<AsyncScoped, object>()('test/async-scoped/value') {
      static readonly layer = Layer.effect(
        this,
        Effect.promise(async () => {
          await Promise.resolve();
          return {};
        }),
      );
    }

    const app = createApp({ name: 'async-scoped', scoped: () => [AsyncScoped] });
    await app.start();
    const scope = app.getServiceProvider()!.createScope();
    const value = await scope.serviceProvider.acquireServiceAsync(AsyncScoped);

    expect(scope.serviceProvider.getService(AsyncScoped)).toBe(value);

    const running = scope.serviceProvider.runPromise(Effect.never);
    const interrupted = expect(running).rejects.toBeDefined();
    await scope[Symbol.asyncDispose]();
    await interrupted;
  });

  it('isolates scoped values, aliases and inputs while borrowing application singletons', async () => {
    let finalized = 0;

    class Input extends Context.Service<Input, string>()('test/scopes/input') {}

    class Singleton extends Context.Service<Singleton, object>()('test/scopes/singleton') {
      static readonly layer = Layer.succeed(this, {});
    }

    class Scoped extends Context.Service<Scoped, { input: string; singleton: object; provider: IServiceProvider }>()('test/scopes/value') {
      static readonly dependencies = () => [Input, Singleton, IServiceProvider];
      static readonly layer = Layer.effect(
        this,
        Effect.acquireRelease(
          Effect.gen(function* makeScopedValue() {
            return { input: yield* Input, singleton: yield* Singleton, provider: yield* IServiceProvider };
          }),
          () =>
            Effect.sync(() => {
              finalized++;
            }),
        ),
      );
    }

    class Alias extends Context.Service<Alias, Context.Service.Shape<typeof Scoped>>()('test/scopes/alias') {}

    const app = createApp({ name: 'scopes', services: () => [Singleton], scoped: () => [Scoped] });
    await app.start();
    const provider = app.getServiceProvider()!;
    const first = provider.createScope({ context: Context.make(Input, 'first'), aliases: new Map([[Alias.key, Scoped]]) });
    const second = provider.createScope({ context: Context.make(Input, 'second') });

    expect(() => first.serviceProvider.getService(Scoped)).toThrow('not available');

    const a = first.serviceProvider.acquireService(Alias);
    const b = second.serviceProvider.acquireService(Scoped);
    expect(a).toBe(first.serviceProvider.getService(Scoped));
    expect(a).not.toBe(b);
    expect(a.input).toBe('first');
    expect(b.input).toBe('second');
    expect(a.singleton).toBe(provider.getService(Singleton));
    expect(a.provider).toBe(first.serviceProvider);
    expect(() => provider.getService(Scoped)).toThrow('not available');

    const child = first.serviceProvider.createScope();
    expect(child.serviceProvider.acquireService(Scoped)).not.toBe(a);

    await first[Symbol.asyncDispose]();
    expect(finalized).toBe(2);
    expect(() => first.serviceProvider.getService(Scoped)).toThrow('disposed');
    await app.unload();
    expect(finalized).toBe(3);
  });

  it('uses an explicit factory for models with caller-owned lifetimes', async () => {
    let generation = 0;

    class Factory extends Context.Service<Factory, { create(): { generation: number } }>()('test/factory/model') {
      static readonly layer = Layer.succeed(this, { create: () => ({ generation: ++generation }) });
    }

    const app = createApp({ name: 'factory', services: () => [Factory] });
    await app.start();
    const provider = app.getServiceProvider()!;

    expect(provider.getService(Factory).create().generation).toBe(1);
    expect(provider.getService(Factory).create().generation).toBe(2);
  });
});
