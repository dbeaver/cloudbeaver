/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IReactionDisposer, makeObservable, observable, reaction } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, type IExecutor } from '@cloudbeaver/core-executor';

import { DEFAULT_LOCALE } from './DEFAULT_LOCALE.js';
import type { ILocale } from './ILocale.js';
import type { ILocaleProvider } from './ILocaleProvider.js';
import type { TLocalizationToken } from './TLocalizationToken.js';

@injectable()
export class LocalizationService extends Bootstrap {
  get currentLanguage(): string {
    const lang = this.language;

    if (lang !== null && this.isLanguageSupported(lang)) {
      return lang;
    }

    if (this.isLanguageSupported(DEFAULT_LOCALE.isoCode)) {
      return DEFAULT_LOCALE.isoCode;
    }

    const firstLanguage = this.supportedLanguages[0];

    if (!firstLanguage) {
      //@TODO do not throw error in getter
      throw new Error('No language is available');
    }

    return firstLanguage.isoCode;
  }

  supportedLanguages: ILocale[];

  readonly onChange: IExecutor<string>;
  private language: string | null;
  private readonly localeMap: Map<string, Map<string, string>>;
  private readonly localeProviders: ILocaleProvider[];
  private reactionDisposer: IReactionDisposer | null;

  constructor() {
    super();

    this.supportedLanguages = [DEFAULT_LOCALE];
    this.language = null;
    this.reactionDisposer = null;
    this.onChange = new Executor();
    this.localeMap = new Map();
    this.localeProviders = [];

    makeObservable<LocalizationService, 'localeMap' | 'supportedLanguages' | 'language'>(this, {
      language: observable,
      supportedLanguages: observable,
      localeMap: observable.shallow, // observable.shallow - don't treat locales as observables
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
    if (this.supportedLanguages.length === 0) {
      this.supportedLanguages = [DEFAULT_LOCALE];
    }
  }

  setLanguage(lang: string) {
    this.language = lang;
  }

  readonly translate = <T extends TLocalizationToken | undefined>(token: T, fallback?: T, args: Record<string | number, any> = {}): T => {
    if (token === undefined) {
      return undefined as T;
    }

    let translation = this.localeMap.get(this.currentLanguage)?.get(token as TLocalizationToken);

    if (translation === undefined) {
      translation = this.localeMap.get(DEFAULT_LOCALE.isoCode)?.get(token as TLocalizationToken);
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

  override register(): void {
    this.setSupportedLanguages([
      {
        isoCode: 'en',
        name: 'English',
        nativeName: 'English',
      },
      {
        isoCode: 'ru',
        name: 'Russian',
        nativeName: 'Русский',
      },
      {
        isoCode: 'it',
        name: 'Italian',
        nativeName: 'Italiano',
      },
      {
        isoCode: 'zh',
        name: 'Chinese',
        nativeName: '中文',
      },
      {
        isoCode: 'fr',
        name: 'French',
        nativeName: 'Français',
      },
      {
        isoCode: 'vi',
        name: 'Vietnamese',
        nativeName: 'Tiếng Việt',
      },

    ]);
    this.addProvider(this.coreProvider.bind(this));
  }

  override async load(): Promise<void> {
    this.reactionDisposer = reaction(
      () => this.currentLanguage,
      lang => {
        this.loadLocale(lang);
      },
    );
    await this.loadLocale(DEFAULT_LOCALE.isoCode);
    await this.loadLocale(this.currentLanguage);
  }

  override dispose(): void {
    if (this.reactionDisposer) {
      this.reactionDisposer();
    }
  }

  async changeLocale(key: string): Promise<void> {
    const prevLocale = this.currentLanguage;
    if (key === this.currentLanguage) {
      return;
    }
    if (!this.isLanguageSupported(key)) {
      throw new Error(`Language '${key}' is not supported`);
    }

    await this.loadLocale(key);
    try {
      this.setLanguage(key);
      await this.onChange.execute(key);
    } catch (e) {
      this.setLanguage(prevLocale);
      throw e;
    }
  }

  private async coreProvider(locale: string) {
    switch (locale) {
      case 'ru':
        return (await import('./locales/ru.js')).default;
      case 'it':
        return (await import('./locales/it.js')).default;
      case 'zh':
        return (await import('./locales/zh.js')).default;
      case 'fr':
        return (await import('./locales/fr.js')).default;
      case 'vi':
        return (await import('./locales/vi.js')).default;
      default:
        return (await import('./locales/en.js')).default;
    }
  }

  private async loadLocale(localeKey: string): Promise<void> {
    if (this.localeMap.has(localeKey)) {
      return;
    }
    const locale = new Map<string, string>();

    for (const provider of this.localeProviders) {
      for (const [key, value] of await provider(localeKey)) {
        locale.set(key!, value!);
      }
    }
    this.localeMap.set(localeKey, locale);
  }
}
