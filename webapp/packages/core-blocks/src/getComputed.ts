/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';

export function getComputed<T>(action: () => T, equals?: (a: T, b: T) => boolean): T {
  return computed(action, { equals }).get();
}
