/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IAutoLoginSessionAction } from './IAutoLoginSessionAction';

export function isAutoLoginSessionAction(obj: any): obj is IAutoLoginSessionAction {
  return obj && 'action' in obj && obj.action === 'auto-login';
}
