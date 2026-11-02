/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ServerSettingsResource, SessionResource } from '@cloudbeaver/core-root';
import { StorageService } from '@cloudbeaver/core-storage';

const STORAGE_KEY = 'easy_config_language_state';

@injectable(() => [LocalizationService, SessionResource, ServerSettingsResource, StorageService])
export class ConfigurationLocaleService {
  private readonly state = observable<{ language: string | null }>({ language: null });
  private initialized = false;
  private storageRegistered = false;

  constructor(
    private readonly localizationService: LocalizationService,
    private readonly sessionResource: SessionResource,
    private readonly serverSettingsResource: ServerSettingsResource,
    private readonly storageService: StorageService,
  ) {
    makeObservable(this, {
      changeLanguage: action,
      clear: action,
    });
  }

  initialize(): void {
    this.initialized = true;
    this.registerStorage();
    this.applyInitialLanguage();
  }

  private registerStorage(): void {
    if (!this.storageRegistered) {
      this.storageRegistered = true;
      this.storageService.registerSettings(
        STORAGE_KEY,
        this.state,
        () => ({ language: this.initialized ? this.state.language : null }),
        saved => ({
          // A selection made while storage is loading takes precedence over restored state.
          language: this.initialized ? (this.state.language ?? (typeof saved?.language === 'string' ? saved.language : null)) : null,
        }),
        () => {
          if (this.initialized) {
            this.applyInitialLanguage();
          }
        },
      );
    }
  }

  private applyInitialLanguage(): void {
    const savedLanguage = this.state.language;

    if (savedLanguage && this.localizationService.isLanguageSupported(savedLanguage)) {
      this.applyLanguage(savedLanguage);
      return;
    }

    const preferences = navigator.languages.length ? navigator.languages : [navigator.language];

    for (const preference of preferences) {
      const normalized = preference.toLowerCase();
      const language =
        this.localizationService.supportedLanguages.find(locale => locale.isoCode.toLowerCase() === normalized) ??
        this.localizationService.supportedLanguages.find(locale => locale.isoCode.toLowerCase() === normalized.split('-')[0]);

      if (language) {
        this.applyLanguage(language.isoCode);
        return;
      }
    }

    document.documentElement.lang = this.localizationService.currentLanguage;
  }

  changeLanguage(language: string): void {
    if (!this.localizationService.isLanguageSupported(language)) {
      return;
    }

    this.applyLanguage(language);

    this.state.language = language;
  }

  clear(): void {
    this.initialized = false;
    this.state.language = null;
    this.registerStorage();
  }

  private applyLanguage(language: string): void {
    this.localizationService.setLanguage(language);
    document.documentElement.lang = language;

    // New sessions receive the current language when they are opened.
    if (this.sessionResource.isLoaded()) {
      this.syncSessionLanguage(language).catch(exception => {
        console.error('Unable to update Easy Config session language', exception);
      });
    }
  }

  private async syncSessionLanguage(language: string): Promise<void> {
    await this.sessionResource.changeLanguage(language);

    if (this.serverSettingsResource.isLoaded()) {
      await this.serverSettingsResource.refresh();
    }
  }
}
