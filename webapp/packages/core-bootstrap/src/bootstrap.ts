/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { configure } from 'mobx';

import { App, PluginManifest } from '@cloudbeaver/core-di';

import { showErrorPage } from './ErrorPage';
import { coreManifests } from './manifest';
import { renderLayout } from './renderLayout';

export async function bootstrap(plugins: PluginManifest[]): Promise<void> {
  configure({ enforceActions: 'never' });

  const app = new App([...coreManifests, ...plugins]);
  app.registerServices();

  try {
    await app.initializeServices();
    await app.loadServices();

    renderLayout(app.getServiceInjector());
  } catch (e: any) {
    console.error(e);
    showErrorPage();
    throw e;
  }
}
