/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { SESSION_SETTINGS_LAYER } from '@cloudbeaver/core-root';
import { SettingsResolverService } from '@cloudbeaver/core-settings';

import { BrowserLanguageSettingsSource } from './BrowserLanguageSettingsSource.js';

@injectable(() => [LocalizationService, SettingsResolverService])
export class BrowserLanguageBootstrap extends Bootstrap {
  private source: BrowserLanguageSettingsSource | undefined;

  constructor(
    private readonly localizationService: LocalizationService,
    private readonly settingsResolverService: SettingsResolverService,
  ) {
    super();
  }

  override register(): void {
    this.source = new BrowserLanguageSettingsSource(
      navigator.languages.length ? navigator.languages : [navigator.language],
      this.localizationService.supportedLanguages,
    );
    // User settings at the same layer take precedence over application defaults.
    this.settingsResolverService.addResolver(SESSION_SETTINGS_LAYER, this.source);
  }

  override dispose(): void {
    if (this.source) {
      this.settingsResolverService.removeResolver(SESSION_SETTINGS_LAYER, this.source);
    }
  }
}
