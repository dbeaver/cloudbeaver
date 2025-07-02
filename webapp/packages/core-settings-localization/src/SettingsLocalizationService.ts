/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { DEFAULT_LOCALE } from '@cloudbeaver/core-localization';
import {
  createSettingsAliasResolver,
  ROOT_SETTINGS_LAYER,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  'core.localization.language': schema.string().default(DEFAULT_LOCALE.isoCode),
});

export type ILocalizationSettingsSchema = typeof settingsSchema;
export type ILocalizationSettings = schema.infer<ILocalizationSettingsSchema>;

@injectable()
export class SettingsLocalizationService extends Dependency {
  get language(): string {
    return this.settingsProvider.getValue('core.localization.language');
  }
  readonly settingsProvider: SettingsProvider<ILocalizationSettingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();

    this.settingsProvider = this.settingsProviderService.createSettings(settingsSchema);

    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver<ILocalizationSettingsSchema>(this.settingsResolverService, {
        'core.localization.language': 'core.user.defaultLanguage',
      }),
      createSettingsAliasResolver<ILocalizationSettingsSchema>(this.settingsResolverService, {
        'core.localization.language': 'core.localization.defaultLanguage',
      }),
      createSettingsAliasResolver<ILocalizationSettingsSchema>(this.settingsResolverService, { 'core.localization.language': 'app.defaultLanguage' }),
    );

    makeObservable(this, {
      language: computed,
    });
  }

  async changeLanguage(language: string) {
    this.settingsProvider.setValue('core.localization.language', language);
    await this.settingsProvider.save();
  }
}
