/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { MenuInitialState } from 'reakit/Menu';

import { TLocalizationToken } from '@cloudbeaver/core-localization';
import { Style } from '@cloudbeaver/core-theming';

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
  icon?: string; // path to icon or svg icon name
  panel?: IMenuPanel; // if menu has sub-items
}

export type MenuTriggerProps = PropsWithChildren<{
  panel: IMenuPanel;
  style?: Style[];
  placement?: MenuInitialState['placement'];
  modal?: boolean;
}> & Omit<ButtonHTMLAttributes<any>, 'style'>;
