/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed } from 'mobx';
import { observer } from 'mobx-react-lite';
import React, { ButtonHTMLAttributes, forwardRef, useCallback, useEffect, useMemo } from 'react';
import { Menu, MenuButton, MenuInitialState, MenuItem, MenuItemCheckbox, MenuItemRadio, MenuStateReturn, useMenuState } from 'reakit/Menu';

import type { IMenuItem, IMenuPanel } from '@cloudbeaver/core-dialogs';

import { s } from '../s';
import { useObjectRef } from '../useObjectRef';
import { useS } from '../useS';
import { MenuPanelItem } from './MenuPanelItem';
import MenuPanelItemAndTriggerStyles from './shared/MenuPanelItemAndTrigger.m.css';

export type MenuState = MenuStateReturn;

/**
 * MenuTrigger
 */

interface IMenuTriggerBaseProps extends Omit<ButtonHTMLAttributes<any>, 'style'> {
  menuRef?: React.RefObject<MenuState | undefined>;
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
  className?: string;
}

export const MenuTrigger = React.forwardRef<ButtonHTMLAttributes<any>, IMenuTriggerProps | IMenuTriggerLazyProps>(function MenuTrigger(
  { panel, menuRef, getPanel, disclosure, className, children, placement, visible, onVisibleSwitch, modal, rtl, ...props },
  ref,
) {
  const propsRef = useObjectRef({ onVisibleSwitch, visible });
  const menu = useMenuState({ modal, placement, visible, rtl });
  const style = useS(MenuPanelItemAndTriggerStyles);

  if (menuRef) {
    //@ts-expect-error ref mutation
    menuRef.current = menu;
  }

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
      <div className={s(style, { menuTrigger: true }, className)}>
        <MenuButton ref={ref} className={s(style, { menuButton: true })} {...menu} {...props} {...children.props}>
          {disclosureProps => React.cloneElement(children, disclosureProps)}
        </MenuButton>
        {panel && <MenuPanel panel={panel} menu={menu} rtl={rtl} onItemClose={handleItemClose} />}
      </div>
    );
  }

  return (
    <div className={s(style, { menuTrigger: true })}>
      <MenuButton className={s(style, { menuButton: true })} {...menu} {...props}>
        <div className={s(style, { box: true })}>{children}</div>
      </MenuButton>
      {panel && <MenuPanel panel={panel} menu={menu} rtl={rtl} onItemClose={handleItemClose} />}
    </div>
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
}

const MenuPanel = observer<MenuPanelProps>(function MenuPanel({ panel, menu, panelAvailable, rtl, onItemClose }) {
  const style = useS(MenuPanelItemAndTriggerStyles);
  if (!menu.visible) {
    return null;
  }

  return (
    <Menu className={s(style, { menu: true })} {...menu} aria-label={panel.id} visible={panelAvailable ?? menu.visible}>
      <div className={s(style, { menuBox: true })} dir={rtl ? 'rtl' : undefined}>
        {panel.menuItems.map(item => (
          <MenuPanelElement key={item.id} item={item} menu={menu} onItemClose={onItemClose} />
        ))}
      </div>
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
}

const MenuPanelElement = observer<IMenuPanelElementProps>(function MenuPanelElement({ item, menu, onItemClose }) {
  const style = useS(MenuPanelItemAndTriggerStyles);
  const onClick = useCallback(() => {
    if (item.onClick) {
      item.onClick();
    }
    if (!item.keepMenuOpen && !item.panel) {
      onItemClose?.();
    }
  }, [item, menu, onItemClose]);

  const hidden = useMemo(() => computed(() => item.panel?.menuItems.every(item => item.isHidden)), [item.panel]);

  if (hidden.get() && item.isPanelAvailable === undefined) {
    return null;
  }

  if (item.panel) {
    return (
      <MenuItem
        {...menu}
        className={s(style, { menuItem: true, hidden: item.isHidden })}
        aria-label={item.id}
        disabled={item.isDisabled}
        menuItem={item}
        onItemClose={onItemClose}
        onClick={onClick}
        {...{ as: MenuInnerTrigger }}
      />
    );
  }

  if (item.type === 'radio') {
    return (
      <MenuItemRadio
        {...menu}
        className={s(style, { menuItemRadio: true, hidden: item.isHidden })}
        aria-label={item.id}
        disabled={item.isDisabled}
        name={item.id}
        value={item.title}
        checked={item.isChecked}
        onClick={onClick}
      >
        <MenuPanelItem className={s(style, { menuPanelItem: true })} menuItem={item} />
      </MenuItemRadio>
    );
  }

  if (item.type === 'checkbox') {
    return (
      <MenuItemCheckbox
        {...menu}
        className={s(style, { menuItemCheckbox: true, hidden: item.isHidden })}
        aria-label={item.id}
        disabled={item.isDisabled}
        name={item.id}
        value={item.title}
        checked={item.isChecked}
        onClick={onClick}
      >
        <MenuPanelItem className={s(style, { menuPanelItem: true })} menuItem={item} />
      </MenuItemCheckbox>
    );
  }

  return (
    <MenuItem
      className={s(style, { menuItem: true, hidden: item.isHidden })}
      {...menu}
      aria-label={item.id}
      disabled={item.isDisabled}
      onClick={onClick}
    >
      <MenuPanelItem className={s(style, { menuPanelItem: true })} menuItem={item} />
    </MenuItem>
  );
});

/**
 * MenuInnerTrigger
 */

interface IMenuInnerTriggerProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  menuItem: IMenuItem;
  onItemClose?: () => void;
}

export const MenuInnerTrigger = observer<IMenuInnerTriggerProps, HTMLButtonElement>(
  forwardRef(function MenuInnerTrigger(props, ref) {
    const { menuItem, onItemClose, ...rest } = props;
    const menu = useMenuState();
    const style = useS(MenuPanelItemAndTriggerStyles);

    const handleItemClose = useCallback(() => {
      menu.hide();
      onItemClose?.();
    }, [menu.hide, onItemClose]);

    const handleMouseEnter = useCallback(() => {
      menuItem.onMouseEnter?.();
    }, [menuItem.onMouseEnter]);

    return (
      <>
        <div className={s(style, { menuPanelButtonWrapper: true })} onMouseEnter={handleMouseEnter}>
          <MenuButton ref={ref} className={s(style, { menuButton: true })} {...menu} {...rest}>
            <div className={s(style, { box: true })}>
              <MenuPanelItem className={s(style, { menuPanelItem: true })} menuItem={menuItem} />
            </div>
          </MenuButton>
        </div>
        <MenuPanel panel={menuItem.panel!} menu={menu} panelAvailable={menuItem.isPanelAvailable} onItemClose={handleItemClose} />
      </>
    );
  }),
);
