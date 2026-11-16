/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

export class ConnectionsLocaleServiceImpl extends Bootstrap {
  constructor(private readonly localizationService: LocalizationService) {
    super();
  }

  override register(): void {
    this.localizationService.addProvider(this.provider.bind(this));
  }

  private async provider(locale: string) {
    switch (locale) {
      case 'en':
        return (await import('./locales/en.js')).default;
      case 'pl':
        return (await import('./locales/pl.js')).default;
      case 'ja':
        return (await import('./locales/ja.js')).default;
      case 'ko':
        return (await import('./locales/ko.js')).default;
      case 'pt_BR':
        return (await import('./locales/pt_BR.js')).default;
      case 'ro':
        return (await import('./locales/ro.js')).default;
      case 'es':
        return (await import('./locales/es.js')).default;
      case 'tw':
        return (await import('./locales/tw.js')).default;
      case 'uk':
        return (await import('./locales/uk.js')).default;
      case 'ar':
        return (await import('./locales/ar.js')).default;
      case 'ru':
        return (await import('./locales/ru.js')).default;
      case 'it':
        return (await import('./locales/it.js')).default;
      case 'zh':
        return (await import('./locales/zh.js')).default;
      case 'fr':
        return (await import('./locales/fr.js')).default;
      case 'de':
        return (await import('./locales/de.js')).default;
      case 'vi':
        return (await import('./locales/vi.js')).default;
      default:
        return (await import('./locales/en.js')).default;
    }
  }
}

export type ConnectionsLocaleService = ConnectionsLocaleServiceImpl;

export class ConnectionsLocaleServiceDI extends Context.Service<ConnectionsLocaleServiceDI, ConnectionsLocaleServiceImpl>()(
  '@cloudbeaver/core-connections/ConnectionsLocaleService#ConnectionsLocaleService',
) {
  static readonly implementation = ConnectionsLocaleServiceImpl;

  static readonly dependencies = () => [LocalizationService] as const;
  static readonly make: Effect.Effect<ConnectionsLocaleServiceImpl, never, Context.Service.Identifier<typeof LocalizationService>> = Effect.gen(
    function* makeConnectionsLocaleService() {
      const localizationService = yield* LocalizationService;

      return new ConnectionsLocaleServiceImpl(localizationService);
    },
  );
  static readonly layer: Layer.Layer<ConnectionsLocaleServiceDI, never, Context.Service.Identifier<typeof LocalizationService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ConnectionsLocaleService = ConnectionsLocaleServiceDI;
