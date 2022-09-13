/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, observable, makeObservable, computed } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { PluginManagerService, PluginSettings } from '@cloudbeaver/core-plugin';
import { ServerConfigResource, SessionResource } from '@cloudbeaver/core-root';
import type { ServerLanguage } from '@cloudbeaver/core-sdk';
import { SettingsService } from '@cloudbeaver/core-settings';

import type { ILocaleProvider } from './ILocaleProvider';
import { defaultENLocale } from './locales/en';
import { defaultITLocale } from './locales/it';
import { defaultRULocale } from './locales/ru';
import { defaultZHLocale } from './locales/zh';
import type { TLocalizationToken } from './TLocalizationToken';

export type ServerLanguageShort = Pick<ServerLanguage, 'isoCode' | 'nativeName'>;

const DEFAULT_LOCALE_NAME = 'en';
const LANG_SETTINGS_KEY = 'langSettings';

export interface ILocalizationSettings {
  defaultLanguage: string;
}

export const defaultThemeSettings: ILocalizationSettings = {
  defaultLanguage: DEFAULT_LOCALE_NAME,
};

@injectable()
export class LocalizationService extends Bootstrap {
  get currentLanguage(): string {
    return this.settings.language;
  }

  get defaultLanguage(): string {
    if (this.pluginSettings.isValueDefault('defaultLanguage')) {
      return this.deprecatedPluginSettings.getValue('defaultLanguage');
    }

    return this.pluginSettings.getValue('defaultLanguage');
  }

  settings = {
    language: DEFAULT_LOCALE_NAME,
  };
  readonly pluginSettings: PluginSettings<ILocalizationSettings>;
  /** @deprecated Use settings instead, will be removed in 23.0.0 */
  readonly deprecatedPluginSettings: PluginSettings<ILocalizationSettings>;

  readonly onChange: ISyncExecutor<string>;
  // observable.shallow - don't treat locales as observables
  private readonly localeMap: Map<string, Map<string, string>> = new Map();

  private readonly localeProviders: ILocaleProvider[] = [];

  constructor(
    private readonly notificationService: NotificationService,
    private readonly sessionResource: SessionResource,
    private readonly pluginManagerService: PluginManagerService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly settingsService: SettingsService
  ) {
    super();

    this.onChange = new SyncExecutor();
    this.pluginSettings = this.pluginManagerService.getCoreSettings('localization', defaultThemeSettings);
    this.deprecatedPluginSettings = this.pluginManagerService.getCoreSettings('user', defaultThemeSettings);
    sessionResource.onDataUpdate.addHandler(this.syncLanguage.bind(this));

    makeObservable<LocalizationService, 'localeMap' | 'setCurrentLocale'>(this, {
      settings: observable,
      localeMap: observable.shallow,
      defaultLanguage: computed,
      setCurrentLocale: action,
    });
  }

  addProvider(provider: ILocaleProvider): void {
    this.localeProviders.push(provider);
  }

  readonly translate = <T extends TLocalizationToken | undefined>(
    token: T,
    fallback?: T,
    args: Record<string | number, any> = {}
  ): T => {
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
      translation = Object.entries(args).reduce<string>(
        (translation, [key, value]) => translation.replace(`{arg:${key}}`, value),
        translation
      ) as string;

      translation = translation.replace(/({alias:(\w*?)})/g, (substr, group1, group2) => this.translate(group2));
      return translation as T;
    }

    if (fallback !== undefined) {
      return this.translate(fallback);
    }

    return token;
  };

  register(): void | Promise<void> {
    this.addProvider(this.coreProvider.bind(this));
    this.sessionResource.setDefaultLocale(this.settings.language);
  }

  async load(): Promise<void> {
    await this.serverConfigResource.load();
    this.setCurrentLocale(this.defaultLanguage); // set default app locale
    this.settingsService.registerSettings(this.settings, LANG_SETTINGS_KEY); // load user state locale
    this.sessionResource.setDefaultLocale(this.settings.language);
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
    this.sessionResource.setDefaultLocale(this.settings.language);
    await this.sessionResource.changeLanguage(key);
    this.onChange.execute(key);
  }

  private async syncLanguage() {
    const session = this.sessionResource.data;

    if (session) {
      await this.setLocale(session.locale);
    }
  }

  private coreProvider(locale: string) {
    switch (locale) {
      case 'ru':
        return defaultRULocale;
      case 'it':
        return defaultITLocale;
      case 'zh':
        return defaultZHLocale;
      default:
        return defaultENLocale;
    }
  }

  private setCurrentLocale(lang: string) {
    this.settings.language = lang;
  }

  private async setLocale(key: string) {
    const config = await this.serverConfigResource.load();

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
      this.localeMap.set(
        localeKey,
        locale
      );
    } catch (error: any) {
      this.notificationService.logException(error, 'Locale is not found', '', true);
    }
  }
}
