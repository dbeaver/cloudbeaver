/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IPreloadService, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { ServiceWorkerService } from './ServiceWorkerService.js';

export class ServiceWorkerBootstrapImpl implements IPreloadService {
  constructor(private readonly serviceWorkerService: ServiceWorkerService) {}
  async register(): Promise<void> {
    await this.serviceWorkerService.register();
  }
  async load(): Promise<void> {
    await this.serviceWorkerService.load();
  }
}

export type ServiceWorkerBootstrap = ServiceWorkerBootstrapImpl;

export class ServiceWorkerBootstrapDI extends Context.Service<ServiceWorkerBootstrapDI, ServiceWorkerBootstrapImpl>()(
  '@cloudbeaver/core-browser/ServiceWorkerBootstrap#ServiceWorkerBootstrap',
) {
  static readonly implementation = ServiceWorkerBootstrapImpl;

  static readonly dependencies = () => [ServiceWorkerService] as const;
  static readonly make: Effect.Effect<ServiceWorkerBootstrapImpl, never, Context.Service.Identifier<typeof ServiceWorkerService>> = Effect.gen(
    function* makeServiceWorkerBootstrap() {
      const serviceWorkerService = yield* ServiceWorkerService;

      return new ServiceWorkerBootstrapImpl(serviceWorkerService);
    },
  );
  static readonly layer: Layer.Layer<ServiceWorkerBootstrapDI, never, Context.Service.Identifier<typeof ServiceWorkerService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ServiceWorkerBootstrap = ServiceWorkerBootstrapDI;
