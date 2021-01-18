/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { configure } from 'mobx';

import { App, PluginManifest } from '@cloudbeaver/core-di';

import { AppBootstrap } from './AppBootstrap';
import { showErrorPage } from './ErrorPage';
import { renderLayout } from './renderLayout';

export async function bootstrap(plugins: PluginManifest[]) {
  configure({ enforceActions: 'never' });
  const app = new App(plugins);
  app.registerServices();

  const appBootstrap = app.getServiceInjector().resolveServiceByClass(AppBootstrap);

  try {
    await app.initializeServices();
    await appBootstrap.register();
    await app.loadServices();
    await app.load();
    await app.initializePlugins();
    await appBootstrap.load();
    await appBootstrap.doAfterPluginsInit();
    await app.load();

    renderLayout(app.getServiceInjector());
  } catch (e) {
    console.log(e);
    showErrorPage();
    throw e;
  }
}
