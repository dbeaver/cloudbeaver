/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { IMenuBaseItem } from './IMenuBaseItem';
import type { IMenuItemEvents } from './IMenuItem';
import { MenuItem } from './MenuItem';

export class MenuBaseItem extends MenuItem implements IMenuBaseItem {
  readonly label: string;
  readonly icon?: string;
  readonly tooltip?: string;
  readonly hidden?: boolean;
  readonly disabled?: boolean;

  constructor(
    id: string,
    label: string,
    tooltip?: string,
    events?: IMenuItemEvents
  ) {
    super(id, events);
    this.label = label;
    this.tooltip = tooltip;
  }
}
