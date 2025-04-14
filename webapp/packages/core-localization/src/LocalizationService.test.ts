/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { beforeEach, describe, expect, it } from 'vitest';

import { DEFAULT_LOCALE } from './DEFAULT_LOCALE.js';
import { type ILocale } from './ILocale.js';
import { LocalizationService } from './LocalizationService.js';

describe('LocalizationService', () => {
  let service: LocalizationService;

  beforeEach(() => {
    service = new LocalizationService();
  });

  it('should initialize with default locale', () => {
    service.register();
    expect(service.currentLanguage).toBe(DEFAULT_LOCALE.isoCode);
    expect(service.supportedLanguages.length).toBeGreaterThan(0);
  });

  it('should set supported languages', () => {
    const locales: ILocale[] = [
      { isoCode: 'de', name: 'German', nativeName: 'Deutsch' },
      { isoCode: 'es', name: 'Spanish', nativeName: 'Español' },
    ];

    service.setSupportedLanguages(locales);
    expect(service.supportedLanguages.length).toBe(2);
  });

  it('should set default to first supported language', () => {
    const locales: ILocale[] = [
      { isoCode: 'de', name: 'German', nativeName: 'Deutsch' },
      { isoCode: 'es', name: 'Spanish', nativeName: 'Español' },
    ];

    service.setSupportedLanguages(locales);
    expect(service.currentLanguage).toBe('de');
  });

  it('should return default locale if the current language is not supported', () => {
    service.setLanguage('es');
    expect(service.currentLanguage).toBe(DEFAULT_LOCALE.isoCode);
  });

  it('should throw error if there are no supported languages', () => {
    service.supportedLanguages = [];
    expect(() => service.currentLanguage).toThrowError('No language is available');
  });

  it('should change the current language', async () => {
    service.register();
    await service.changeLocale('ru');
    expect(service.currentLanguage).toBe('ru');
  });

  it('should throw an error when changing to an unsupported language', async () => {
    await expect(service.changeLocale('jp')).rejects.toThrowError("Language 'jp' is not supported");
  });

  it('should translate a token with a fallback', () => {
    const token = 'greeting';
    const fallback = 'Hello, World!';

    service.changeLocale('en');
    service['localeMap'].set('en', new Map([[token, 'Hello']]));

    const translation = service.translate(token, fallback);
    expect(translation).toBe('Hello');
  });

  it('should return fallback when translation is missing', () => {
    const token = 'nonexistent_token';
    const fallback = 'Fallback';

    const translation = service.translate(token, fallback);
    expect(translation).toBe(fallback);
  });

  it('should replace args in the translation string', () => {
    const token = 'welcome_message';
    const translationString = 'Welcome, {arg:name}!';
    service['localeMap'].set('en', new Map([[token, translationString]]));
    service.setLanguage('en');

    const translation = service.translate(token, undefined, { name: 'John' });
    expect(translation).toBe('Welcome, John!');
  });

  it('should replace multiple args in the translation string', () => {
    const token = 'greeting_message';
    const translationString = 'Hello, {arg:firstName} {arg:lastName}!';
    service['localeMap'].set('en', new Map([[token, translationString]]));
    service.setLanguage('en');

    const translation = service.translate(token, undefined, { firstName: 'John', lastName: 'Doe' });
    expect(translation).toBe('Hello, John Doe!');
  });

  it('should return true for supported language', () => {
    service.register();

    expect(service.isLanguageSupported('en')).toBe(true);
    expect(service.isLanguageSupported('ru')).toBe(true);
  });

  it('should return false for unsupported language', () => {
    service.register();

    expect(service.isLanguageSupported('n/a')).toBe(false);
  });
});
