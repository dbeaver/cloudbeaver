/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { LocalizationToken } from './LocalizationToken.js';

export function interpolateTranslation(template: string, args?: Record<string | number, unknown>): string {
  if (!args) {
    return template;
  }

  let result = template;

  for (const [key, value] of Object.entries(args)) {
    if (value != null) {
      result = result.split(`{arg:${key}}`).join(String(value));
    }
  }

  return result;
}

export function defaultTranslateFn<T extends LocalizationToken | undefined>(token: T, fallback?: T, args?: Record<string | number, unknown>): T {
  const result = fallback || token;
  if (result && args) {
    return interpolateTranslation(result as string, args) as T;
  }
  return result;
}

export type TranslateFn = <T extends LocalizationToken | undefined>(token: T, fallback?: T, args?: Record<string | number, unknown>) => T;
export const TranslateContext = createContext<{ translate: TranslateFn }>({
  translate: defaultTranslateFn,
});
