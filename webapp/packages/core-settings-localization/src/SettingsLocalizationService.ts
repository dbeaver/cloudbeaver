/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { DEFAULT_LOCALE } from '@cloudbeaver/core-localization';
import { SettingsProvider, SettingsProviderService } from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'core.localization.language': schema.string().default(DEFAULT_LOCALE.isoCode),
});

export type ILocalizationSettingsSchema = typeof settingsSchema;
export type ILocalizationSettings = schema.infer<ILocalizationSettingsSchema>;

@injectable(() => [SettingsProviderService])
export class SettingsLocalizationService {
  get language(): string {
    return this.settingsProvider.getValue('core.localization.language');
  }
  readonly settingsProvider: SettingsProvider<ILocalizationSettingsSchema>;

  constructor(private readonly settingsProviderService: SettingsProviderService) {
    this.settingsProvider = this.settingsProviderService.createSettings(settingsSchema);

    makeObservable(this, {
      language: computed,
    });
  }

  async changeLanguage(language: string) {
    this.settingsProvider.setValue('core.localization.language', language);
    await this.settingsProvider.save();
  }
}
