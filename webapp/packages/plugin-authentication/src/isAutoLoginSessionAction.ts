/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAutoLoginSessionAction } from './IAutoLoginSessionAction.js';

export function isAutoLoginSessionAction(obj: unknown): obj is IAutoLoginSessionAction {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'action' in obj &&
    obj.action === 'auto-login' &&
    'task-id' in obj &&
    typeof obj['task-id'] === 'string'
  );
}
