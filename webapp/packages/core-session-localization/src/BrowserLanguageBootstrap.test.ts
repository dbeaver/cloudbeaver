/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { afterEach, describe, expect, test, vi } from 'vitest';

import { LocalizationService } from '@cloudbeaver/core-localization';
import { SESSION_SETTINGS_LAYER } from '@cloudbeaver/core-root';
import { SettingsProviderService, SettingsResolverService, UserSettingsResolverService } from '@cloudbeaver/core-settings';
import { SettingsLocalizationService } from '@cloudbeaver/core-settings-localization';

import { BrowserLanguageBootstrap } from './BrowserLanguageBootstrap.js';
import { BrowserLanguageSettingsSource } from './BrowserLanguageSettingsSource.js';

const languages = [
  { isoCode: 'en', name: 'English' },
  { isoCode: 'fr', name: 'French' },
  { isoCode: 'zh', name: 'Chinese' },
];

afterEach(() => vi.restoreAllMocks());

describe('browser language fallback', () => {
  test.each([
    [['de-DE', 'zh-CN', 'fr'], 'zh'],
    [['FR-ca', 'zh'], 'fr'],
    [['de', 'es'], undefined],
    [[], undefined],
  ])('matches ordered supported languages for %j', (preferred, expected) => {
    const source = new BrowserLanguageSettingsSource(preferred, languages);

    expect(source.getValue('core.localization.language')).toBe(expected);
    expect(source.has('core.localization.language')).toBe(expected !== undefined);
    expect(source.has('another.setting')).toBe(false);
  });

  test.each([
    [undefined, 'zh'],
    ['fr', 'fr'],
  ])('initializes the resolved language without writing a preference (%s)', (savedLanguage, expected) => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['zh-CN', 'en']);
    const localization = new LocalizationService();
    localization.setSupportedLanguages(languages);
    const defaults = new SettingsResolverService();
    const personal = new UserSettingsResolverService();

    if (savedLanguage) {
      personal.addResolver(SESSION_SETTINGS_LAYER, new BrowserLanguageSettingsSource([savedLanguage], languages));
    }

    const settings = new SettingsLocalizationService(new SettingsProviderService(defaults, personal));
    const save = vi.spyOn(settings, 'changeLanguage');
    const bootstrap = new BrowserLanguageBootstrap(localization, defaults, settings);
    bootstrap.register();
    bootstrap.load();

    expect(localization.currentLanguage).toBe(expected);
    expect(save).not.toHaveBeenCalled();
    bootstrap.dispose();
    expect(defaults.has('core.localization.language')).toBe(false);
  });
});
