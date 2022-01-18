/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2019-2022 DBeaver Corp
 *
 * All Rights Reserved
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of DBeaver Corp and its suppliers, if any.
 * The intellectual and technical concepts contained
 * herein are proprietary to DBeaver Corp and its suppliers
 * and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from DBeaver Corp.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

@injectable()
export class LocaleService extends Bootstrap {
  constructor(private localizationService: LocalizationService) {
    super();
  }

  register(): void | Promise<void> {
    this.localizationService.addProvider(this.provider.bind(this));
  }

  load(): void | Promise<void> { }

  private async provider(locale: string) {
    switch (locale) {
      case 'ru':
        return (await import('./locales/ru')).default;
      case 'it':
        return (await import('./locales/it')).default;
      case 'zh':
        return (await import('./locales/zh')).default;
      default:
        return (await import('./locales/en')).default;
    }
  }
}
