/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useObjectRef, useUserData } from '@cloudbeaver/core-blocks';

import { type ITreeSettings, useTreeSettings } from './useTreeSettings.js';

function validateRecord(data: unknown): boolean {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

export function useUserTreeSettings(settingsId: string): ITreeSettings {
  const ref = useObjectRef({
    persistedSettings: null as Record<string, unknown> | null,
    treeSettings: null as ITreeSettings | null,
  });

  const persistedSettings = useUserData<Record<string, unknown>>(
    settingsId,
    () => ({}),
    (data) => {
      ref.treeSettings?.replace(data);
    },
    validateRecord,
  );

  ref.persistedSettings = persistedSettings;

  const treeSettings = useTreeSettings({
    initialSettings: persistedSettings,
    onChange(newSettings) {
      const current = ref.persistedSettings;

      if (!current) {
        return;
      }

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

  ref.treeSettings = treeSettings;

  return treeSettings;
}
