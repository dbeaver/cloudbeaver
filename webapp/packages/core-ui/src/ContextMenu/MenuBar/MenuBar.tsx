/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback } from 'react';
import { MenuInitialState, MenuSeparator } from 'reakit';
import styled, { use } from 'reshadow';

import { useAutoLoad, useStyles } from '@cloudbeaver/core-blocks';
import type { ComponentStyle } from '@cloudbeaver/core-theming';
import { DATA_CONTEXT_MENU_NESTED, DATA_CONTEXT_SUBMENU_ITEM, IMenuActionItem, IMenuData, IMenuItem, MenuActionItem, MenuBaseItem, MenuSeparatorItem, MenuSubMenuItem, useMenu } from '@cloudbeaver/core-view';

import { ContextMenu } from '../ContextMenu';
import { MenuBarItem } from './MenuBarItem';

interface INestedMenuSettings extends MenuInitialState {
  onVisibleSwitch?: (visible: boolean) => void;
}

interface IMenuBarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'style'> {
  menu: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  style?: ComponentStyle;
  rtl?: boolean;
}

export const MenuBar = observer<IMenuBarProps, HTMLDivElement>(forwardRef(function MenuBar({
  menu,
  nestedMenuSettings,
  style,
  rtl,
  ...props
}, ref) {
  const styles = useStyles(style);
  const items = menu.items;
  useAutoLoad(menu.loaders);

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
          rtl={rtl}
          style={style}
        />
      ))}
    </menu-bar>
  );
}));

interface IMenuBarElementProps {
  item: IMenuItem;
  menuData: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  className?: string;
  rtl?: boolean;
  style?: ComponentStyle;
}

const MenuBarElement = observer<IMenuBarElementProps>(function MenuBarElement({
  item,
  menuData,
  nestedMenuSettings,
  className,
  rtl,
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
        className={className}
        rtl={rtl}
        nestedMenuSettings={nestedMenuSettings}
      />
    );
  }

  if (item instanceof MenuSeparatorItem) {
    return styled(styles)(
      <MenuSeparator className={className} />
    );
  }

  if (item instanceof MenuActionItem) {
    return styled(styles)(
      <MenuBarAction
        item={item}
        style={style}
        className={className}
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
        className={className}
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
  className?: string;
  onClick: () => void;
}

const MenuBarAction = observer<IMenuBarActionProps>(function MenuBarAction({ item, style, className, onClick }) {
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
      className={className}
      onClick={handleClick}
      {...use({ hidden: item.hidden })}
    />
  );
});

interface ISubMenuItemProps {
  item: MenuSubMenuItem;
  menuData: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  className?: string;
  rtl?: boolean;
  style?: ComponentStyle;
}

const SubMenuItem = observer<ISubMenuItemProps>(function SubmenuItem({
  item,
  menuData,
  nestedMenuSettings,
  className,
  rtl,
  style,
}) {
  const styles = useStyles(style);
  const subMenuData = useMenu({ menu: item.menu, context: menuData.context });

  subMenuData.context.set(DATA_CONTEXT_MENU_NESTED, true);
  subMenuData.context.set(DATA_CONTEXT_SUBMENU_ITEM, item);

  const handler = subMenuData.handler;

  const IconComponent = handler?.iconComponent?.() ?? item.iconComponent?.();
  const extraProps = handler?.getExtraProps?.() ?? item.getExtraProps?.() as any;
  const info = handler?.getInfo?.(subMenuData.context, subMenuData.menu);
  const label = info?.label ?? item.label ?? item.menu.label;
  const icon = info?.icon ?? item.icon ?? item.menu.icon;
  const tooltip = info?.tooltip ?? item.tooltip ?? item.menu.tooltip;

  return styled(styles)(
    <ContextMenu
      menu={subMenuData}
      style={style}
      className={className}
      rtl={rtl}
      disclosure
      {...nestedMenuSettings}
    >
      {({ loading, disabled }) => (
        <MenuBarItem
          id={item.id}
          aria-label={item.menu.label}
          label={label}
          icon={IconComponent ? (
            <IconComponent
              item={item}
              style={style}
              {...extraProps}
            />
          ) : icon}
          title={tooltip}
          loading={loading}
          disabled={disabled}
          style={style}
          displaySubmenuMark={!disabled}
          {...use({ hidden: item.hidden })}
        />
      )}
    </ContextMenu>
  );
});