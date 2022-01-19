/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

export function flat<T extends any[]>(array: T): Array<FlatArray<T, 1>> {
  if (array.flat) {
    return array.flat();
  }

  // EDGE workaround
  return array.reduce((acc, val) => acc.concat(val), []);
}
