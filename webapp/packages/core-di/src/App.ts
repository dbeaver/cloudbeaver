/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Executor, IExecutor } from '@cloudbeaver/core-executor';

import { Bootstrap } from './Bootstrap';
import { Dependency } from './Dependency';
import type { DIContainer } from './DIContainer';
import type { IServiceCollection, IServiceConstructor, IServiceInjector } from './IApp';
import { IDiWrapper, inversifyWrapper } from './inversifyWrapper';
import type { PluginManifest } from './PluginManifest';

export interface IStartData {
  preload: boolean;
}

export class App {
  readonly onStart: IExecutor<IStartData>;
  private readonly plugins: PluginManifest[];
  private readonly diWrapper: IDiWrapper = inversifyWrapper;

  constructor(plugins: PluginManifest[] = []) {
    this.plugins = plugins;
    this.onStart = new Executor();

    this.getServiceCollection().addServiceByClass(App, this);
    this.onStart.addHandler(async ({ preload }) => {
      await this.registerServices(preload);
      await this.initializeServices(preload);
      await this.loadServices(preload);
    });
  }

  async preload(): Promise<void> {
    await this.onStart.execute({ preload: true });
  }

  async start(): Promise<void> {
    await this.onStart.execute({ preload: false });
  }

  async restart(): Promise<void> {
    this.dispose();
    await this.start();
  }

  dispose(): void {
    this.diWrapper.collection.unbindAll();
  }

  getPlugins(): PluginManifest[] {
    return [...this.plugins];
  }

  getServices(preload?: boolean): Array<() => Promise<IServiceConstructor<any>>> {
    return this.plugins.map(plugin => (preload ? plugin.preload || [] : plugin.providers)).flat();
  }

  registerChildContainer(container: DIContainer): void {
    this.diWrapper.registerChildContainer(container);
  }

  addPlugin(manifest: PluginManifest): void {
    this.plugins.push(manifest);
  }

  getServiceInjector(): IServiceInjector {
    return this.diWrapper.injector;
  }

  getServiceCollection(): IServiceCollection {
    return this.diWrapper.collection;
  }

  // first phase register all dependencies
  private async registerServices(preload?: boolean): Promise<void> {
    for (const serviceLoader of this.getServices(preload)) {
      const service = await serviceLoader();
      this.diWrapper.collection.addServiceByClass(service);
    }
  }

  private async initializeServices(preload?: boolean): Promise<void> {
    for (const serviceLoader of this.getServices(preload)) {
      const service = await serviceLoader();
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
    for (const serviceLoader of this.getServices(preload)) {
      const service = await serviceLoader();
      if (service.prototype instanceof Bootstrap) {
        const serviceInstance = this.diWrapper.injector.getServiceByClass<Bootstrap>(service);

        if ('load' in serviceInstance) {
          await serviceInstance.load();
        }
      }
    }
  }
}
