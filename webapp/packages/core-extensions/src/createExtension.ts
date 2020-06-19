/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EXTENSION_SYMBOL } from './constants';
import { IExtension } from './IExtension';

export function createExtension<T>(
  extension: object,
  key: symbol
): IExtension<T> {
  return Object.assign(extension, { [EXTENSION_SYMBOL]: key });
}

export function isExtension<T>(
  obj: any,
  key?: symbol,
): obj is IExtension<T> {
  if (!(EXTENSION_SYMBOL in obj)) {
    return false;
  }
  if (key && obj[EXTENSION_SYMBOL] !== key) {
    return false;
  }
  return true;
}
