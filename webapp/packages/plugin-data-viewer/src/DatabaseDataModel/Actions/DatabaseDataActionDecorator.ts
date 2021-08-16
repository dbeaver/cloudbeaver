/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IDatabaseDataActionInterface } from '../IDatabaseDataAction';

export function databaseDataAction<T extends IDatabaseDataActionInterface<any, any, any>>() {
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  return <U extends T>(constructor: U) => { };
}
