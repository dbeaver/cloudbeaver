/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Exit, Layer, ManagedRuntime, Option, Scope } from 'effect';

import { composeServiceLayers } from './composeServiceLayers.js';
import { IServiceProvider, type IServiceScope, type IServiceScopeOptions } from './IServiceProvider.js';
import type { ServiceType } from './Service.js';

export class EffectServiceProvider implements IServiceProvider {
  private context: Context.Context<any>;
  private baseContext: Context.Context<any>;
  private runtime: ManagedRuntime.ManagedRuntime<any, unknown> | null = null;
  private readonly scopes = new Set<EffectServiceScope>();
  private readonly tasks = new Map<AbortController, Promise<unknown>>();
  private disposed = false;

  constructor(
    private readonly scoped: ReadonlyMap<string, ServiceType> = new Map(),
    context: Context.Context<any> = Context.empty() as Context.Context<any>,
    private readonly scope?: Scope.Closeable,
    private readonly aliases: NonNullable<IServiceScopeOptions['aliases']> = new Map(),
    private readonly memoMap = Layer.makeMemoMapUnsafe(),
  ) {
    this.context = Context.add(context, IServiceProvider, this);
    this.baseContext = this.context;
  }

  setRuntime(runtime: ManagedRuntime.ManagedRuntime<any, unknown>, context: Context.Context<any>): void {
    this.runtime = runtime;
    this.context = Context.add(context, IServiceProvider, this);
    this.baseContext = this.context;
  }

  getService<T>(key: ServiceType<T>): T {
    this.assertActive();
    const value = Context.getOption(this.context, key);

    if (Option.isSome(value)) {
      return value.value;
    }

    throw new Error(`Service ${key.key} is not available in this context; acquire it before lookup`);
  }

  acquireService<T>(key: ServiceType<T>, context?: Context.Context<any>): T {
    return Effect.runSync(this.acquire(key, context));
  }

  async acquireServiceAsync<T>(key: ServiceType<T>, context?: Context.Context<any>): Promise<T> {
    return await this.runPromise(this.acquire(key, context));
  }

  private acquire<T>(key: ServiceType<T>, context?: Context.Context<any>): Effect.Effect<T, unknown> {
    this.assertActive();

    if (context) {
      if (!this.scope) {
        throw new Error('External inputs must be provided in a feature scope');
      }

      this.context = Context.merge(this.context, context);
      this.baseContext = Context.merge(this.baseContext, context);
    }

    const value = Context.getOption(this.context, key);

    if (Option.isSome(value)) {
      return Effect.succeed(value.value);
    }

    if (!this.scope) {
      throw new Error(`Service ${key.key} is not available in the application context`);
    }

    const aliases = typeof this.aliases === 'function' ? this.aliases() : this.aliases;
    const layer = composeServiceLayers([key], this.scoped, this.context, aliases);

    return Layer.buildWithMemoMap(layer, this.memoMap, this.scope).pipe(
      Effect.map(acquired => {
        this.assertActive();
        this.context = Context.merge(this.context, acquired);

        return Context.get(this.context, key);
      }),
    );
  }

  createScope(options: IServiceScopeOptions = {}): IServiceScope {
    this.assertActive();
    const scope = Scope.makeUnsafe();
    const context = options.context ? Context.merge(this.baseContext, options.context) : this.baseContext;
    const provider = new EffectServiceProvider(this.scoped, context, scope, options.aliases);
    provider.runtime = this.runtime;
    const handle = new EffectServiceScope(provider, scope, () => this.scopes.delete(handle));
    this.scopes.add(handle);

    return handle;
  }

  async runPromise<A, E, R>(effect: Effect.Effect<A, E, R>): Promise<A> {
    this.assertActive();

    if (!this.runtime) {
      throw new Error('The application runtime is not ready');
    }

    const controller = new AbortController();
    const task = this.runtime.runPromise(Effect.provideContext(effect, this.context), { signal: controller.signal });
    this.tasks.set(controller, task);

    try {
      return await task;
    } finally {
      this.tasks.delete(controller);
    }
  }

  disposeScopes(): Promise<void> | undefined {
    this.disposed = true;
    const tasks = [...this.tasks];
    this.context = Context.empty() as Context.Context<any>;
    this.baseContext = this.context;
    this.runtime = null;

    for (const [controller] of tasks) {
      controller.abort();
    }

    const closeChildren = async () => {
      const results = await Promise.allSettled([...this.scopes].map(scope => scope[Symbol.asyncDispose]()));
      this.scopes.clear();
      const errors = results.filter(result => result.status === 'rejected').map(result => result.reason);

      if (errors.length > 0) {
        throw new AggregateError(errors, 'Failed to close service scopes');
      }
    };

    if (tasks.length > 0) {
      return Promise.allSettled(tasks.map(([, task]) => task)).then(closeChildren);
    }

    return this.scopes.size > 0 ? closeChildren() : undefined;
  }

  private assertActive(): void {
    if (this.disposed) {
      throw new Error('Service context has been disposed');
    }
  }
}

class EffectServiceScope implements IServiceScope {
  private disposal: Promise<void> | undefined;

  constructor(
    readonly serviceProvider: EffectServiceProvider,
    private readonly scope: Scope.Closeable,
    private readonly onClosed: () => void,
  ) {}

  [Symbol.dispose](): void {
    // Synchronous UI owners initiate closure; application shutdown awaits it.
    void this[Symbol.asyncDispose]().catch(error => console.error('Failed to dispose a service scope', error));
  }

  [Symbol.asyncDispose](): Promise<void> {
    return (this.disposal ??= this.close());
  }

  private close(): Promise<void> {
    const children = this.serviceProvider.disposeScopes();
    const waitForChildren = children ? Effect.promise(() => children) : Effect.void;

    // With no pending work, start finalizers in the current turn. In particular,
    // removed data-viewer actions must unsubscribe before the next result event.
    return Effect.runPromise(waitForChildren.pipe(Effect.ensuring(Scope.close(this.scope, Exit.void)))).then(() => this.onClosed());
  }
}
