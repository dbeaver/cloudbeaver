/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IKeyBinding } from './IKeyBinding.js';
import { APPLIED_DIVIDER, transformKeys } from './transformKeys.js';

export function getShortcutStringFromBinding(keyBinding: IKeyBinding): string {
  return transformKeys(keyBinding).join(APPLIED_DIVIDER);
}
