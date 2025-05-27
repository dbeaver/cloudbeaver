/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { formatKeyToDisplayKey } from './formatKeyToDisplayKey.js';
import { getCommonAndOSSpecificKeys } from './getCommonAndOSSpecificKeys.js';
import type { IKeyBinding } from './IKeyBinding.js';

const SOURCE_DIVIDER_REGEXP = /\+/gi;
export const APPLIED_DIVIDER = ' + ';

export function transformKeys(keyBinding: IKeyBinding): string[] {
  return getCommonAndOSSpecificKeys(keyBinding).map(shortcut =>
    shortcut.split(SOURCE_DIVIDER_REGEXP).map(formatKeyToDisplayKey).join(APPLIED_DIVIDER).toLocaleUpperCase(),
  );
}
