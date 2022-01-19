/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { ButtonHTMLAttributes, useCallback, useEffect } from 'react';
import {
  MenuButton, Menu, MenuItem, MenuStateReturn, useMenuState,
  MenuItemCheckbox, MenuItemRadio, MenuInitialState, MenuSeparator
} from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { Checkbox, getComputed, Radio, useObjectRef } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';
import { IMenuData, IMenuItem, MenuSubMenuItem, useMenu, IMenuSubMenuItem, MenuActionItem, IMenuActionItem, MenuSeparatorItem, MenuService, DATA_CONTEXT_MENU_NESTED, MenuBaseItem } from '@cloudbeaver/core-view';

import { MenuPanelItem } from './MenuPanelItem';
import { menuPanelStyles } from './menuPanelStyles';

/**
 * MenuTrigger
 */

interface IContextMenuProps extends Omit<ButtonHTMLAttributes<any>, 'style'> {
  menu: IMenuData;
  style?: ComponentStyle;
  disclosure?: boolean;
  placement?: MenuInitialState['placement'];
  modal?: boolean;
  visible?: boolean;
  rtl?: boolean;
  onVisibleSwitch?: (visible: boolean) => void;
}

export const ContextMenu = React.forwardRef<ButtonHTMLAttributes<any>, IContextMenuProps>(function ContextMenu({
  menu: menuData,
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
  const menuService = useService(MenuService);

  const handler = menuService.getHandler(menuData.context);
  // const loading = handler?.isLoading?.(menuData.context);
  const disabled = handler?.isDisabled?.(menuData.context);

  const propsRef = useObjectRef({ onVisibleSwitch, visible });
  const menu = useMenuState({ modal, placement, visible, rtl });
  const styles = useStyles(menuPanelStyles, style);

  const handleItemClose = useCallback(() => {
    menu.hide();
  }, [menu]);

  useEffect(() => {
    propsRef.onVisibleSwitch?.(menu.visible);

    if (menu.visible) {
      handler?.handler?.(menuData.context);
    }
  }, [menu.visible]);

  if (!menuData.isAvailable()) {
    return null;
  }

  if (React.isValidElement(children) && disclosure) {
    return (
      <>
        <MenuButton ref={ref} {...menu} {...props} {...children.props} disabled={disabled}>
          {disclosureProps => React.cloneElement(children, disclosureProps)}
        </MenuButton>
        <MenuPanel menuData={menuData} menu={menu} style={style} rtl={rtl} onItemClose={handleItemClose} />
      </>
    );
  }

  return styled(styles)(
    <>
      <MenuButton {...menu} {...props} disabled={disabled}>
        <box>{children}</box>
      </MenuButton>
      <MenuPanel menuData={menuData} menu={menu} style={style} rtl={rtl} onItemClose={handleItemClose} />
    </>
  );
});

/**
 * MenuPanel
 */

interface MenuPanelProps {
  menuData: IMenuData;
  menu: MenuStateReturn; // from reakit useMenuState
  panelAvailable?: boolean;
  onItemClose?: () => void;
  rtl?: boolean;
  style?: ComponentStyle;
}

const MenuPanel = observer<MenuPanelProps>(function MenuPanel({
  menuData,
  menu,
  panelAvailable = true,
  rtl,
  onItemClose,
  style,
}) {
  const styles = useStyles(menuPanelStyles, style);
  let visible = panelAvailable && menu.visible;

  if (!visible) {
    return null;
  }

  const items = menuData.getItems();

  if (items.length === 0) {
    visible = false;
  }

  const hasBindings = getComputed(() => items.some(
    item => item instanceof MenuActionItem && item.action.binding !== null
  ));

  return styled(styles)(
    <Menu {...menu} aria-label={menuData.menu.label} visible={visible}>
      <menu-box dir={rtl ? 'rtl' : undefined} {...use({ hasBindings })}>
        {items.map(item => (
          <MenuPanelElement
            key={item.id}
            item={item}
            menuData={menuData}
            menu={menu}
            style={style}
            onItemClose={onItemClose}
          />
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
  menuData: IMenuData;
  menu: MenuStateReturn; // from reakit useMenuState
  onItemClose?: () => void;
  style?: ComponentStyle;
}

const MenuPanelElement = observer<IMenuPanelElementProps>(function MenuPanelElement({
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
        menuData={menuData}
        subMenu={item}
        style={style}
        onItemClose={onItemClose}
        onClick={onClick}
        {...{ as: MenuInnerTrigger }}
      />
    );
  }

  if (item instanceof MenuSeparatorItem) {
    return styled(styles)(<MenuSeparator {...menu} />);
  }

  if (item instanceof MenuActionItem) {
    return (
      <MenuActionItemRenderer
        item={item}
        menu={menu}
        style={style}
        onClick={onClick}
      />
    );
  }

  if (item instanceof MenuBaseItem) {
    return styled(styles)(
      <MenuItem
        {...menu}
        {...use({ hidden: item.hidden })}
        id={item.id}
        aria-label={item.label}
        disabled={item.disabled}
        onClick={onClick}
      >
        <MenuPanelItem
          label={item.label}
          icon={item.icon}
          tooltip={item.tooltip}
          style={style}
        />
      </MenuItem>
    );
  }

  return null;
});

interface IMenuActionItemProps {
  item: IMenuActionItem;
  menu: MenuStateReturn;
  style?: ComponentStyle;
  onClick: () => void;
}

const MenuActionItemRenderer = observer<IMenuActionItemProps>(function MenuActionItem({
  item,
  menu,
  style,
  onClick,
}) {
  const styles = useStyles(menuPanelStyles, style);
  const actionInfo = item.action.actionInfo;
  const loading = item.action.isLoading();

  function handleClick() {
    onClick();
    item.action.activate();
  }

  if (actionInfo.type === 'select') {
    const checked = item.action.isChecked();
    return styled(styles)(
      <MenuItemRadio
        {...menu}
        {...use({ hidden: item.hidden })}
        id={item.id}
        aria-label={actionInfo.label}
        disabled={item.disabled}
        name={item.id}
        value={actionInfo.label}
        checked={checked}
        onClick={handleClick}
      >
        <MenuPanelItem
          label={actionInfo.label}
          icon={<Radio checked={checked} mod={['primary', 'small']} ripple={false} />}
          tooltip={actionInfo.tooltip}
          loading={loading}
          style={style}
        />
      </MenuItemRadio>

    );
  }

  if (actionInfo.type === 'checkbox') {
    const checked = item.action.isChecked();
    return styled(styles)(
      <MenuItemCheckbox
        {...menu}
        {...use({ hidden: item.hidden })}
        id={item.id}
        aria-label={actionInfo.label}
        disabled={item.disabled}
        name={item.id}
        value={actionInfo.label}
        checked={checked}
        onClick={handleClick}
      >
        <MenuPanelItem
          label={actionInfo.label}
          icon={<Checkbox checked={checked} mod={['primary', 'small']} style={style} ripple={false} />}
          tooltip={actionInfo.tooltip}
          loading={loading}
          style={style}
        />
      </MenuItemCheckbox>
    );
  }

  return styled(styles)(
    <MenuItem
      {...menu}
      {...use({ hidden: item.hidden })}
      id={item.id}
      aria-label={actionInfo.label}
      disabled={item.disabled}
      onClick={handleClick}
    >
      <MenuPanelItem
        label={actionInfo.label}
        icon={actionInfo.icon}
        binding={item.action.binding?.binding.label}
        tooltip={actionInfo.tooltip}
        loading={loading}
        style={style}
      />
    </MenuItem>
  );
});

/**
 * MenuInnerTrigger
 */

interface IMenuInnerTriggerProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  menuData: IMenuData;
  subMenu: IMenuSubMenuItem;
  onItemClose?: () => void;
  style?: ComponentStyle;
}

export const MenuInnerTrigger = observer<IMenuInnerTriggerProps, HTMLButtonElement>(function MenuInnerTrigger(
  {
    menuData,
    subMenu,
    style,
    onItemClose,
    ...rest
  },
  ref
) {
  const menuService = useService(MenuService);
  const menu = useMenuState();
  const subMenuData = useMenu({ menu: subMenu.menu, context: menuData.context });
  subMenuData.context.set(DATA_CONTEXT_MENU_NESTED, true);

  const handler = menuService.getHandler(subMenuData.context);
  const loading = handler?.isLoading?.(subMenuData.context);
  const disabled = handler?.isDisabled?.(subMenuData.context);

  const handleItemClose = useCallback(() => {
    menu.hide();
    onItemClose?.();
  }, [menu, onItemClose]);

  useEffect(() => {
    if (menu.visible) {
      subMenu.events?.onOpen?.();
      handler?.handler?.(subMenuData.context);
    }
  }, [menu.visible]);

  return styled(useStyles(menuPanelStyles, style))(
    <>
      <MenuButton ref={ref} {...menu} {...rest} disabled={disabled}>
        <box>
          <MenuPanelItem
            label={subMenu.menu.label}
            icon={subMenu.menu.icon}
            tooltip={subMenu.menu.tooltip}
            loading={loading}
            style={style}
            menu
          />
        </box>
      </MenuButton>
      <MenuPanel
        menuData={subMenuData}
        menu={menu}
        style={style}
        panelAvailable={subMenuData.isAvailable()}
        onItemClose={handleItemClose}
      />
    </>
  );
}, { forwardRef: true });
