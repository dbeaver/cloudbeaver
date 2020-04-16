/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import defaultLocale from '@dbeaver/core/assets/locales/en';
import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { GraphQLService, ServerLanguage } from '@dbeaver/core/sdk';
import { SettingsService } from '@dbeaver/core/settings';

import { Locale } from './Locale';
import { TLocalizationToken } from './TLocalizationToken';

export type ServerLanguageShort = Pick<ServerLanguage, 'isoCode' | 'nativeName'>;

const DEFAULT_LOCALE_NAME = 'en';
const LANG_SETTINGS_KEY = 'langSettings';

@injectable()
export class LocalizationService {

  @observable settings = {
    language: DEFAULT_LOCALE_NAME,
  };

  @observable.shallow
  private supportedLanguages: ServerLanguageShort[] = [];

  // observable.shallow - don't treat locales as observables
  @observable.shallow
  private localeMap: Map<string, Locale> = new Map();

  constructor(private notificationService: NotificationService,
              private graphQLService: GraphQLService,
              private settingsService: SettingsService) {

    // note that the default locale is always embedded in the build
    this.localeMap.set(DEFAULT_LOCALE_NAME, defaultLocale);
  }

  readonly translate = (token: TLocalizationToken): string => {
    const translation = this.getTranslation(token, this.getCurrentLocale());
    if (typeof translation === 'string') {
      return translation;
    }

    const fallbackTranslation = this.getTranslation(token, this.getDefaultLocale());
    if (typeof fallbackTranslation === 'string') {
      return fallbackTranslation;
    }
    // error - no translation
    return token;
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  getCurrentLocale(): Locale | undefined {
    return this.localeMap.get(this.settings.language);
  }

  getDefaultLocale(): Locale | undefined {
    return this.localeMap.get(DEFAULT_LOCALE_NAME);
  }

  getCurrentLanguage(): string {
    return this.settings.language;
  }

  getTranslation(token: string, locale?: Locale): string | undefined {
    return locale && locale[token];
  }

  async init(sessionLanguage: string | undefined, supportedLanguages: ServerLanguageShort[]) {
    this.supportedLanguages = supportedLanguages;

    this.settingsService.registerSettings(this.settings, LANG_SETTINGS_KEY); // overwrite default value with settings
    if (sessionLanguage) {
      this.setCurrentLocale(sessionLanguage); // session language wins
    }
    await this.setLocale(this.getCurrentLanguage());
  }

  async changeLocaleAsync(key: string) {
    if (key === this.settings.language) {
      return;
    }
    const response = await this.graphQLService.gql.changeSessionLanguage({ locale: key });
    this.setLocale(key);
    if (response.changeSessionLanguage) {
      window.location.reload();
    }
  }

  @action
  private setCurrentLocale(lang: string) {
    this.settings.language = lang;
  }

  private async setLocale(key: string) {
    if (!this.supportedLanguages.some(lang => lang.isoCode === key)) {
      this.setCurrentLocale(this.supportedLanguages[0]!.isoCode);
      throw new Error(`Language '${key}' is not supported`);
    }
    await this.loadLocaleAsync(key);
  }

  private async loadLocaleAsync(key: string): Promise<void> {
    if (this.localeMap.has(key)) {
      return;
    }
    try {
      const locale = await import(`@dbeaver/core/assets/locales/${key}`);
      this.localeMap.set(key, locale.default);
    } catch (error) {
      this.notificationService.logException(error, 'Locale is not found', true);
    }
  }
}
