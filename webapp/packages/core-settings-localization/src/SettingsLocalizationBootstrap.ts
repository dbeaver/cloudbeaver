/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

import { SettingsLocalizationService, type ILocalizationSettings } from './SettingsLocalizationService.js';
import type { ISettingChangeData } from '@cloudbeaver/core-settings';

@injectable(() => [SettingsLocalizationService, LocalizationService])
export class SettingsLocalizationBootstrap extends Bootstrap {
  constructor(
    private readonly settingsLocalizationService: SettingsLocalizationService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
    this.changeLanguage = this.changeLanguage.bind(this);
    this.syncLanguage = this.syncLanguage.bind(this);
  }

  override register(): void {
    this.localizationService.onChange.addHandler(this.changeLanguage);
    this.settingsLocalizationService.settingsProvider.onChange.addHandler(this.syncLanguage);
  }

  override dispose(): void {
    this.localizationService.onChange.removeHandler(this.changeLanguage);
    this.settingsLocalizationService.settingsProvider.onChange.removeHandler(this.syncLanguage);
  }

  private syncLanguage(data: ISettingChangeData<keyof ILocalizationSettings>) {
    if (data.key === 'core.localization.language') {
      this.localizationService.setLanguage(data.value);
    }
  }

  private async changeLanguage(language: string) {
    await this.settingsLocalizationService.changeLanguage(language);
  }
}
