/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';

import type { IndexedDB } from './IndexedDB.js';

@injectable()
export class IndexedDBService {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  register(db: IndexedDB): void {
    // TODO: implement
  }
}
