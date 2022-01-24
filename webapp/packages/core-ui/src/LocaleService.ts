/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

@injectable()
export class LocaleService extends Bootstrap {
  constructor(private readonly localizationService: LocalizationService) {
    super();
  }

  register(): void | Promise<void> {
    this.localizationService.addProvider(this.provider.bind(this));
  }

  load(): void | Promise<void> {}

  private async provider(locale: string) {
    switch (locale) {
      case 'ru':
        return (await import('./locales/ru')).default;
      case 'it':
        return (await import('./locales/it')).default;
      default:
        return (await import('./locales/en')).default;
    }
  }
}
