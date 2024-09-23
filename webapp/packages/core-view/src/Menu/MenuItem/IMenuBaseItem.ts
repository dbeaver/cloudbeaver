/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IMenuItem } from './IMenuItem.js';

interface IMenuBaseItemCommonProperties<TExtraProps = unknown> {
  label?: string;
  icon?: string;
  tooltip?: string;
  hidden?: boolean;
  disabled?: boolean;
  getExtraProps?: () => TExtraProps;
  iconComponent?: () => MenuBaseItemIconComponent<TExtraProps>;
}

export type MenuBaseItemIconComponent<TExtraProps = unknown> = React.FC<IIconComponentProps<TExtraProps> & TExtraProps>;

export interface IIconComponentProps<TExtraProps = unknown> {
  item: IMenuBaseItem<TExtraProps>;
  className?: string;
}

export interface IMenuBaseItemOptions<TExtraProps = unknown> extends IMenuBaseItemCommonProperties<TExtraProps> {
  id: string;
  label: string;
}

export interface IMenuBaseItem<TExtraProps = unknown> extends IMenuItem, IMenuBaseItemCommonProperties<TExtraProps> {
  label: string;
}
