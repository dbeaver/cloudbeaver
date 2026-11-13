/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';

import { AppScreenService } from './AppScreenService.js';

const SkipNavLinks = importLazyComponent(() => import('./SkipNavLinks.js').then(m => m.SkipNavLinks));

export class SkipNavServiceImpl {
  readonly extraLinks: PlaceholderContainer;

  constructor(private readonly appScreenService: AppScreenService) {
    this.extraLinks = new PlaceholderContainer();
  }

  registerLinks(): void {
    this.appScreenService.placeholder.add(SkipNavLinks, 0);
  }
}

export type SkipNavService = SkipNavServiceImpl;

export class SkipNavServiceDI extends Context.Service<SkipNavServiceDI, SkipNavServiceImpl>()(
  '@cloudbeaver/core-app/AppScreen/SkipNavService#SkipNavService',
) {
  static readonly implementation = SkipNavServiceImpl;

  static readonly dependencies = () => [AppScreenService] as const;
  static readonly make: Effect.Effect<SkipNavServiceImpl, never, Context.Service.Identifier<typeof AppScreenService>> = Effect.gen(
    function* makeSkipNavService() {
      const appScreenService = yield* AppScreenService;

      return new SkipNavServiceImpl(appScreenService);
    },
  );
  static readonly layer: Layer.Layer<SkipNavServiceDI, never, Context.Service.Identifier<typeof AppScreenService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SkipNavService = SkipNavServiceDI;
