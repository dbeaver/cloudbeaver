/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Context, Effect, Layer, ManagedRuntime } from 'effect';

import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

import { composeServiceLayers } from './composeServiceLayers.js';
import { EffectServiceProvider } from './EffectServiceProvider.js';
import { IServiceProvider } from './IServiceProvider.js';
import { ModuleRegistry, type IModule, type IServiceLifecycle } from './ModuleRegistry.js';
import type { ServiceType } from './Service.js';

export interface IStartData {
  restart: boolean;
  preload: boolean;
}

export const AppService = Context.Service<App>('@cloudbeaver/core-di/App');

export class App {
  readonly onStart: IExecutor<IStartData>;
  private readonly modules: IModule[];
  private serviceProvider: EffectServiceProvider | null = null;
  private readonly runtimes: ManagedRuntime.ManagedRuntime<any, unknown>[] = [];
  private context: Context.Context<any> = Context.empty() as Context.Context<any>;
  private services: readonly ServiceType[] = [];
  private definitions = new Map<string, ServiceType>();
  private bootstraps: readonly ServiceType<IServiceLifecycle>[] = [];
  private preloads: readonly ServiceType<IServiceLifecycle>[] = [];
  private initialized = false;
  private loaded = false;
  private lifecycle: Promise<void> = Promise.resolve();

  constructor(plugins: IModule[] = []) {
    this.modules = plugins;
    this.onStart = new Executor<IStartData>(undefined, () => true);
    this.onStart.addHandler(async ({ restart, preload }) => {
      if (preload && restart) {
        await this.closeRuntime();
      }

      try {
        await this.registerServices(preload);
        await this.initializeServices(preload);
        await this.loadServices(preload);
      } catch (error) {
        try {
          await this.closeRuntime();
        } catch (cleanupError) {
          throw new AggregateError([error, cleanupError], 'Application startup and cleanup failed', { cause: error });
        }

        throw error;
      }
    });
  }

  async start(restart = false): Promise<void> {
    await this.enqueue(async () => {
      if (this.loaded && !restart) {
        return;
      }

      await this.onStart.execute({ preload: true, restart });
      await this.onStart.execute({ preload: false, restart });
    });
  }

  async restart(): Promise<void> {
    await this.start(true);
  }

  async unload(): Promise<void> {
    await this.enqueue(() => this.closeRuntime());
  }

  private enqueue(operation: () => Promise<void>): Promise<void> {
    const result = this.lifecycle.then(operation);
    this.lifecycle = result.catch(() => undefined);

    return result;
  }

  private async closeRuntime(): Promise<void> {
    const provider = this.serviceProvider;
    const runtimes = this.runtimes.splice(0).reverse();
    this.serviceProvider = null;
    this.context = Context.empty() as Context.Context<any>;
    this.initialized = false;
    this.loaded = false;
    const errors: unknown[] = [];

    try {
      await provider?.disposeScopes();
    } catch (error) {
      errors.push(error);
    }

    for (const runtime of runtimes) {
      try {
        await runtime.dispose();
      } catch (error) {
        errors.push(error);
      }
    }

    if (errors.length > 0) {
      throw new AggregateError(errors, 'Failed to dispose the application runtime');
    }
  }

  addModule(module: IModule): void {
    if (this.serviceProvider) {
      throw new Error('Modules must be added before starting the application');
    }

    this.modules.push(module);
  }

  getServiceProvider(): IServiceProvider | null {
    return this.serviceProvider;
  }

  private async registerServices(preload = false): Promise<void> {
    if (!this.serviceProvider) {
      const modules = this.modules.length > 0 ? this.modules : [...ModuleRegistry];
      this.preloads = modules.flatMap(module => [...(module.preloads?.() ?? [])]);
      this.bootstraps = modules.flatMap(module => [...(module.bootstraps?.() ?? [])]);
      this.services = modules.flatMap(module => [...(module.services?.() ?? []), ...(module.bootstraps?.() ?? []), ...(module.preloads?.() ?? [])]);
      this.definitions = new Map(this.services.map(service => [service.key, service]));
      const scoped = new Map(modules.flatMap(module => [...(module.scoped?.() ?? [])]).map(service => [service.key, service]));
      this.serviceProvider = new EffectServiceProvider(scoped);
      this.context = Context.make(IServiceProvider, this.serviceProvider).pipe(Context.add(AppService, this));
      // Validate the complete application graph without constructing services or
      // running preload side effects. Feature inputs are supplied by their scopes.
      composeServiceLayers(this.services, this.definitions, this.context);
    }

    if (this.initialized || (preload && this.runtimes.length > 0)) {
      return;
    }

    const roots = preload ? this.preloads : this.services;
    const layer = composeServiceLayers(roots, this.definitions, this.context).pipe(Layer.provideMerge(Layer.succeedContext(this.context)));
    const runtime = ManagedRuntime.make(layer);
    this.runtimes.push(runtime);
    this.context = await runtime.context();
    this.serviceProvider.setRuntime(runtime, this.context);

    if (!preload) {
      this.initialized = true;
    }
  }

  private async initializeServices(preload = false): Promise<void> {
    await this.runLifecycle(preload ? this.preloads : this.bootstraps, 'register');
  }

  private async loadServices(preload = false): Promise<void> {
    await this.runLifecycle(preload ? this.preloads : this.bootstraps, 'load');

    if (!preload) {
      this.loaded = true;
    }
  }

  private async runLifecycle(services: readonly ServiceType<IServiceLifecycle>[], phase: 'register' | 'load'): Promise<void> {
    const provider = this.serviceProvider;

    if (!provider) {
      throw new Error('Service context is not initialized');
    }

    for (const key of services) {
      const service = provider.getService(key);
      await provider.runPromise(
        Effect.suspend(() => {
          const result = service[phase]?.();
          return Effect.isEffect(result) ? result : Effect.promise(() => Promise.resolve(result));
        }),
      );
    }
  }
}
