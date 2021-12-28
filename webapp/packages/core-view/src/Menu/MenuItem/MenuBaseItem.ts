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
  private readonly isDisabled?: () => boolean;

  readonly label: string;
  readonly icon?: string;
  readonly tooltip?: string;
  readonly hidden?: boolean;

  get disabled(): boolean {
    return this.isDisabled?.() ?? false;
  }

  constructor(
    id: string,
    label: string,
    tooltip?: string,
    events?: IMenuItemEvents,
    isDisabled?: () => boolean
  ) {
    super(id, events);
    this.label = label;
    this.tooltip = tooltip;
    this.isDisabled = isDisabled;
  }
}
