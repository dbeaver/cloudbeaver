/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EXTENSION_SYMBOL } from './constants';
import type { IExtension } from './IExtension';

export function createExtension<T>(
  extension: Record<string, any>,
  key: symbol
): IExtension<T> {
  return Object.assign(extension, { [EXTENSION_SYMBOL]: key });
}

export function isExtension<T>(
  obj: Record<any, any> | IExtension<T>,
  key?: symbol
): obj is IExtension<T> {
  if (!(EXTENSION_SYMBOL in obj)) {
    return false;
  }
  if (key && (obj as IExtension<T>)[EXTENSION_SYMBOL] !== key) {
    return false;
  }
  return true;
}
