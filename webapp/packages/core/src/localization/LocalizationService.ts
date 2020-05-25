/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { injectable } from '@dbeaver/core/di';
import { NotificationService } from '@dbeaver/core/eventsLog';
import { SessionService, ServerService } from '@dbeaver/core/root';
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
              private sessionService: SessionService,
              private serverService: ServerService,
              private graphQLService: GraphQLService,
              private settingsService: SettingsService) {
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

  async init() {
    const session = await this.sessionService.session.load();
    const config = await this.serverService.config.load();
    await this.loadLocaleAsync(DEFAULT_LOCALE_NAME);

    if (!session || !config) {
      return;
    }

    this.supportedLanguages = config.supportedLanguages;

    this.settingsService.registerSettings(this.settings, LANG_SETTINGS_KEY); // overwrite default value with settings
    this.setCurrentLocale(session.locale); // session language wins

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
      const response = await fetch(`locales/${key}.json`);
      const locale = await response.json() as Locale;
      this.localeMap.set(key, locale);
    } catch (error) {
      this.notificationService.logException(error, 'Locale is not found', true);
    }
  }
}
