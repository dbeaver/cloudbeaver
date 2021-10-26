/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenu } from './IMenu';

export function createMenu(id: string, label: string): IMenu {
  return {
    id: `@menu/${id}`,
    label,
  };
}
