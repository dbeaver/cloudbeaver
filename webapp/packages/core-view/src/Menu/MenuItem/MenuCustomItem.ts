/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ICustomMenuItemComponent, IMenuCustomItem, IMenuCustomItemOptions } from './IMenuCustomItem';
import type { IMenuItemEvents } from './IMenuItem';
import { MenuItem } from './MenuItem';

interface IMenuCustomItemPropertyGetters<TExtraProps = unknown> {
  getExtraProps?: () => TExtraProps;
  isDisabled?: () => boolean;
}

export class MenuCustomItem<TExtraProps = unknown> extends MenuItem implements IMenuCustomItem<TExtraProps> {
  private readonly isDisabled?: () => boolean;

  readonly hidden?: boolean;
  readonly getComponent: () => ICustomMenuItemComponent<TExtraProps>;
  readonly getExtraProps?: () => TExtraProps;

  get disabled(): boolean {
    return this.isDisabled?.() ?? false;
  }

  constructor(
    options: IMenuCustomItemOptions<TExtraProps>,
    events?: IMenuItemEvents,
    getters?: IMenuCustomItemPropertyGetters<TExtraProps>,
  ) {
    super(options.id, events);
    this.getComponent = options.getComponent;
    this.isDisabled = getters?.isDisabled;
    this.getExtraProps = getters?.getExtraProps;
  }
}
