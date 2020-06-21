/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap } from './Bootstrap';
import { DIContainer } from './DIContainer';
import { RootContainerService } from './entities/RootContainerService';
import { IServiceCollection, IServiceInjector } from './IApp';
import { IDiWrapper, inversifyWrapper } from './inversifyWrapper';
import { PluginManifest } from './PluginManifest';

export class App {
  private plugins: PluginManifest[];

  private diWrapper: IDiWrapper = inversifyWrapper;

  constructor(plugins: PluginManifest[] = []) {
    this.plugins = plugins;

    const rootContainerService = new RootContainerService(container => this.registerChildContainer(container));
    this.getServiceCollection().addServiceByToken(RootContainerService, rootContainerService);
  }

  registerChildContainer(container: DIContainer) {
    this.diWrapper.registerChildContainer(container);
  }

  addPlugin(manifest: PluginManifest) {
    this.plugins.push(manifest);
  }

  getServiceInjector(): IServiceInjector {
    return this.diWrapper.injector;
  }

  getServiceCollection(): IServiceCollection {
    return this.diWrapper.collection;
  }

  // first phase register all dependencies
  registerServices() {
    for (const plugin of this.plugins) {
      if (plugin.registerServices) {
        plugin.registerServices(this.getServiceCollection());
      }
      if (plugin.providers && plugin.providers.length) {
        plugin.providers.forEach((provider) => {
          // console.log('provider', provider.name);
          this.diWrapper.collection.addServiceByClass(provider);
        });
      }
    }
  }

  async initializeServices() {
    for (const plugin of this.plugins) {
      for (const service of plugin.providers) {
        if (service.prototype instanceof Bootstrap) {
          const serviceInstance = this.diWrapper.injector.getServiceByClass<Bootstrap>(service);

          if ('register' in serviceInstance) {
            await serviceInstance.register();
          }
        }
      }
    }
  }

  async loadServices() {
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

  // second phase - run init scripts todo run it based on dependency tree
  async initializePlugins() {
    for (const plugin of this.plugins) {
      if (plugin.initialize) {
        await plugin.initialize(this.getServiceInjector());
      }
    }
  }

  // third initialization phase? (never called)
  async load() {
    for (const plugin of this.plugins) {
      if (plugin.load) {
        // todo run it based on dependency tree
        await plugin.load();
      }
    }
  }
}
