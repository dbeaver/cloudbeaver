/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { IReactionDisposer, makeObservable, observable, reaction } from 'mobx';

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { Executor, IExecutor } from '@cloudbeaver/core-executor';

import { DEFAULT_LOCALE } from './DEFAULT_LOCALE';
import type { ILocale } from './ILocale';
import type { ILocaleProvider } from './ILocaleProvider';
import type { TLocalizationToken } from './TLocalizationToken';

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

    return this.supportedLanguages[0].isoCode;
  }

  supportedLanguages: ILocale[];

  readonly onChange: IExecutor<string>;
  private language: string | null;
  private readonly localeMap: Map<string, Map<string, string>> = new Map();
  private readonly localeProviders: ILocaleProvider[] = [];
  private reactionDisposer: IReactionDisposer | null;

  constructor() {
    super();

    this.supportedLanguages = [DEFAULT_LOCALE];
    this.language = null;
    this.reactionDisposer = null;
    this.onChange = new Executor();

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

  register(): void {
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
    ]);
    this.addProvider(this.coreProvider.bind(this));
    this.reactionDisposer = reaction(
      () => this.currentLanguage,
      lang => {
        this.loadLocale(lang);
      },
      {
        fireImmediately: true,
      },
    );
  }

  async load(): Promise<void> {
    await this.loadLocale(DEFAULT_LOCALE.isoCode);
    await this.loadLocale(this.currentLanguage);
  }

  dispose(): void {
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
        return (await import('./locales/ru')).default;
      case 'it':
        return (await import('./locales/it')).default;
      case 'zh':
        return (await import('./locales/zh')).default;
      default:
        return (await import('./locales/en')).default;
    }
  }

  private async loadLocale(localeKey: string): Promise<void> {
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
}
