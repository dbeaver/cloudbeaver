/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IReactionDisposer, reaction } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

import { SettingsLocalizationService } from './SettingsLocalizationService.js';

@injectable()
export class SettingsLocalizationBootstrap extends Bootstrap {
  private reactionDisposer: IReactionDisposer | null;
  constructor(
    private readonly settingsLocalizationService: SettingsLocalizationService,
    private readonly localizationService: LocalizationService,
  ) {
    super();
    this.reactionDisposer = null;
    this.changeLanguage = this.changeLanguage.bind(this);
  }

  override register(): void {
    this.localizationService.onChange.addHandler(this.changeLanguage);
    this.reactionDisposer = reaction(
      () => this.settingsLocalizationService.language,
      defaultLanguage => {
        this.localizationService.setLanguage(defaultLanguage);
      },
      {
        fireImmediately: true,
      },
    );
  }

  override dispose(): void {
    this.localizationService.onChange.removeHandler(this.changeLanguage);
    if (this.reactionDisposer) {
      this.reactionDisposer();
    }
  }

  private async changeLanguage(language: string) {
    await this.settingsLocalizationService.changeLanguage(language);
  }
}
