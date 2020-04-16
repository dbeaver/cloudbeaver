/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useService } from '@dbeaver/core/di';

import { LocalizationService } from './LocalizationService';
import { TLocalizationToken } from './TLocalizationToken';

export function useTranslate(): (token: TLocalizationToken) => string {
  return useService(LocalizationService).translate;
}

export function useLocale<T>(selector: TLocalizationToken): string {
  const translate = useTranslate();
  return translate(selector);
}
