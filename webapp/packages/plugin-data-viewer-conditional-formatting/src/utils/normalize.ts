/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { clamp } from '@dbeaver/js-helpers';

export function normalize(x: number, a: number, b: number): number {
  if (a === b) {
    return 0.5;
  }
  return clamp((x - a) / (b - a), 0, 1);
}
