/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

import { Bootstrap } from './Bootstrap.js';
import { Dependency } from './Dependency.js';
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

  private builder: ServiceContainerBuilder | null;
  private serviceProvider: IServiceProvider | null;

  constructor(plugins: PluginManifest[] = []) {
    this.plugins = plugins;
    this.onStart = new Executor<IStartData>(undefined, () => true);
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
        await service.register();
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
        await service.load();
      }
    }
  }
}
