/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import { MenuInitialState, MenuSeparator } from 'reakit';
import styled, { use } from 'reshadow';

import { useStyles, ComponentStyle } from '@cloudbeaver/core-theming';
import { DATA_CONTEXT_MENU_NESTED, IMenuActionItem, IMenuData, IMenuItem, MenuActionItem, MenuBaseItem, MenuSeparatorItem, MenuService, MenuSubMenuItem, useMenu } from '@cloudbeaver/core-view';

import { ContextMenu } from '../ContextMenu';
import { MenuBarItem } from './MenuBarItem';

interface INestedMenuSettings extends MenuInitialState {
  onVisibleSwitch?: (visible: boolean) => void;
}

interface IMenuBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  menu: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  style?: ComponentStyle;
}

export const MenuBar = observer<IMenuBarProps, HTMLDivElement>(function MenuBar({
  menu,
  nestedMenuSettings,
  style,
  ...props
}, ref) {
  const styles = useStyles(style);
  const items = menu.items;

  if (!items.length) {
    return null;
  }

  return styled(styles)(
    <menu-bar ref={ref} as='div' {...props}>
      {items.map(item => (
        <MenuBarElement
          key={item.id}
          item={item}
          menuData={menu}
          nestedMenuSettings={nestedMenuSettings}
          style={style}
        />
      ))}
    </menu-bar>
  );
}, { forwardRef: true });

interface IMenuBarElementProps {
  item: IMenuItem;
  menuData: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  style?: ComponentStyle;
}

const MenuBarElement = observer<IMenuBarElementProps>(function MenuBarElement({
  item,
  menuData,
  nestedMenuSettings,
  style,
}) {
  const styles = useStyles(style);

  const onClick = useCallback(() => {
    item.events?.onSelect?.();
  }, [item]);

  if (item instanceof MenuSubMenuItem) {
    return styled(styles)(
      <SubMenuItem
        item={item}
        menuData={menuData}
        style={style}
        nestedMenuSettings={nestedMenuSettings}
      />
    );
  }

  if (item instanceof MenuSeparatorItem) {
    return styled(styles)(
      <MenuSeparator />
    );
  }

  if (item instanceof MenuActionItem) {
    return styled(styles)(
      <MenuBarAction
        item={item}
        style={style}
        onClick={onClick}
      />
    );
  }

  if (item instanceof MenuBaseItem) {
    return styled(styles)(
      <MenuBarItem
        id={item.id}
        aria-label={item.label}
        label={item.label}
        icon={item.icon}
        title={item.tooltip}
        disabled={item.disabled}
        style={style}
        onClick={onClick}
        {...use({ hidden: item.hidden })}
      />
    );
  }

  return null;
});

interface IMenuBarActionProps {
  item: IMenuActionItem;
  style?: ComponentStyle;
  onClick: () => void;
}

const MenuBarAction = observer<IMenuBarActionProps>(function MenuBarAction({ item, style, onClick }) {
  const styles = useStyles(style);

  const actionInfo = item.action.actionInfo;
  const loading = item.action.isLoading();

  function handleClick() {
    onClick();
    item.action.activate();
  }

  return styled(styles)(
    <MenuBarItem
      id={item.id}
      aria-label={actionInfo.label}
      label={actionInfo.label}
      icon={actionInfo.icon}
      title={actionInfo.tooltip}
      disabled={item.disabled}
      loading={loading}
      style={style}
      onClick={handleClick}
      {...use({ hidden: item.hidden })}
    />
  );
});

interface ISubMenuItemProps {
  item: MenuSubMenuItem;
  menuData: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  style?: ComponentStyle;
}

const SubMenuItem = observer<ISubMenuItemProps>(function SubmenuItem({
  item,
  menuData,
  nestedMenuSettings,
  style,
}) {
  const styles = useStyles(style);
  const subMenuData = useMenu({ menu: item.menu, context: menuData.context });

  subMenuData.context.set(DATA_CONTEXT_MENU_NESTED, true);

  return styled(styles)(
    <ContextMenu
      menu={subMenuData}
      style={style}
      disclosure
      {...nestedMenuSettings}
    >
      {({ loading, disabled }) => (
        <MenuBarItem
          id={item.id}
          aria-label={item.menu.label}
          label={item.menu.label}
          icon={item.menu.icon}
          title={item.menu.tooltip || item.menu.label}
          loading={loading}
          disabled={disabled}
          style={style}
          {...use({ hidden: item.hidden })}
        />
      )}
    </ContextMenu>
  );
});