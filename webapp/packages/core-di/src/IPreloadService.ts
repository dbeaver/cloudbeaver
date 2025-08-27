/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { createService } from '@wroud/di';

export interface IPreloadService {
  register?(): void | Promise<void>;
  load?(): void | Promise<void>;
}
export const IPreloadService = createService<IPreloadService>('IPreloadService');
