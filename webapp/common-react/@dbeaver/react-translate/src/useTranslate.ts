/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { use } from 'react';
import { TranslateContext, type TranslateFn } from './TranslateContext.js';

export function useTranslate(): TranslateFn {
  const context = use(TranslateContext);
  return context.translate;
}
