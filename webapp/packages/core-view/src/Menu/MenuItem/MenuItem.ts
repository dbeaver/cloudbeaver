/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { uuid } from '@cloudbeaver/core-utils';

import type { IMenuItem } from './IMenuItem';

export class MenuItem implements IMenuItem {
  readonly id: string;

  constructor(id?: string) {
    this.id = id ?? uuid();
  }
}
