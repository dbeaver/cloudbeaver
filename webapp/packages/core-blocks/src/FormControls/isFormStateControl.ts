/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IFormStateControl } from './IFormStateControl.js';

export function isFormStateControl<TState extends Record<string, any>, TKey extends keyof TState>(
  props: any,
): props is IFormStateControl<TState, TKey> {
  return 'name' in props && 'state' in props;
}
