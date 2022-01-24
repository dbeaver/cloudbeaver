/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import { MenuItem, MenuSeparator, MenuStateReturn } from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { ComponentStyle, joinStyles, useStyles } from '@cloudbeaver/core-theming';
import { IMenuItem, IMenuData, MenuSubMenuItem, MenuSeparatorItem, MenuActionItem, MenuBaseItem } from '@cloudbeaver/core-view';

import { MenuActionElement } from './MenuActionElement';
import { MenuItemElement } from './MenuItemElement';
import { MenuPanel } from './MenuPanel';
import { menuPanelStyles } from './menuPanelStyles';
import { SubMenuElement } from './SubMenuElement';


export interface IMenuItemRendererProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  item: IMenuItem;
  menuData: IMenuData;
  menu: MenuStateReturn; // from reakit useMenuState
  onItemClose?: () => void;
  style?: ComponentStyle;
}

export const MenuItemRenderer = observer<IMenuItemRendererProps>(function MenuItemRenderer({
  item, menuData, menu, onItemClose, style,
}) {
  const styles = useStyles(menuPanelStyles, style);
  const onClick = useCallback(() => {
    item.events?.onSelect?.();

    if (!(item instanceof MenuSubMenuItem)) {
      onItemClose?.();
    }
  }, [item, onItemClose]);

  if (item instanceof MenuSubMenuItem) {
    return styled(styles)(
      <MenuItem
        {...menu}
        {...use({ hidden: item.hidden })}
        id={item.id}
        aria-label={item.menu.label}
        itemRenderer={MenuItemRenderer}
        menuPanel={MenuPanel}
        menuData={menuData}
        subMenu={item}
        style={style}
        onItemClose={onItemClose}
        onClick={onClick}
        {...{ as: SubMenuElement }}
      />
    );
  }

  if (item instanceof MenuSeparatorItem) {
    return styled(styles)(<MenuSeparator {...menu} />);
  }

  if (item instanceof MenuActionItem) {
    return (
      <MenuActionElement
        item={item}
        menu={menu}
        style={style}
        onClick={onClick}
      />
    );
  }

  if (item instanceof MenuBaseItem) {
    const IconComponent = item.iconComponent?.();

    return styled(styles)(
      <MenuItem
        {...menu}
        {...use({ hidden: item.hidden })}
        id={item.id}
        aria-label={item.label}
        disabled={item.disabled}
        onClick={onClick}
      >
        <MenuItemElement
          label={item.label}
          icon={IconComponent ? <IconComponent item={item} style={joinStyles(menuPanelStyles, style)} /> : item.icon}
          tooltip={item.tooltip}
          style={style}
        />
      </MenuItem>
    );
  }

  return null;
});