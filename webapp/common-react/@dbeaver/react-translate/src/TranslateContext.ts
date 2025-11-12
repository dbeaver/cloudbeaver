/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createContext } from 'react';
import type { LocalizationToken } from './LocalizationToken.js';

export type TranslateFn = <T extends LocalizationToken | undefined>(token: T, fallback?: T, args?: Record<string | number, any>) => T;
export const TranslateContext = createContext<{ translate: TranslateFn }>({
  translate: (key, fallback) => fallback || key,
});
