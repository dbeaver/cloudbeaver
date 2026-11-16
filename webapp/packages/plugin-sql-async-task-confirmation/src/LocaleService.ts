/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

export class LocaleServiceImpl extends Bootstrap {
  constructor(private readonly localizationService: LocalizationService) {
    super();
  }

  override register(): void {
    this.localizationService.addProvider(this.provider.bind(this));
  }

  private async provider(locale: string) {
    switch (locale) {
      case 'ru':
        return (await import('./locales/ru.js')).default;
      case 'it':
        return (await import('./locales/it.js')).default;
      case 'zh':
        return (await import('./locales/zh.js')).default;
      case 'fr':
        return (await import('./locales/fr.js')).default;
      case 'vi':
        return (await import('./locales/vi.js')).default;
      default:
        return (await import('./locales/en.js')).default;
    }
  }
}

export type LocaleService = LocaleServiceImpl;

export class LocaleServiceDI extends Context.Service<LocaleServiceDI, LocaleServiceImpl>()(
  '@cloudbeaver/plugin-sql-async-task-confirmation/LocaleService#LocaleService',
) {
  static readonly implementation = LocaleServiceImpl;

  static readonly dependencies = () => [LocalizationService] as const;
  static readonly make: Effect.Effect<LocaleServiceImpl, never, Context.Service.Identifier<typeof LocalizationService>> = Effect.gen(
    function* makeLocaleService() {
      const localizationService = yield* LocalizationService;

      return new LocaleServiceImpl(localizationService);
    },
  );
  static readonly layer: Layer.Layer<LocaleServiceDI, never, Context.Service.Identifier<typeof LocalizationService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const LocaleService = LocaleServiceDI;
