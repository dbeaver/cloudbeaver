/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { type IDataContext } from '@cloudbeaver/core-data-context';

import type { IMenuItem } from './IMenuItem.js';

interface IMenuCustomItemCommonProperties<TExtraProps = unknown> {
  hidden?: boolean;
  disabled?: boolean;
  getExtraProps?: () => TExtraProps;
}

export type ICustomMenuItemComponent<TExtraProps = unknown> = React.FC<ICustomMenuItemProps<TExtraProps> & TExtraProps>;

export interface ICustomMenuItemProps<TExtraProps = unknown> {
  item: IMenuCustomItem<TExtraProps>;
  context: IDataContext;
  onClick?: (keepMenuOpen: boolean) => void;
  className?: string;
}

export interface IMenuCustomItemOptions<TExtraProps = unknown> extends IMenuCustomItemCommonProperties<TExtraProps> {
  id: string;
  getComponent: () => ICustomMenuItemComponent<TExtraProps>;
}

export interface IMenuCustomItem<TExtraProps = unknown> extends IMenuItem, IMenuCustomItemCommonProperties<TExtraProps> {
  getComponent?: () => ICustomMenuItemComponent<TExtraProps>;
}
