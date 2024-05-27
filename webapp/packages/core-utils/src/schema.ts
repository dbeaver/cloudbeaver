/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import i18next from 'i18next';
import * as z from 'zod';
import { zodI18nMap } from 'zod-i18n-map';

i18next.init({
  fallbackLng: 'en',
  resources: {},
});
z.setErrorMap(zodI18nMap);

export const schemaExtra = {
  stringedBoolean() {
    return z.union([z.enum(['false', '0']).transform(() => false), z.boolean(), z.string(), z.number()]).pipe(z.coerce.boolean());
  },

  async loadLocale(code: string) {
    let translation = {};
    switch (code) {
      case 'ru':
        translation = await import('zod-i18n-map/locales/ru/zod.json');
        break;
      case 'en':
        translation = await import('zod-i18n-map/locales/en/zod.json');
        break;
      case 'it':
        translation = await import('zod-i18n-map/locales/it/zod.json');
        break;
      case 'zh':
        translation = await import('zod-i18n-map/locales/zh-CN/zod.json');
        break;
    }

    i18next.addResourceBundle(code, 'zod', translation, true);
  },

  async setLocale(code: string) {
    i18next.changeLanguage(code);
  },
};
export { z as schema };
