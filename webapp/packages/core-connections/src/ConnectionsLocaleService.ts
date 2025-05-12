/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

@injectable()
export class ConnectionsLocaleService extends Bootstrap {
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
      case 'de':
        return (await import('./locales/de.js')).default;
      case 'vi':
        return (await import('./locales/vi.js')).default;
      default:
        return (await import('./locales/en.js')).default;
    }
  }
}
