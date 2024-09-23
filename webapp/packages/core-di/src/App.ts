/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

import { Bootstrap } from './Bootstrap.js';
import { Dependency } from './Dependency.js';
import type { DIContainer } from './DIContainer.js';
import type { IServiceCollection, IServiceConstructor } from './IApp.js';
import { type IDiWrapper, inversifyWrapper } from './inversifyWrapper.js';
import { IServiceProvider } from './IServiceProvider.js';
import type { PluginManifest } from './PluginManifest.js';

export interface IStartData {
  restart: boolean;
  preload: boolean;
}

export class App {
  readonly onStart: IExecutor<IStartData>;
  private readonly plugins: PluginManifest[];
  private readonly loadedServices: Map<PluginManifest, Set<IServiceConstructor<any>>>;
  private readonly diWrapper: IDiWrapper = inversifyWrapper;
  private isAppServiceBound: boolean;

  constructor(plugins: PluginManifest[] = []) {
    this.plugins = plugins;
    this.onStart = new Executor<IStartData>(undefined, () => true);
    this.loadedServices = new Map();
    this.isAppServiceBound = false;

    this.onStart.addHandler(async ({ restart, preload }) => {
      if (preload && restart) {
        this.dispose();
      }
      await this.registerServices(preload);
      await this.initializeServices(preload);
      await this.loadServices(preload);
    });

    makeObservable<this, 'loadedServices'>(this, {
      loadedServices: observable.shallow,
    });
  }

  async start(restart = false): Promise<void> {
    await this.onStart.execute({ preload: true, restart });
    await this.onStart.execute({ preload: false, restart });
  }

  async restart(): Promise<void> {
    await this.start(true);
  }

  dispose(): void {
    this.diWrapper.collection.unbindAll();
    this.isAppServiceBound = false;
  }

  getPlugins(): PluginManifest[] {
    return [...this.plugins];
  }

  getServices(plugin?: PluginManifest): Array<IServiceConstructor<any>> {
    if (plugin) {
      return [...(this.loadedServices.get(plugin) || [])];
    }
    return Array.from(this.loadedServices.values())
      .map(set => [...set])
      .flat();
  }

  registerChildContainer(container: DIContainer): void {
    this.diWrapper.registerChildContainer(container);
  }

  addPlugin(manifest: PluginManifest): void {
    this.plugins.push(manifest);
  }

  getServiceProvider(): IServiceProvider {
    return this.diWrapper.injector.resolveServiceByClass(IServiceProvider);
  }

  getServiceCollection(): IServiceCollection {
    return this.diWrapper.collection;
  }

  // first phase register all dependencies
  private async registerServices(preload?: boolean): Promise<void> {
    if (!this.isAppServiceBound) {
      this.getServiceCollection().addServiceByClass(App, this);
      this.getServiceCollection().addServiceByClass(IServiceProvider, new IServiceProvider(this.diWrapper.injector));
      this.isAppServiceBound = true;
    }

    for await (const service of this.getServicesAsync(preload)) {
      this.diWrapper.collection.addServiceByClass(service);
    }
  }

  private async initializeServices(preload?: boolean): Promise<void> {
    for await (const service of this.getServicesAsync(preload)) {
      if (service.prototype instanceof Bootstrap) {
        const serviceInstance = this.diWrapper.injector.getServiceByClass<Bootstrap>(service);

        if ('register' in serviceInstance) {
          await serviceInstance.register();
        }
      } else if (service.prototype instanceof Dependency) {
        this.diWrapper.injector.getServiceByClass<Dependency>(service);
      }
    }
  }

  private async loadServices(preload?: boolean): Promise<void> {
    for await (const service of this.getServicesAsync(preload)) {
      if (service.prototype instanceof Bootstrap) {
        const serviceInstance = this.diWrapper.injector.getServiceByClass<Bootstrap>(service);

        if ('load' in serviceInstance) {
          await serviceInstance.load();
        }
      }
    }
  }

  private async *getServicesAsync(preload?: boolean, concurrency = 20): AsyncGenerator<IServiceConstructor<any>> {
    let i = 0;
    let queue: Array<Promise<Array<IServiceConstructor<any>>>> = [];

    for (const plugin of this.plugins) {
      let servicesLoaders: Array<() => Promise<IServiceConstructor<any>>> = [];

      if (preload) {
        servicesLoaders = plugin.preload || [];
      } else {
        servicesLoaders = plugin.providers;
      }

      const loadedServices = this.loadedServices.get(plugin) || (observable(new Set(), { deep: false }) as Set<IServiceConstructor<any>>);
      this.loadedServices.set(plugin, loadedServices);

      queue.push(
        (async function loader() {
          const services = (await Promise.all(servicesLoaders.map(serviceLoader => serviceLoader()))).flat();

          for (const service of services) {
            loadedServices.add(service);
          }

          return services;
        })(),
      );
      i++;

      if (i >= concurrency) {
        const services = (await Promise.all(queue)).flat();

        for (const service of services) {
          yield service;
        }

        queue = [];
        i = 0;
      }
    }

    if (queue.length > 0) {
      const services = (await Promise.all(queue)).flat();

      for (const service of services) {
        yield service;
      }
    }
  }
}
