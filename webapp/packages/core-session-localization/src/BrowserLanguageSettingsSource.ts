/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { LocalizationService } from '@cloudbeaver/core-localization';
import { SettingsSource } from '@cloudbeaver/core-settings';

const LANGUAGE_SETTING = 'core.localization.language';

export class BrowserLanguageSettingsSource extends SettingsSource {
  private readonly language: string | undefined;

  constructor(preferredLanguages: readonly string[], supportedLanguages: Readonly<LocalizationService['supportedLanguages']>) {
    super();

    for (const language of preferredLanguages) {
      const tag = language.toLowerCase();
      const match =
        supportedLanguages.find(locale => locale.isoCode.toLowerCase() === tag) ??
        supportedLanguages.find(locale => locale.isoCode.toLowerCase() === tag.split('-')[0]);

      if (match) {
        this.language = match.isoCode;
        break;
      }
    }
  }

  has(key: string): boolean {
    return key === LANGUAGE_SETTING && this.language !== undefined;
  }

  getValue(key: string): string | undefined {
    return this.has(key) ? this.language : undefined;
  }

  protected getSnapshot(): Record<string, string> {
    return this.language === undefined ? {} : { [LANGUAGE_SETTING]: this.language };
  }
}
