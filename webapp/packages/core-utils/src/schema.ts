/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import * as z from 'zod';

const locales = new Map<string, any>([]);

export const schemaExtra = {
  stringedBoolean() {
    return z.union([z.enum(['false', '0']).transform(() => false), z.boolean(), z.string(), z.number()]).pipe(z.coerce.boolean());
  },
  async loadLocale(code: string): Promise<any | undefined> {
    let locale: any | undefined;

    switch (code) {
      case 'ru':
        locale = await import('zod/v4/locales/ru.js');
        break;
      case 'en':
        locale = await import('zod/v4/locales/en.js');
        break;
      case 'it':
        locale = await import('zod/v4/locales/it.js');
        break;
      case 'zh':
        locale = await import('zod/v4/locales/zh-CN.js');
        break;
      case 'de':
        locale = await import('zod/v4/locales/de.js');
        break;
      case 'fr':
        locale = await import('zod/v4/locales/fr.js');
        break;
      case 'vi':
        locale = await import('zod/v4/locales/vi.js');
        break;
    }

    if (locale) {
      locales.set(code, locale.default);
      return locale.default;
    }
  },
  async setLocale(code: string): Promise<void> {
    const locale = locales.get(code) ?? (await this.loadLocale(code));

    if (locale) {
      z.config(locale());
      return;
    }

    console.warn(`Zod locale "${code}" not found.`);
  },
};

export { z as schema };
