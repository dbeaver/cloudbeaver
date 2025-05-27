/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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
  const specificKeys = getOSSpecificKeys(keyBinding);
  let keys: string[] = [];

  if (keyBinding.keys !== undefined) {
    keys = Array.isArray(keyBinding.keys) ? keyBinding.keys : [keyBinding.keys];
  }

  if (specificKeys !== undefined) {
    if (Array.isArray(specificKeys)) {
      keys.push(...specificKeys);
    } else {
      keys.push(specificKeys);
    }
  }

  return keys;
}

export function getOSSpecificKeys(keyBinding: IKeyBinding): string | string[] | undefined {
  const OS = getOS();
  if (OS === OperatingSystem.windowsOS) {
    return keyBinding.keysWin;
  }

  if (OS === OperatingSystem.macOS) {
    return keyBinding.keysMac;
  }

  return undefined;
}
