/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { ButtonHTMLAttributes, useCallback, useEffect, useMemo } from 'react';
import {
  MenuButton, Menu, MenuItem, MenuStateReturn, useMenuState,
  MenuItemCheckbox, MenuItemRadio, MenuInitialState
} from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { useObjectRef } from '@cloudbeaver/core-blocks';
import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';

import type {
  IMenuItem, IMenuPanel
} from '../IMenuPanel';
import { MenuPanelItem } from './MenuPanelItem';
import { menuPanelStyles } from './menuPanelStyles';

/**
 * MenuTrigger
 */

interface IMenuTriggerBaseProps extends Omit<ButtonHTMLAttributes<any>, 'style'> {
  style?: ComponentStyle;
  disclosure?: boolean;
  placement?: MenuInitialState['placement'];
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
  onVisibleSwitch?: (visible: boolean) => void;
}

interface IMenuTriggerLazyProps extends IMenuTriggerBaseProps {
  getPanel: () => IMenuPanel;
  panel?: IMenuPanel;
}

interface IMenuTriggerProps extends IMenuTriggerBaseProps {
  panel: IMenuPanel;
  getPanel?: () => IMenuPanel;
}

export const MenuTrigger = React.forwardRef<ButtonHTMLAttributes<any>, IMenuTriggerProps | IMenuTriggerLazyProps>(function MenuTrigger({
  panel,
  getPanel,
  disclosure,
  children,
  style,
  placement,
  visible,
  onVisibleSwitch,
  modal,
  rtl,
  ...props
}, ref) {
  const propsRef = useObjectRef({ onVisibleSwitch, visible });
  const menu = useMenuState({ modal, placement, visible, rtl });
  const styles = useStyles(menuPanelStyles, style);

  const handleItemClose = useCallback(() => {
    menu.hide();
  }, [menu.hide]);

  useEffect(() => {
    propsRef.onVisibleSwitch?.(menu.visible);
  }, [menu.visible]);

  if (menu.visible && getPanel) {
    panel = getPanel();
  }

  if (React.isValidElement(children) && disclosure) {
    return (
      <>
        <MenuButton ref={ref} {...menu} {...props} {...children.props}>
          {disclosureProps => React.cloneElement(children, disclosureProps)}
        </MenuButton>
        {panel && <MenuPanel panel={panel} menu={menu} style={style} rtl={rtl} onItemClose={handleItemClose} />}
      </>
    );
  }

  return styled(styles)(
    <>
      <MenuButton {...menu} {...props}>
        <box>{children}</box>
      </MenuButton>
      {panel && <MenuPanel panel={panel} menu={menu} style={style} rtl={rtl} onItemClose={handleItemClose} />}
    </>
  );
});

/**
 * MenuPanel
 */

interface MenuPanelProps {
  panel: IMenuPanel;
  menu: MenuStateReturn; // from reakit useMenuState
  panelAvailable?: boolean;
  onItemClose?: () => void;
  rtl?: boolean;
  style?: ComponentStyle;
}

const MenuPanel = observer<MenuPanelProps>(function MenuPanel({
  panel,
  menu,
  panelAvailable,
  rtl,
  onItemClose,
  style,
}) {
  const styles = useStyles(menuPanelStyles, style);

  if (!menu.visible) {
    return null;
  }

  return styled(styles)(
    <Menu {...menu} aria-label={panel.id} visible={panelAvailable ?? menu.visible}>
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

interface IMenuPanelElementProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  item: IMenuItem;
  menu: MenuStateReturn; // from reakit useMenuState
  onItemClose?: () => void;
  style?: ComponentStyle;
}

const MenuPanelElement = observer<IMenuPanelElementProps>(function MenuPanelElement({
  item, menu, onItemClose, style,
}) {
  const styles = useStyles(menuPanelStyles, style);
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

  if (hidden.get() && item.isPanelAvailable === undefined) {
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

interface IMenuInnerTriggerProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  menuItem: IMenuItem;
  onItemClose?: () => void;
  style?: ComponentStyle;
}

export const MenuInnerTrigger = observer<IMenuInnerTriggerProps, HTMLButtonElement>(function MenuInnerTrigger(
  props,
  ref
) {
  const { menuItem, style, onItemClose, ...rest } = props;
  const menu = useMenuState();

  const handleItemClose = useCallback(() => {
    menu.hide();
    onItemClose?.();
  }, [menu.hide, onItemClose]);

  const handleMouseEnter = useCallback(() => {
    menuItem.onMouseEnter?.();
  }, [menuItem.onMouseEnter]);

  return styled(useStyles(menuPanelStyles, style))(
    <>
      <menu-panel-button-wrapper onMouseEnter={handleMouseEnter}>
        <MenuButton ref={ref} {...menu} {...rest}>
          <box>
            <MenuPanelItem menuItem={menuItem} style={style} />
          </box>
        </MenuButton>
      </menu-panel-button-wrapper>
      <MenuPanel
        panel={menuItem.panel!}
        menu={menu}
        style={style}
        panelAvailable={menuItem.isPanelAvailable}
        onItemClose={handleItemClose}
      />
    </>
  );
}, { forwardRef: true });
