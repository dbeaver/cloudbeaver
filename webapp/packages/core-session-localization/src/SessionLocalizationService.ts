/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Dependency, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { SessionResource } from '@cloudbeaver/core-root';
import { SettingsLocalizationService } from '@cloudbeaver/core-settings-localization';

@injectable()
export class SessionLocalizationService extends Dependency {
  constructor(
    private readonly sessionResource: SessionResource,
    private readonly localizationService: LocalizationService,
    private readonly settingsLocalizationService: SettingsLocalizationService,
  ) {
    super();

    this.sessionResource.onDataUpdate.addHandler(this.syncLanguage.bind(this));
    this.settingsLocalizationService.settingsProvider.onChange.addHandler(data => {
      if (data.key === 'core.localization.language') {
        this.sessionResource.changeLanguage(data.value).catch(exception => {
          console.error(exception);
        });
      }
    });
  }

  private async syncLanguage() {
    const session = this.sessionResource.data;

    if (session) {
      await this.localizationService.changeLocale(session.locale);
    }
  }
}
