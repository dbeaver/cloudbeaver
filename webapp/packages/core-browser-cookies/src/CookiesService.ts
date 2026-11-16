/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { BrowserSettingsService } from '@cloudbeaver/core-browser-settings';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

export class CookiesServiceImpl {
  get cookiesEnabled(): boolean {
    return !this.browserSettingsService.disabled;
  }

  constructor(private readonly browserSettingsService: BrowserSettingsService) {}
}

export type CookiesService = CookiesServiceImpl;

export class CookiesServiceDI extends Context.Service<CookiesServiceDI, CookiesServiceImpl>()(
  '@cloudbeaver/core-browser-cookies/CookiesService#CookiesService',
) {
  static readonly implementation = CookiesServiceImpl;

  static readonly dependencies = () => [BrowserSettingsService] as const;
  static readonly make: Effect.Effect<CookiesServiceImpl, never, Context.Service.Identifier<typeof BrowserSettingsService>> = Effect.gen(
    function* makeCookiesService() {
      const browserSettingsService = yield* BrowserSettingsService;

      return new CookiesServiceImpl(browserSettingsService);
    },
  );
  static readonly layer: Layer.Layer<CookiesServiceDI, never, Context.Service.Identifier<typeof BrowserSettingsService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const CookiesService = CookiesServiceDI;
