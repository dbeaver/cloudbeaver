/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import type { MenuInitialState } from 'reakit/Menu';

import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import type { Style } from '@cloudbeaver/core-theming';

import type { MenuItemType } from './models/MenuOptionsStore';

export type MenuMod = 'primary' | 'surface' | 'secondary';

export interface IMenuPanel {
  id: string;
  title?: TLocalizationToken;
  menuItems: IMenuItem[];
}

export interface IMenuItem {
  id: string;
  title: TLocalizationToken;
  onClick?: () => void; // it is not mandatory if it is just opens submenu
  isDisabled?: boolean;
  isHidden?: boolean;
  keepMenuOpen?: boolean;
  icon?: string; // path to icon or svg icon name
  tooltip?: string;
  panel?: IMenuPanel; // if menu has sub-items
  type?: MenuItemType;
  separator?: boolean;
  isChecked?: boolean;
}

export type MenuTriggerProps = PropsWithChildren<{
  panel: IMenuPanel;
  style?: Style[];
  placement?: MenuInitialState['placement'];
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
  onVisibleSwitch?: (visible: boolean) => void;
}> & Omit<ButtonHTMLAttributes<any>, 'style'>;
