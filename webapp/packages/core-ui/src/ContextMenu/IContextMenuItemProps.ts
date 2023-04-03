/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import type { MenuStateReturn } from 'reakit/ts';

import type { ComponentStyle } from '@cloudbeaver/core-theming';
import type { IMenuData, IMenuItem } from '@cloudbeaver/core-view';

export interface IContextMenuItemProps {
  item: IMenuItem;
  menu: MenuStateReturn;
  menuData: IMenuData;
  style?: ComponentStyle;
  onClick: () => void;
}