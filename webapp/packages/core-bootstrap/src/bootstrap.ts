/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { configure } from 'mobx';

import { App, type PluginManifest } from '@cloudbeaver/core-di';
import { executionExceptionContext, SyncExecutor } from '@cloudbeaver/core-executor';

import { coreManifests } from './manifest.js';

export async function bootstrap(plugins: PluginManifest[]): Promise<App> {
  configure({ enforceActions: 'never' });

  const app = new App([...coreManifests, ...plugins]);
  (window as any).internalRestartApp = () => app.restart();
  let exception: Error | null = null;

  try {
    await app.start();
  } catch (e: any) {
    exception = e;
  }

  const { renderLayout } = await import('./renderLayout.js');
  const render = renderLayout(app.getServiceProvider());
  const unmountExecutor = new SyncExecutor();

  unmountExecutor.addHandler(() => render.unmount());
  app.onStart.before(unmountExecutor, undefined, data => data.preload);
  app.onStart.addHandler(({ preload }) => {
    if (!preload) {
      render.renderApp();
    }
  });
  app.onStart.addPostHandler((_, context) => {
    const exception = context.getContext(executionExceptionContext);

    if (exception.exception) {
      render.renderError(exception.exception);
    }
  });

  if (exception) {
    render.renderError(exception);
  } else {
    render.renderApp();
  }

  return app;
}
