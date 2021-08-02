/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable, makeObservable } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ServerService, SessionResource, SessionDataResource } from '@cloudbeaver/core-root';
import type { ServerLanguage } from '@cloudbeaver/core-sdk';
import { SettingsService } from '@cloudbeaver/core-settings';

import type { ILocaleProvider } from './ILocaleProvider';
import { defaultENLocale } from './locales/en';
import { defaultRULocale } from './locales/ru';
import type { TLocalizationToken } from './TLocalizationToken';

export type ServerLanguageShort = Pick<ServerLanguage, 'isoCode' | 'nativeName'>;

const DEFAULT_LOCALE_NAME = 'en';
const LANG_SETTINGS_KEY = 'langSettings';

@injectable()
export class LocalizationService extends Bootstrap {
  settings = {
    language: DEFAULT_LOCALE_NAME,
  };

  // observable.shallow - don't treat locales as observables
  private localeMap: Map<string, Map<string, string>> = new Map();

  private localeProviders: ILocaleProvider[] = [];

  constructor(
    private notificationService: NotificationService,
    private sessionResource: SessionResource,
    sessionDataResource: SessionDataResource,
    private serverService: ServerService,
    private settingsService: SettingsService
  ) {
    super();

    makeObservable<LocalizationService, 'localeMap' | 'setCurrentLocale'>(this, {
      settings: observable,
      localeMap: observable.shallow,
      setCurrentLocale: action,
    });

    sessionDataResource.onDataUpdate.addHandler(this.syncLanguage.bind(this));
  }

  addProvider(provider: ILocaleProvider): void {
    this.localeProviders.push(provider);
  }

  readonly translate = <T extends TLocalizationToken | undefined>(token: T): T => {
    if (token === undefined) {
      return undefined as T;
    }

    let translation = this.localeMap
      .get(this.getCurrentLanguage())
      ?.get(token as TLocalizationToken);

    if (!translation) {
      translation = this.localeMap
        .get(DEFAULT_LOCALE_NAME)
        ?.get(token as TLocalizationToken);
    }

    if (typeof translation === 'string') {
      return translation as T;
    }
    return token;
  };

  register(): void | Promise<void> {
    this.addProvider(this.coreProvider.bind(this));
    this.settingsService.registerSettings(this.settings, LANG_SETTINGS_KEY); // overwrite default value with settings
  }

  async load(): Promise<void> {
    await this.loadLocaleAsync(DEFAULT_LOCALE_NAME);
    await this.loadLocaleAsync(this.settings.language);
  }

  getCurrentLanguage(): string {
    return this.settings.language;
  }

  async changeLocaleAsync(key: string): Promise<void> {
    if (key === this.settings.language) {
      return;
    }
    await this.sessionResource.changeLanguage(key);
    // window.location.reload();
  }

  private async syncLanguage() {
    await this.sessionResource.refreshSilent(); // TODO: remove
    const session = this.sessionResource.data;

    if (session) {
      await this.setLocale(session.locale);
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

  private setCurrentLocale(lang: string) {
    this.settings.language = lang;
  }

  private async setLocale(key: string) {
    const config = await this.serverService.config.load();

    if (!config) {
      throw new Error('Can\'t get server settings');
    }

    if (!config.supportedLanguages.some(lang => lang.isoCode === key)) {
      this.setCurrentLocale(config!.supportedLanguages[0]!.isoCode);
      throw new Error(`Language '${key}' is not supported`);
    }

    this.setCurrentLocale(key);
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
      this.notificationService.logException(error, 'Locale is not found', '', true);
    }
  }
}
