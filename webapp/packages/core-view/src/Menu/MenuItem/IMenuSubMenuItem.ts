/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import type { IMenu } from '../IMenu';
import type { IMenuItem, IMenuItemEvents } from './IMenuItem';

export interface IMenuSubMenuEvents extends IMenuItemEvents {
  onOpen?: () => void;
}

export interface IMenuSubMenuItemProperties<TExtraProps = unknown> {
  menu: IMenu;
  label?: string;
  icon?: string;
  tooltip?: string;
  getExtraProps?: () => TExtraProps;
  iconComponent?: () => MenuSubMenuItemIconComponent<TExtraProps>;
}

export interface IMenuSubMenuItem<TExtraProps = unknown> extends IMenuSubMenuItemProperties<TExtraProps>, IMenuItem {
  events?: IMenuSubMenuEvents;
}

export type MenuSubMenuItemIconComponent<TExtraProps = unknown>
  = React.FC<ISubMenuIconComponentProps<TExtraProps> & TExtraProps>;

export interface ISubMenuIconComponentProps<TExtraProps = unknown> {
  item: IMenuSubMenuItem<TExtraProps>;
  style?: ComponentStyle;
  className?: string;
}

export type IMenuSubMenuItemOptions<TExtraProps = unknown> = IMenuSubMenuItemProperties<TExtraProps>;