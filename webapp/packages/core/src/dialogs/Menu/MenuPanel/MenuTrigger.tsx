/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer, Observer } from 'mobx-react';
import React, { ButtonHTMLAttributes, Ref, useCallback } from 'react';
import {
  MenuDisclosure,
  Menu, MenuItem, MenuStateReturn, useMenuState,
} from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { useStyles, Style } from '@dbeaver/core/theming';

import {
  IMenuItem, IMenuPanel, MenuTriggerProps, MenuMod
} from '../IMenuPanel';
import { MenuPanelItem } from './MenuPanelItem';
import { menuPanelStyles } from './menuPanelStyles';

/**
 * MenuTrigger
 */
export const MenuTrigger = observer(function MenuTrigger({
  panel,
  children,
  style = [],
  ...props
}: MenuTriggerProps) {

  const menu = useMenuState();

  return styled(useStyles(menuPanelStyles, ...style))(
    <>
      <MenuDisclosure {...menu} {...props}>
        {children}
      </MenuDisclosure>
      <MenuPanel panel={panel} menu={menu} style={style}/>
    </>
  );
});


/**
 * MenuPanel
 */

type MenuPanelProps = {
  panel: IMenuPanel;
  menu: MenuStateReturn; // from reakit useMenuState
  style?: Style[];
}

const MenuPanel = observer(function MenuPanel({
  panel,
  menu,
  style = [],
}: MenuPanelProps) {

  return styled(useStyles(menuPanelStyles, ...style))(
    <Menu {...menu} aria-label={panel.id}>
      {menu.visible && panel.menuItems.map(item => (
        <MenuPanelElement key={item.id} item={item} menu={menu} style={style} />
      ))}
    </Menu>
  );
});

/**
 * MenuPanelElement
 */

type MenuPanelElementProps = Omit<ButtonHTMLAttributes<any>, 'style'> & {
  item: IMenuItem;
  menu: MenuStateReturn; // from reakit useMenuState
  style?: Style[];
}

const MenuPanelElement = observer(function MenuPanelElement({
  item, menu, style = [],
}: MenuPanelElementProps) {
  const onClick = useCallback(() => {
    if (item.onClick) {
      item.onClick();
    }
    if (!item.panel) {
      menu.hide();
    }
  }, [item]);

  if (item.panel) {
    return styled(useStyles(menuPanelStyles, ...style))(
      <MenuItem
        {...menu}
        {...use({ hidden: item.isHidden })}
        aria-label={item.id}
        onClick={onClick}
        disabled={item.isDisabled}
        menuItem={item}
        style={style}
        {...{ as: MenuInnerTrigger }}>
      </MenuItem>
    );
  }

  return styled(useStyles(menuPanelStyles, ...style))(
    <MenuItem
      {...menu}
      {...use({ hidden: item.isHidden })}
      aria-label={item.id}
      onClick={onClick}
      disabled={item.isDisabled}>
      <MenuPanelItem menuItem={item} style={style}/>
    </MenuItem>
  );
});

/**
 * MenuInnerTrigger
 */

type MenuInnerTriggerProps = Omit<ButtonHTMLAttributes<any>, 'style'> & {
  menuItem: IMenuItem;
  style?: Style[];
}

export const MenuInnerTrigger = React.forwardRef(function MenuInnerTrigger(
  props: MenuInnerTriggerProps,
  ref: Ref<HTMLButtonElement>
) {

  const {
    menuItem, style = [], ...other
  } = props;
  const menu = useMenuState();

  return (
    <Observer>
      {() => styled(useStyles(menuPanelStyles, ...style))(
        <>
          <MenuDisclosure ref={ref} {...menu} {...other}>
            <MenuPanelItem menuItem={menuItem} style={style}/>
          </MenuDisclosure>
          <MenuPanel panel={menuItem.panel!} menu={menu} style={style}/>
        </>
      )}
    </Observer>
  );
});
