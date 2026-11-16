/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ServiceWorkerService } from '@cloudbeaver/core-browser';
import { Context, Effect, Layer, displayUpdateStatus, disposeService, type IPreloadService } from '@cloudbeaver/core-di';

export class PluginBrowserPreloadingBootstrapImpl implements IPreloadService {
  constructor(private readonly serviceWorkerService: ServiceWorkerService) {}
  register(): void {
    this.serviceWorkerService.onUpdate.addHandler(({ type, progress }) => {
      progress = progress || 0;

      switch (type) {
        case 'installing':
          displayUpdateStatus(progress, 'Installing...');
          break;
        case 'updating':
          displayUpdateStatus(progress, 'Updating...');
          break;
        case 'finished':
          break;
      }
    });
  }
}

export type PluginBrowserPreloadingBootstrap = PluginBrowserPreloadingBootstrapImpl;

export class PluginBrowserPreloadingBootstrapDI extends Context.Service<PluginBrowserPreloadingBootstrapDI, PluginBrowserPreloadingBootstrapImpl>()(
  '@cloudbeaver/plugin-browser/PluginBrowserPreloadingBootstrap#PluginBrowserPreloadingBootstrap',
) {
  static readonly implementation = PluginBrowserPreloadingBootstrapImpl;

  static readonly dependencies = () => [ServiceWorkerService] as const;
  static readonly make: Effect.Effect<PluginBrowserPreloadingBootstrapImpl, never, Context.Service.Identifier<typeof ServiceWorkerService>> =
    Effect.gen(function* makePluginBrowserPreloadingBootstrap() {
      const serviceWorkerService = yield* ServiceWorkerService;

      return new PluginBrowserPreloadingBootstrapImpl(serviceWorkerService);
    });
  static readonly layer: Layer.Layer<PluginBrowserPreloadingBootstrapDI, never, Context.Service.Identifier<typeof ServiceWorkerService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const PluginBrowserPreloadingBootstrap = PluginBrowserPreloadingBootstrapDI;
