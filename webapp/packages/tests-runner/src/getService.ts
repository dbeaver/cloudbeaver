/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IServiceConstructor } from '@cloudbeaver/core-di';

import type { IApplication } from './createApp.js';

export function getService<T>(app: IApplication, ctor: IServiceConstructor<T>): T {
  return app.serviceProvider.getService(ctor);
}
