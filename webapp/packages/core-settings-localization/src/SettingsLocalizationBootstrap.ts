/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { reaction, type IReactionDisposer } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

import { SettingsLocalizationService } from './SettingsLocalizationService.js';

@injectable(() => [SettingsLocalizationService, LocalizationService])
export class SettingsLocalizationBootstrap extends Bootstrap {
  private languageReaction: IReactionDisposer | undefined;

  constructor(
    private readonly settingsLocalizationService: SettingsLocalizationService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
    this.changeLanguage = this.changeLanguage.bind(this);
  }

  override register(): void {
    this.localizationService.onChange.addHandler(this.changeLanguage);
    this.languageReaction = reaction(
      () => this.settingsLocalizationService.language,
      language => this.localizationService.setLanguage(language),
      { fireImmediately: true },
    );
  }

  override dispose(): void {
    this.localizationService.onChange.removeHandler(this.changeLanguage);
    this.languageReaction?.();
  }

  private async changeLanguage(language: string) {
    await this.settingsLocalizationService.changeLanguage(language);
  }
}
