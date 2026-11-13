/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { ISyncContextLoader } from '@cloudbeaver/core-executor';

import type { ServiceType } from './Service.js';

export const dependencyInjectorContext: ISyncContextLoader<<T>(ctor: ServiceType<T>) => T> = function dependencyInjectorContext() {
  throw new Error('Implementation not provided \n Use addContextCreator to add addDIContext implementation to context');
};
