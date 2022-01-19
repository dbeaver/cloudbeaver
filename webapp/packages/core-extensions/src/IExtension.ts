/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EXTENSION_SYMBOL, EXTENSION_TYPE_SYMBOL } from './constants';

export interface IExtension<T> {
  [EXTENSION_SYMBOL]: symbol;
  [EXTENSION_TYPE_SYMBOL]?: T;
}
