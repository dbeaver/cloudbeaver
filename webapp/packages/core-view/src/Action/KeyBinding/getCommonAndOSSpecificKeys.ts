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

  return Array.from(new Set([...getOSSpecificKeys(keyBinding), ...getKeys(keyBinding.keys)]));
}

export function getOSSpecificKeys(keyBinding: IKeyBinding): string[] {
  const OS = getOS();

  if (OS === OperatingSystem.windowsOS) {
    return getKeys(keyBinding.keysWin);
  }

  if (OS === OperatingSystem.macOS) {
    return getKeys(keyBinding.keysMac);
  }

  if (OS === OperatingSystem.linuxOS) {
    return getKeys(keyBinding.keysLinux);
  }

  return [];
}

function getKeys(keys: string[] | string | undefined): string[] {
  return (Array.isArray(keys) ? keys : [keys ?? '']).filter(Boolean);
}
