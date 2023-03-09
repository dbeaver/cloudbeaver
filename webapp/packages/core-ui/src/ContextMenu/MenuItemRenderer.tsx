/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';
import { MenuItem, MenuItemCheckbox, MenuSeparator, MenuStateReturn } from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { Checkbox, joinStyles, Loader, MenuItemElement, menuPanelStyles, useStyles } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { IMenuItem, IMenuData, MenuSubMenuItem, MenuSeparatorItem, MenuActionItem, MenuBaseItem, MenuCustomItem, MenuCheckboxItem } from '@cloudbeaver/core-view';

import { MenuActionElement } from './MenuActionElement';
import { SubMenuElement } from './SubMenuElement';


export interface IMenuItemRendererProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  item: IMenuItem;
  menuData: IMenuData;
  menu: MenuStateReturn; // from reakit useMenuState
  modal?: boolean;
  rtl?: boolean;
  onItemClose?: () => void;
  style?: ComponentStyle;
}

export const MenuItemRenderer = observer<IMenuItemRendererProps>(function MenuItemRenderer({
  item, modal, rtl, menuData, menu, onItemClose, style,
}) {
  const styles = useStyles(menuPanelStyles, style);
  const onClick = useCallback((keepMenuOpen = true) => {
    item.events?.onSelect?.();

    if (!(item instanceof MenuSubMenuItem) && keepMenuOpen) {
      onItemClose?.();
    }
  }, [item, onItemClose]);

  if (item instanceof MenuCustomItem) {
    const CustomMenuItem = item.getComponent();

    return styled(styles)(
      <CustomMenuItem
        item={item}
        menu={menu}
        menuData={menuData}
        style={style}
        onClick={onClick}
      />
    );
  }

  if (item instanceof MenuSubMenuItem) {
    return styled(styles)(
      <MenuItem
        {...menu}
        {...{ as: SubMenuElement }}
        {...use({ hidden: item.hidden })}
        id={item.id}
        aria-label={item.menu.label}
        itemRenderer={MenuItemRenderer}
        menuRtl={rtl}
        menuData={menuData}
        menuModal={modal}
        subMenu={item}
        style={style}
        onItemClose={onItemClose}
        onClick={() => onClick()}
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
        menuData={menuData}
        style={style}
        onClick={onClick}
      />
    );
  }

  if (item instanceof MenuCheckboxItem) {
    return styled(styles)(
      <MenuItemCheckbox
        {...menu}
        {...use({ hidden: item.hidden })}
        id={item.id}
        aria-label={item.label}
        disabled={item.disabled}
        name={item.id}
        value={item.label}
        checked={item.checked}
        onClick={() => onClick(false)}
      >
        <MenuItemElement
          label={item.label}
          icon={<Checkbox checked={item.checked} mod={['primary', 'small']} style={style} ripple={false} />}
          tooltip={item.tooltip}
          style={style}
        />
      </MenuItemCheckbox>
    );
  }

  if (item instanceof MenuBaseItem) {
    const IconComponent = item.iconComponent?.();
    const extraProps = item.getExtraProps?.();

    return styled(styles)(
      <MenuItem
        {...menu}
        {...use({ hidden: item.hidden })}
        id={item.id}
        aria-label={item.label}
        disabled={item.disabled}
        onClick={onClick}
        {...extraProps}
      >
        <MenuItemElement
          label={item.label}
          icon={IconComponent ? styled(styles)(
            <Loader suspense small fullSize>
              <IconComponent
                item={item}
                style={joinStyles(menuPanelStyles, style)}
                {...extraProps}
              />
            </Loader>
          ) : item.icon}
          tooltip={item.tooltip}
          style={style}
        />
      </MenuItem>
    );
  }

  return null;
});