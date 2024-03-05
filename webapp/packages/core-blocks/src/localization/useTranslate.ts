/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useService } from '@cloudbeaver/core-di';
import { LocalizationService, TLocalizationToken } from '@cloudbeaver/core-localization';

export function useTranslate(): <T extends TLocalizationToken | undefined>(token: T, fallback?: T, args?: Record<string | number, any>) => T {
  const localizationService = useService(LocalizationService);

  return localizationService.translate;
}
