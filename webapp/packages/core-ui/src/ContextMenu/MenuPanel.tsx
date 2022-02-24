/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { Menu, MenuStateReturn } from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { getComputed } from '@cloudbeaver/core-blocks';
import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';
import { IMenuData, IMenuItem, MenuActionItem } from '@cloudbeaver/core-view';

import { MenuEmptyItem } from './MenuEmptyItem';
import { menuPanelStyles } from './menuPanelStyles';


export interface IMenuPanelProps {
  menuData: IMenuData;
  menu: MenuStateReturn; // from reakit useMenuState
  children: (item: IMenuItem) => React.ReactNode;
  panelAvailable?: boolean;
  rtl?: boolean;
  style?: ComponentStyle;
}

export const MenuPanel = observer<IMenuPanelProps>(function MenuPanel({
  menuData,
  menu,
  panelAvailable = true,
  rtl,
  children,
  style,
}) {
  const styles = useStyles(menuPanelStyles, style);
  const visible = menu.visible;

  if (!visible) {
    return null;
  }

  let items: IMenuItem[] = [];

  if (panelAvailable) {
    items = menuData.items;
  }

  const hasBindings = getComputed(() => items.some(
    item => item instanceof MenuActionItem && item.action.binding !== null
  ));

  return styled(styles)(
    <Menu {...menu} aria-label={menuData.menu.label} visible={panelAvailable}>
      <menu-box dir={rtl ? 'rtl' : undefined} {...use({ hasBindings })}>
        {items.length === 0 && (
          <MenuEmptyItem menu={menu} style={style} />
        )}
        {items.map(item => children(item))}
      </menu-box>
    </Menu>
  );
});