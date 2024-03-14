/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable } from 'mobx';

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { DEFAULT_LOCALE } from '@cloudbeaver/core-localization';
import { ServerSettingsService } from '@cloudbeaver/core-root';
import {
  createSettingsAliasResolver,
  ROOT_SETTINGS_LAYER,
  SettingsProvider,
  SettingsProviderService,
  SettingsResolverService,
} from '@cloudbeaver/core-settings';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  language: schema.string().default(DEFAULT_LOCALE.isoCode),
});

export type ILocalizationSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class SettingsLocalizationService extends Dependency {
  get language(): string {
    return this.settingsProvider.getValue('language');
  }
  readonly settingsProvider: SettingsProvider<typeof settingsSchema>;

  constructor(
    private readonly settingsProviderService: SettingsProviderService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();

    this.settingsProvider = this.settingsProviderService.createSettings(settingsSchema, 'core', 'localization');

    this.settingsResolverService.addResolver(
      ROOT_SETTINGS_LAYER,
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.settingsProvider, 'core.user'),
      createSettingsAliasResolver(this.serverSettingsService, this.settingsProvider, 'core.localization', { language: 'defaultLanguage' }),
      createSettingsAliasResolver(this.serverSettingsService, this.settingsProvider, 'app'),
    );

    makeObservable(this, {
      language: computed,
    });
  }

  async changeLanguage(language: string) {
    this.settingsProvider.setValue('language', language);
    await this.settingsProvider.save();
  }
}
