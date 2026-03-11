/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UserDataService } from '@cloudbeaver/core-authentication';
import { useService } from '@cloudbeaver/core-di';

import { type ITreeSettings, useTreeSettings } from './useTreeSettings.js';

function validateRecord(data: unknown): boolean {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

export function useUserTreeSettings(settingsId: string): ITreeSettings {
  const userDataService = useService(UserDataService);

  const persistedSettings = userDataService.getUserData<Record<string, unknown>>(
    settingsId,
    () => ({}),
    validateRecord,
  );

  return useTreeSettings({
    initialSettings: persistedSettings,
    onChange(newSettings) {
      for (const key of Object.keys(persistedSettings)) {
        if (!newSettings.has(key)) {
          delete persistedSettings[key];
        }
      }

      for (const [key, value] of newSettings) {
        persistedSettings[key] = value;
      }
    },
  });
}
