/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterAll, beforeAll } from 'vitest';
import { configure } from 'mobx';

import { App, IServiceProvider, type PluginManifest } from '@cloudbeaver/core-di';

import './__custom_mocks__/mockKnownConsoleMessages.js';

export interface IApplication {
  app: App;
  serviceProvider: IServiceProvider;
  init(): Promise<void>;
  dispose(): void;
}

export function createApp(...plugins: PluginManifest[]): IApplication {
  (globalThis as any)._ROOT_URI_ = '{ROOT_URI}';
  (globalThis as any)._VERSION_ = '00.0.0';
  configure({ enforceActions: 'never' });

  const app = new App(plugins);

  beforeAll(async () => {
    await app.start();
  });
  afterAll(() => {
    app.dispose();
  });

  return {
    app,
    get serviceProvider() {
      return app.getServiceProvider();
    },
    async init() {
      await app.start();
    },
    dispose() {
      app.dispose();
    },
  };
}
