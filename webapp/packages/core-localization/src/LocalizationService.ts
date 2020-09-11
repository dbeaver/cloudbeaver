/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { SessionService, ServerService } from '@cloudbeaver/core-root';
import { GraphQLService, ServerLanguage } from '@cloudbeaver/core-sdk';
import { SettingsService } from '@cloudbeaver/core-settings';

import { ILocaleProvider } from './IlocaleProvider';
import { defaultENLocale } from './locales/en';
import { defaultRULocale } from './locales/ru';
import { TLocalizationToken } from './TLocalizationToken';

export type ServerLanguageShort = Pick<ServerLanguage, 'isoCode' | 'nativeName'>;

const DEFAULT_LOCALE_NAME = 'en';
const LANG_SETTINGS_KEY = 'langSettings';

@injectable()
export class LocalizationService extends Bootstrap {
  @observable settings = {
    language: DEFAULT_LOCALE_NAME,
  };

  // observable.shallow - don't treat locales as observables
  @observable.shallow
  private localeMap: Map<string, Map<string, string>> = new Map();

  private localeProviders: ILocaleProvider[] = []

  constructor(
    private notificationService: NotificationService,
    private sessionService: SessionService,
    private serverService: ServerService,
    private graphQLService: GraphQLService,
    private settingsService: SettingsService
  ) {
    super();
  }

  addProvider(provider: ILocaleProvider) {
    this.localeProviders.push(provider);
  }

  readonly translate = (token: TLocalizationToken): string => {
    let translation = this.localeMap
      .get(this.getCurrentLanguage())
      ?.get(token);

    if (!translation) {
      translation = this.localeMap
        .get(DEFAULT_LOCALE_NAME)
        ?.get(token);
    }

    if (typeof translation === 'string') {
      return translation;
    }
    return token;
  }

  register(): void | Promise<void> {
    this.addProvider(this.coreProvider.bind(this));
  }

  async load(): Promise<void> {
    const session = await this.sessionService.session.load(null);
    await this.loadLocaleAsync(DEFAULT_LOCALE_NAME);

    if (!session) {
      return;
    }

    this.settingsService.registerSettings(this.settings, LANG_SETTINGS_KEY); // overwrite default value with settings
    this.setCurrentLocale(session.locale); // session language wins

    await this.setLocale(this.getCurrentLanguage());
  }

  getCurrentLanguage(): string {
    return this.settings.language;
  }

  async changeLocaleAsync(key: string) {
    if (key === this.settings.language) {
      return;
    }
    const response = await this.graphQLService.sdk.changeSessionLanguage({ locale: key });
    this.setLocale(key);
    if (response.changeSessionLanguage) {
      window.location.reload();
    }
  }

  private coreProvider(locale: string) {
    switch (locale) {
      case 'ru':
        return defaultRULocale;
      default:
        return defaultENLocale;
    }
  }

  @action
  private setCurrentLocale(lang: string) {
    this.settings.language = lang;
  }

  private async setLocale(key: string) {
    const config = await this.serverService.config.load(null);

    if (!config) {
      throw new Error('Cant\'t get server settings');
    }

    if (!config.supportedLanguages.some(lang => lang.isoCode === key)) {
      this.setCurrentLocale(config!.supportedLanguages[0]!.isoCode);
      throw new Error(`Language '${key}' is not supported`);
    }
    await this.loadLocaleAsync(key);
  }

  private async loadLocaleAsync(localeKey: string): Promise<void> {
    if (this.localeMap.has(localeKey)) {
      return;
    }
    try {
      const locale = new Map<string, string>();

      for (const provider of this.localeProviders) {
        for (const [key, value] of await provider(localeKey)) {
          locale.set(key, value);
        }
      }
      this.localeMap.set(localeKey, locale);
    } catch (error) {
      this.notificationService.logException(error, 'Locale is not found', true);
    }
  }
}
