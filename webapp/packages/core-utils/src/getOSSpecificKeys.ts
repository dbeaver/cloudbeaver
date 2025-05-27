/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { getOS, OperatingSystem } from './getOS.js';
import type { IKeyBinding } from './IKeyBinding.js';

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
