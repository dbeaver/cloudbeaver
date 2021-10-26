/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ContextGetter } from './ContextGetter';
import type { IContextProvider } from './IContextProvider';

export interface IContext extends IContextProvider {
  set: <T>(context: ContextGetter<T>, value: T) => this;
}
