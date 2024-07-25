/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { isNotNullDefined, isObject } from '@cloudbeaver/core-utils';

export function isControlPresented(name: string | number | symbol | undefined, state: any, defaultValue?: any): boolean {
  if (!isObject(state) || !isNotNullDefined(state) || !isNotNullDefined(name)) {
    return true;
  }

  if (name in state) {
    return isNotNullDefined((state as Record<string | number | symbol, any>)[name]);
  }

  return defaultValue !== undefined;
}
