/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { transformKeys } from './transformKeys.js';
import type { IKeyBinding } from './IKeyBinding.js';

export function getShortcutsString(binding: IKeyBinding, divider: string = ' • '): string {
  return transformKeys(binding)
    .map(shortcut => `(${shortcut})`)
    .join(divider);
}
