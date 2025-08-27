/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

import { Bootstrap } from './Bootstrap.js';
import { Dependency } from './Dependency.js';
import type { IServiceConstructor } from './IApp.js';
import { IServiceProvider } from './IServiceProvider.js';
import type { PluginManifest } from './PluginManifest.js';
import { ModuleRegistry, ServiceContainerBuilder } from '@wroud/di';
import { IPreloadService } from './IPreloadService.js';

export interface IStartData {
  restart: boolean;
  preload: boolean;
}

export class App {
  readonly onStart: IExecutor<IStartData>;
  private readonly plugins: PluginManifest[];
  private readonly loadedServices: Map<PluginManifest, Set<IServiceConstructor<any>>>;

  private builder: ServiceContainerBuilder | null;
  private serviceProvider: IServiceProvider | null;

  constructor(plugins: PluginManifest[] = []) {
    this.plugins = plugins;
    this.onStart = new Executor<IStartData>(undefined, () => true);
    this.loadedServices = new Map();
    this.serviceProvider = null;
    this.builder = null;

    this.onStart.addHandler(async ({ restart, preload }) => {
      if (preload && restart) {
        this.unload();
      }
      await this.registerServices();
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

  unload(): void {
    this.serviceProvider?.[Symbol.dispose]?.();
    this.serviceProvider = null;
    this.builder = null;
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

  addPlugin(manifest: PluginManifest): void {
    this.plugins.push(manifest);
  }

  getServiceProvider(): IServiceProvider | null {
    return this.serviceProvider;
  }

  // first phase register all dependencies
  private async registerServices(): Promise<void> {
    if (!this.builder) {
      this.builder = new ServiceContainerBuilder();
      this.builder.addSingleton(App, this);

      for (const module of ModuleRegistry) {
        await module.configure(this.builder);
      }

      await this.builder.validate();
      this.serviceProvider = this.builder.build();
    }
  }

  private async initializeServices(preload: boolean): Promise<void> {
    if (!this.serviceProvider) {
      throw new Error('Service provider is not initialized');
    }

    if (preload) {
      for (const service of this.serviceProvider.getServices(IPreloadService)) {
        await service.register?.();
      }
    } else {
      for (const service of this.serviceProvider.getServices(Bootstrap)) {
        if ('register' in service) {
          await service.register();
        }
      }

      this.serviceProvider.getServices(Dependency);
    }
  }

  private async loadServices(preload: boolean): Promise<void> {
    if (!this.serviceProvider) {
      throw new Error('Service provider is not initialized');
    }

    if (preload) {
      for (const service of this.serviceProvider.getServices(IPreloadService)) {
        await service.load?.();
      }
    } else {
      for (const service of this.serviceProvider.getServices(Bootstrap)) {
        if ('load' in service) {
          await service.load();
        }
      }
    }
  }
}
