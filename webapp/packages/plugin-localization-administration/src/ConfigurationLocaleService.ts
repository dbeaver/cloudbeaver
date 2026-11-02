/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';

const STORAGE_KEY = 'easy_config_language';

@injectable(() => [LocalizationService])
export class ConfigurationLocaleService {
  constructor(private readonly localizationService: LocalizationService) {}

  initialize(): void {
    let savedLanguage: string | null = null;

    try {
      savedLanguage = localStorage.getItem(STORAGE_KEY);
    } catch (exception) {
      console.warn('Unable to read Easy Config language', exception);
    }

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

    // Save synchronously so an immediate reload preserves the explicit choice.
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch (exception) {
      console.warn('Unable to save Easy Config language', exception);
    }
  }

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (exception) {
      console.warn('Unable to clear Easy Config language', exception);
    }
  }

  private applyLanguage(language: string): void {
    this.localizationService.setLanguage(language);
    document.documentElement.lang = language;
  }
}
