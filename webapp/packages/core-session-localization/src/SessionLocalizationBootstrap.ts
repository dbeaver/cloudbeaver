/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { SessionResource } from '@cloudbeaver/core-root';
import { SettingsLocalizationService, type ILocalizationSettings } from '@cloudbeaver/core-settings-localization';
import type { ISettingChangeData } from '@cloudbeaver/core-settings';

@injectable(() => [SessionResource, LocalizationService, SettingsLocalizationService])
export class SessionLocalizationBootstrap extends Bootstrap {
  constructor(
    private readonly sessionResource: SessionResource,
    private readonly localizationService: LocalizationService,
    private readonly settingsLocalizationService: SettingsLocalizationService,
  ) {
    super();
    this.syncSessionLanguage = this.syncSessionLanguage.bind(this);
    this.syncSessionLanguageWithSettings = this.syncSessionLanguageWithSettings.bind(this);
  }

  override register(): void | Promise<void> {
    this.sessionResource.onDataUpdate.addHandler(this.syncSessionLanguage.bind(this));
    this.settingsLocalizationService.settingsProvider.onChange.addHandler(this.syncSessionLanguageWithSettings);
  }

  protected override dispose(): Promise<void> | void {
    this.sessionResource.onDataUpdate.removeHandler(this.syncSessionLanguage.bind(this));
    this.settingsLocalizationService.settingsProvider.onChange.removeHandler(this.syncSessionLanguageWithSettings);
  }

  private syncSessionLanguageWithSettings(data: ISettingChangeData<keyof ILocalizationSettings>) {
    if (data.key === 'core.localization.language') {
      this.sessionResource.changeLanguage(data.value).catch(exception => {
        console.error(exception);
      });
    }
  }

  private syncSessionLanguage() {
    const session = this.sessionResource.data;

    if (session && session.locale !== this.localizationService.currentLanguage) {
      this.sessionResource.changeLanguage(this.localizationService.currentLanguage).catch(exception => {
        console.error(exception);
      });
    }
  }
}
