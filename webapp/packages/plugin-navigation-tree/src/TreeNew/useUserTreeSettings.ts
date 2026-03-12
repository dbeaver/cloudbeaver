/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef } from 'react';

import { UserDataService, UserInfoResource } from '@cloudbeaver/core-authentication';
import { useObjectRef, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { type ITreeSettings, useTreeSettings } from './useTreeSettings.js';

function validateRecord(data: unknown): boolean {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

export function useUserTreeSettings(settingsId: string): ITreeSettings {
  const userDataService = useService(UserDataService);
  useResource(useUserTreeSettings, UserInfoResource, undefined);

  const persistedSettings = userDataService.getUserData<Record<string, unknown>>(
    settingsId,
    () => ({}),
    validateRecord,
  );

  const ref = useObjectRef({ persistedSettings });
  ref.persistedSettings = persistedSettings;

  const treeSettings = useTreeSettings({
    initialSettings: persistedSettings,
    onChange(newSettings) {
      const current = ref.persistedSettings;

      for (const key of Object.keys(current)) {
        if (!newSettings.has(key)) {
          delete current[key];
        }
      }

      for (const [key, value] of newSettings) {
        current[key] = value;
      }
    },
  });

  const prevSettingsRef = useRef(persistedSettings);

  useEffect(() => {
    if (prevSettingsRef.current !== persistedSettings) {
      prevSettingsRef.current = persistedSettings;
      treeSettings.replace(persistedSettings);
    }
  }, [persistedSettings, treeSettings]);

  return treeSettings;
}
