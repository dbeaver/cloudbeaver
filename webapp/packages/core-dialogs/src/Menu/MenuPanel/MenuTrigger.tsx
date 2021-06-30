/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer, useObserver } from 'mobx-react-lite';
import {
  forwardRef, Ref, useCallback, useEffect, useMemo
} from 'react';
import {
  MenuButton,
  Menu, MenuItem, MenuStateReturn, useMenuState, MenuItemCheckbox, MenuItemRadio
} from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useStyles, Style } from '@cloudbeaver/core-theming';

import type {
  IMenuItem, IMenuPanel, MenuTriggerProps
} from '../IMenuPanel';
import { MenuPanelItem } from './MenuPanelItem';
import { menuPanelStyles } from './menuPanelStyles';

/**
 * MenuTrigger
 */
export const MenuTrigger: React.FC<MenuTriggerProps> = function MenuTrigger({
  panel,
  children,
  style = [],
  placement,
  visible,
  onVisibleSwitch,
  modal,
  rtl,
  ...props
}) {
  const propsRef = useObjectRef({ onVisibleSwitch, visible }, { onVisibleSwitch });
  const menu = useMenuState({ modal, placement, visible, rtl });

  const handleItemClose = useCallback(() => {
    menu.hide();
  }, [menu.hide]);

  useEffect(() => {
    propsRef.onVisibleSwitch?.(menu.visible);
  }, [menu.visible]);

  return styled(useStyles(menuPanelStyles, ...style))(
    <>
      <MenuButton {...menu} {...props}>
        <box>{children}</box>
      </MenuButton>
      <MenuPanel panel={panel} menu={menu} style={style} rtl={rtl} onItemClose={handleItemClose} />
    </>
  );
};

/**
 * MenuPanel
 */

interface MenuPanelProps {
  panel: IMenuPanel;
  menu: MenuStateReturn; // from reakit useMenuState
  onItemClose?: () => void;
  rtl?: boolean;
  style?: Style[];
}

const MenuPanel = observer(function MenuPanel({
  panel,
  menu,
  rtl,
  onItemClose,
  style = [],
}: MenuPanelProps) {
  const styles = useStyles(menuPanelStyles, ...style);

  if (!menu.visible) {
    return null;
  }

  return styled(styles)(
    <Menu {...menu} aria-label={panel.id}>
      <menu-box dir={rtl ? 'rtl' : undefined}>
        {panel.menuItems.map(item => (
          <MenuPanelElement key={item.id} item={item} menu={menu} style={style} onItemClose={onItemClose} />
        ))}
      </menu-box>
    </Menu>
  );
});

/**
 * MenuPanelElement
 */

type MenuPanelElementProps = Omit<React.ButtonHTMLAttributes<any>, 'style'> & {
  item: IMenuItem;
  menu: MenuStateReturn; // from reakit useMenuState
  onItemClose?: () => void;
  style?: Style[];
};

const MenuPanelElement = observer(function MenuPanelElement({
  item, menu, onItemClose, style = [],
}: MenuPanelElementProps) {
  const styles = useStyles(menuPanelStyles, ...style);
  const onClick = useCallback(() => {
    if (item.onClick) {
      item.onClick();
    }
    if (!item.keepMenuOpen && !item.panel) {
      onItemClose?.();
    }
  }, [item, menu, onItemClose]);

  const hidden = useMemo(() => computed(
    () => item.panel?.menuItems.every(item => item.isHidden)
  ), [item.panel]);

  if (hidden.get()) {
    return null;
  }

  if (item.panel) {
    return styled(styles)(
      <MenuItem
        {...menu}
        {...use({ hidden: item.isHidden })}
        aria-label={item.id}
        disabled={item.isDisabled}
        menuItem={item}
        style={style}
        onItemClose={onItemClose}
        onClick={onClick}
        {...{ as: MenuInnerTrigger }}
      />
    );
  }

  if (item.type === 'radio') {
    return styled(styles)(
      <MenuItemRadio
        {...menu}
        {...use({ hidden: item.isHidden })}
        aria-label={item.id}
        disabled={item.isDisabled}
        name={item.id}
        value={item.title}
        checked={item.isChecked}
        onClick={onClick}
      >
        <MenuPanelItem menuItem={item} style={style} />
      </MenuItemRadio>

    );
  }

  if (item.type === 'checkbox') {
    return styled(styles)(
      <MenuItemCheckbox
        {...menu}
        {...use({ hidden: item.isHidden })}
        aria-label={item.id}
        disabled={item.isDisabled}
        name={item.id}
        value={item.title}
        checked={item.isChecked}
        onClick={onClick}
      >

        <MenuPanelItem menuItem={item} style={style} />
      </MenuItemCheckbox>
    );
  }

  return styled(styles)(
    <MenuItem
      {...menu}
      {...use({ hidden: item.isHidden })}
      aria-label={item.id}
      disabled={item.isDisabled}
      onClick={onClick}
    >
      <MenuPanelItem menuItem={item} style={style} />
    </MenuItem>
  );
});

/**
 * MenuInnerTrigger
 */

type MenuInnerTriggerProps = Omit<React.ButtonHTMLAttributes<any>, 'style'> & {
  menuItem: IMenuItem;
  onItemClose?: () => void;
  style?: Style[];
};

export const MenuInnerTrigger = forwardRef(function MenuInnerTrigger(
  props: MenuInnerTriggerProps,
  ref: Ref<HTMLButtonElement>
) {
  const {
    menuItem, style = [], ...rest
  } = props;
  const menu = useMenuState();
  const panel = useObserver(() => menuItem.panel);

  const handleItemClose = useCallback(() => {
    menu.hide();
    props.onItemClose?.();
  }, [menu.hide, props.onItemClose]);

  return styled(useStyles(menuPanelStyles, ...style))(
    <>
      <MenuButton ref={ref} {...menu} {...rest}>
        <box>
          <MenuPanelItem menuItem={menuItem} style={style} />
        </box>
      </MenuButton>
      <MenuPanel panel={panel!} menu={menu} style={style} onItemClose={handleItemClose} />
    </>
  );
});
