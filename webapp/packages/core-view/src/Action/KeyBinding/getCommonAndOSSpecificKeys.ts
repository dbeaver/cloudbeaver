/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { getOS, OperatingSystem } from '@cloudbeaver/core-utils';

import type { IKeyBinding } from './IKeyBinding.js';

export function getCommonAndOSSpecificKeys(keyBinding: IKeyBinding | undefined): string[] {
  if (keyBinding === undefined) {
    return [];
  }

  return [...getOSSpecificKeys(keyBinding), ...getKeys(keyBinding.keys)];
}

export function getOSSpecificKeys(keyBinding: IKeyBinding): string[] {
  const OS = getOS();
  const keys: string[] = [];

  if (OS === OperatingSystem.windowsOS) {
    keys.push(...getKeys(keyBinding.keysWin));
  }

  if (OS === OperatingSystem.macOS) {
    keys.push(...getKeys(keyBinding.keysMac));
  }

  return keys;
}

function getKeys(keys: string[] | string | undefined): string[] {
  return Array.isArray(keys) ? keys : [keys ?? ''].filter(Boolean);
}
