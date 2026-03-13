/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useEffect, useRef } from 'react';

import { useUserData } from '@cloudbeaver/core-blocks';

import { type ITreeSettings, useTreeSettings } from './useTreeSettings.js';

function validateRecord(data: unknown): boolean {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
}

export function useUserTreeSettings(settingsId: string): ITreeSettings {
  const persistedSettingsRef = useRef<Record<string, unknown> | null>(null);
  const treeSettingsRef = useRef<ITreeSettings | null>(null);

  const persistedSettings = useUserData<Record<string, unknown>>(
    settingsId,
    () => ({}),
    data => {
      treeSettingsRef.current?.replace(data);
    },
    validateRecord,
  );

  const treeSettings = useTreeSettings({
    initialSettings: persistedSettings,
    onChange(newSettings) {
      const current = persistedSettingsRef.current;

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

  useEffect(() => {
    persistedSettingsRef.current = persistedSettings;
    treeSettingsRef.current = treeSettings;
  });

  return treeSettings;
}
