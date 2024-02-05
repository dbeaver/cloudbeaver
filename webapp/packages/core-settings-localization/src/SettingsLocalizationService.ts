/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, reaction } from 'mobx';

import { Dependency, injectable } from '@cloudbeaver/core-di';
import { DEFAULT_LOCALE, LocalizationService } from '@cloudbeaver/core-localization';
import { createSettingsAliasResolver, PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';
import { ServerSettingsResolverService, ServerSettingsService } from '@cloudbeaver/core-root';
import { schema } from '@cloudbeaver/core-utils';

const settingsSchema = schema.object({
  defaultLanguage: schema.string().default(DEFAULT_LOCALE.isoCode),
});

export type ILocalizationSettings = schema.infer<typeof settingsSchema>;

@injectable()
export class SettingsLocalizationService extends Dependency {
  get defaultLanguage(): string {
    return this.pluginSettings.getValue('defaultLanguage');
  }
  readonly pluginSettings: PluginSettings<typeof settingsSchema>;

  constructor(
    private readonly pluginManagerService: PluginManagerService,
    private readonly localizationService: LocalizationService,
    private readonly serverSettingsService: ServerSettingsService,
    private readonly serverSettingsResolverService: ServerSettingsResolverService,
  ) {
    super();

    this.pluginSettings = this.pluginManagerService.createSettings('localization', 'core', settingsSchema);

    this.serverSettingsResolverService.addResolver(
      /** @deprecated Use settings instead, will be removed in 23.0.0 */
      createSettingsAliasResolver(this.serverSettingsService, this.pluginSettings, 'core.user'),
    );
    reaction(
      () => this.defaultLanguage,
      defaultLanguage => {
        this.localizationService.setDefaultLanguage(defaultLanguage);
      },
      {
        fireImmediately: true,
      },
    );

    makeObservable(this, {
      defaultLanguage: computed,
    });
  }
}
