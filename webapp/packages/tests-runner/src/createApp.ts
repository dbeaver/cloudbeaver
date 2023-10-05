/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { configure } from 'mobx';

import { App, IServiceInjector, PluginManifest } from '@cloudbeaver/core-di';

export interface IApplication {
  app: App;
  injector: IServiceInjector;
  init(): Promise<void>;
}

export function createApp(...plugins: PluginManifest[]): IApplication {
  (globalThis as any)._ROOT_URI_ = '{ROOT_URI}';
  (globalThis as any)._VERSION_ = '00.0.0';
  configure({ enforceActions: 'never' });

  const app = new App(plugins);
  const injector = app.getServiceInjector();

  //@ts-expect-error
  app.registerServices();

  return {
    app,
    injector,
    async init() {
      //@ts-expect-error
      await app.initializeServices();
      //@ts-expect-error
      await app.loadServices();
    },
  };
}
