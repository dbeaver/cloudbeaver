/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap } from './Bootstrap';
import { Dependency } from './Dependency';
import type { DIContainer } from './DIContainer';
import type { IServiceCollection, IServiceInjector } from './IApp';
import { IDiWrapper, inversifyWrapper } from './inversifyWrapper';
import type { PluginManifest } from './PluginManifest';

export class App {
  private readonly plugins: PluginManifest[];

  private readonly diWrapper: IDiWrapper = inversifyWrapper;

  constructor(plugins: PluginManifest[] = []) {
    this.plugins = plugins;

    this.getServiceCollection().addServiceByClass(App, this);
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
  registerServices(): void {
    for (const plugin of this.plugins) {
      if (plugin.providers.length) {
        plugin.providers.forEach(provider => {
          // console.log('provider', provider.name);
          this.diWrapper.collection.addServiceByClass(provider);
        });
      }
    }
  }

  async initializeServices(): Promise<void> {
    for (const plugin of this.plugins) {
      for (const service of plugin.providers) {
        if (service.prototype instanceof Bootstrap) {
          const serviceInstance = this.diWrapper.injector.getServiceByClass<Bootstrap>(service);

          if ('register' in serviceInstance) {
            await serviceInstance.register();
          }
        } else if (service.prototype instanceof Dependency) {
          this.diWrapper.injector.getServiceByClass<Bootstrap>(service);
        }
      }
    }
  }

  async loadServices(): Promise<void> {
    for (const plugin of this.plugins) {
      for (const service of plugin.providers) {
        if (service.prototype instanceof Bootstrap) {
          const serviceInstance = this.diWrapper.injector.getServiceByClass<Bootstrap>(service);

          if ('load' in serviceInstance) {
            await serviceInstance.load();
          }
        }
      }
    }
  }
}
