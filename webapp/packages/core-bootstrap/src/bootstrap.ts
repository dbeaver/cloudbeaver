/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { configure } from 'mobx';

import { App, PluginManifest } from '@cloudbeaver/core-di';
import { SyncExecutor } from '@cloudbeaver/core-executor';

import { coreManifests } from './manifest';
import { renderLayout } from './renderLayout';

export async function bootstrap(plugins: PluginManifest[]): Promise<void> {
  configure({ enforceActions: 'never' });

  const app = new App([...coreManifests, ...plugins]);
  const render = renderLayout(app.getServiceInjector());
  const unmountExecutor = new SyncExecutor();

  unmountExecutor.addHandler(() => render.unmount());
  app.onStart.before(unmountExecutor);
  app.onStart.addHandler(() => render.renderApp());

  try {
    await app.start();
  } catch (exception) {
    render.renderError();
    throw exception;
  }
}
