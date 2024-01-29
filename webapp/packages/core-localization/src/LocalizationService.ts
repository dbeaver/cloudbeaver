/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable, reaction } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ISyncExecutor, SyncExecutor } from '@cloudbeaver/core-executor';
import { SettingsService } from '@cloudbeaver/core-settings';

import { DEFAULT_LOCALE_NAME } from './DEFAULT_LOCALE_NAME';
import type { ILocaleProvider } from './ILocaleProvider';
import type { TLocalizationToken } from './TLocalizationToken';

const LANG_SETTINGS_KEY = 'langSettings';

export interface ILocale {
  isoCode: string;
  displayName: string;
}

interface ISettings {
  language: string | null;
}

@injectable()
export class LocalizationService extends Bootstrap {
  get currentLanguage(): string {
    return this.settings.language ?? this.defaultLanguage;
  }

  settings: ISettings;
  supportedLanguages: ILocale[];

  readonly onChange: ISyncExecutor<string>;
  private defaultLanguage: string;
  private readonly localeMap: Map<string, Map<string, string>> = new Map();
  private readonly localeProviders: ILocaleProvider[] = [];

  constructor(private readonly settingsService: SettingsService) {
    super();

    this.settings = getDefaultLocalizationSettings();
    this.supportedLanguages = [];
    this.defaultLanguage = DEFAULT_LOCALE_NAME;
    this.onChange = new SyncExecutor();

    makeObservable<LocalizationService, 'localeMap' | 'setCurrentLocale' | 'supportedLanguages' | 'defaultLanguage'>(this, {
      defaultLanguage: observable,
      supportedLanguages: observable,
      settings: observable,
      localeMap: observable.shallow, // observable.shallow - don't treat locales as observables
      setCurrentLocale: action,
    });
  }

  isLanguageSupported(lang: string): boolean {
    return this.supportedLanguages.some(language => language.isoCode === lang);
  }

  addProvider(provider: ILocaleProvider): void {
    this.localeProviders.push(provider);
  }

  setSupportedLanguages(locales: ILocale[]) {
    this.supportedLanguages = locales;
  }

  setDefaultLanguage(lang: string) {
    this.defaultLanguage = lang;
  }

  readonly translate = <T extends TLocalizationToken | undefined>(token: T, fallback?: T, args: Record<string | number, any> = {}): T => {
    if (token === undefined) {
      return undefined as T;
    }

    let translation = this.localeMap.get(this.currentLanguage)?.get(token as TLocalizationToken);

    if (!translation) {
      translation = this.localeMap.get(DEFAULT_LOCALE_NAME)?.get(token as TLocalizationToken);
    }

    if (typeof translation === 'string') {
      translation = Object.entries(args).reduce<string>(
        (translation, [key, value]) => translation.replace(`{arg:${key}}`, value),
        translation,
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
    this.settingsService.registerSettings(LANG_SETTINGS_KEY, this.settings, getDefaultLocalizationSettings); // load user state locale
    this.setSupportedLanguages([
      {
        isoCode: 'en',
        displayName: 'English',
      },
      {
        isoCode: 'ru',
        displayName: 'Русский',
      },
      {
        isoCode: 'it',
        displayName: 'Italiano',
      },
      {
        isoCode: 'zh',
        displayName: '中文',
      },
    ]);
    this.addProvider(this.coreProvider.bind(this));
  }

  async load(): Promise<void> {
    await this.loadLocaleAsync(DEFAULT_LOCALE_NAME);
    await this.autoLoadCurrentLanguage();
  }

  async changeLocaleAsync(key: string): Promise<void> {
    if (key === this.currentLanguage) {
      return;
    }
    await this.setLocale(key);
    this.onChange.execute(this.currentLanguage);
  }

  private async coreProvider(locale: string) {
    switch (locale) {
      case 'ru':
        return (await import('./locales/ru')).default;
      case 'it':
        return (await import('./locales/it')).default;
      case 'zh':
        return (await import('./locales/zh')).default;
      default:
        return (await import('./locales/en')).default;
    }
  }

  private setCurrentLocale(lang: string) {
    this.settings.language = lang;
  }

  async setLocale(key: string) {
    if (!this.isLanguageSupported(key)) {
      throw new Error(`Language '${key}' is not supported`);
    }

    this.setCurrentLocale(key);
    await this.loadLocaleAsync(key);
  }

  private async loadLocaleAsync(localeKey: string): Promise<void> {
    if (this.localeMap.has(localeKey)) {
      return;
    }
    const locale = new Map<string, string>();

    for (const provider of this.localeProviders) {
      for (const [key, value] of await provider(localeKey)) {
        locale.set(key, value);
      }
    }
    this.localeMap.set(localeKey, locale);
  }

  private async autoLoadCurrentLanguage() {
    let resolve: (value: void | PromiseLike<void>) => void;
    let reject: (reason?: any) => void;
    let promise: Promise<void> | null = new Promise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });

    reaction(
      () => this.currentLanguage,
      lang => {
        this.loadLocaleAsync(lang)
          .then(resolve, reject)
          .finally(() => {
            promise = null;
          });
      },
      {
        fireImmediately: true,
      },
    );

    await promise;
  }
}

function getDefaultLocalizationSettings(): ISettings {
  return {
    language: null,
  };
}
