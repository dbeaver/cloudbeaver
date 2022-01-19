/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { uuid } from '@cloudbeaver/core-utils';

import type { IMenuItem, IMenuItemEvents } from './IMenuItem';

export abstract class MenuItem implements IMenuItem {
  readonly id: string;
  readonly events?: IMenuItemEvents;

  constructor(id?: string, events?: IMenuItemEvents) {
    this.id = id ?? uuid();
    this.events = events;
  }
}
