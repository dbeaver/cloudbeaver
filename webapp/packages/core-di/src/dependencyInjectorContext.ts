/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncContextLoader } from '@cloudbeaver/core-executor';

import type { IServiceConstructor } from './IApp.js';

export const dependencyInjectorContext: ISyncContextLoader<<T>(ctor: IServiceConstructor<T>) => T> = function dependencyInjectorContext() {
  throw new Error('Implementation not provided \n Use addContextCreator to add addDIContext implementation to context');
};
