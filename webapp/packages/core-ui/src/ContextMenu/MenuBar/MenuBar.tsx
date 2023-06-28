/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback } from 'react';
import type { MenuInitialState } from 'reakit';

import { getComputed, MenuSeparator, MenuSeparatorStyles, s, SContext, StyleRegistry, useAutoLoad, useS } from '@cloudbeaver/core-blocks';
import {
  DATA_CONTEXT_MENU_NESTED,
  DATA_CONTEXT_SUBMENU_ITEM,
  IMenuActionItem,
  IMenuData,
  IMenuItem,
  MenuActionItem,
  MenuBaseItem,
  MenuSeparatorItem,
  MenuSubMenuItem,
  useMenu,
} from '@cloudbeaver/core-view';

import { ContextMenu } from '../ContextMenu';
import style from './MenuBar.m.css';
import { MenuBarItem } from './MenuBarItem';

interface INestedMenuSettings extends MenuInitialState {
  onVisibleSwitch?: (visible: boolean) => void;
}

interface IMenuBarProps extends React.HTMLAttributes<HTMLDivElement> {
  menu: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  rtl?: boolean;
}

const registry: StyleRegistry = [
  [
    MenuSeparatorStyles,
    {
      mode: 'append',
      styles: [style],
    },
  ],
];

export const MenuBar = observer<IMenuBarProps, HTMLDivElement>(
  forwardRef(function MenuBar({ menu, nestedMenuSettings, rtl, className, ...props }, ref) {
    const styles = useS(style);
    const items = menu.items;
    useAutoLoad(menu.loaders);

    if (!items.length) {
      return null;
    }

    return (
      <SContext registry={registry}>
        <div ref={ref} className={s(styles, { menuBar: true }, className)} {...props}>
          {items.map(item => (
            <MenuBarElement key={item.id} item={item} menuData={menu} nestedMenuSettings={nestedMenuSettings} rtl={rtl} />
          ))}
        </div>
      </SContext>
    );
  }),
);

interface IMenuBarElementProps {
  item: IMenuItem;
  menuData: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  className?: string;
  rtl?: boolean;
}

const MenuBarElement = observer<IMenuBarElementProps>(function MenuBarElement({ item, menuData, nestedMenuSettings, className, rtl }) {
  const onClick = useCallback(() => {
    item.events?.onSelect?.();
  }, [item]);

  if (item.hidden) {
    return null;
  }

  if (item instanceof MenuSubMenuItem) {
    return <SubMenuItem item={item} menuData={menuData} className={className} rtl={rtl} nestedMenuSettings={nestedMenuSettings} />;
  }

  if (item instanceof MenuSeparatorItem) {
    return <MenuSeparator className={className} />;
  }

  if (item instanceof MenuActionItem) {
    return <MenuBarAction item={item} className={className} onClick={onClick} />;
  }

  if (item instanceof MenuBaseItem) {
    return (
      <MenuBarItem
        id={item.id}
        hidden={item.hidden}
        aria-label={item.label}
        label={item.label}
        icon={item.icon}
        title={item.tooltip}
        disabled={item.disabled}
        className={className}
        onClick={onClick}
      />
    );
  }

  return null;
});

interface IMenuBarActionProps {
  item: IMenuActionItem;
  className?: string;
  onClick: () => void;
}

const MenuBarAction = observer<IMenuBarActionProps>(function MenuBarAction({ item, className, onClick }) {
  const actionInfo = item.action.actionInfo;
  const loading = item.action.isLoading();

  /** @deprecated must be refactored (#1)*/
  const displayLabel = item.action.isLabelVisible();

  function handleClick() {
    onClick();
    item.action.activate();
  }

  return (
    <MenuBarItem
      id={item.id}
      hidden={item.hidden}
      aria-label={actionInfo.label}
      label={actionInfo.label}
      displayLabel={displayLabel}
      icon={actionInfo.icon}
      title={actionInfo.tooltip}
      disabled={item.disabled}
      loading={loading}
      className={className}
      onClick={handleClick}
    />
  );
});

interface ISubMenuItemProps {
  item: MenuSubMenuItem;
  menuData: IMenuData;
  nestedMenuSettings?: INestedMenuSettings;
  className?: string;
  rtl?: boolean;
}

const SubMenuItem = observer<ISubMenuItemProps>(function SubmenuItem({ item, menuData, nestedMenuSettings, className, rtl }) {
  const subMenuData = useMenu({ menu: item.menu, context: menuData.context });

  subMenuData.context.set(DATA_CONTEXT_MENU_NESTED, true);
  subMenuData.context.set(DATA_CONTEXT_SUBMENU_ITEM, item);

  const handler = subMenuData.handler;
  const hideIfEmpty = handler?.hideIfEmpty?.(subMenuData.context) ?? true;
  const hidden = getComputed(() => subMenuData.items.every(item => item.hidden));

  if (hideIfEmpty && hidden) {
    return null;
  }

  const IconComponent = handler?.iconComponent?.() ?? item.iconComponent?.();
  const extraProps = handler?.getExtraProps?.() ?? (item.getExtraProps?.() as any);
  /** @deprecated must be refactored (#1)*/
  const displayLabel = getComputed(() => handler?.isLabelVisible?.(subMenuData.context, subMenuData.menu) ?? true);
  // TODO: seems like we don't need this, it's was used in panelAvailable to display > arrow in menu bar
  //       when menu isn't loaded yet
  // const loaded = getComputed(() => !subMenuData.loaders.some(loader => !loader.isLoaded()));
  const info = handler?.getInfo?.(subMenuData.context, subMenuData.menu);
  const label = info?.label ?? item.label ?? item.menu.label;
  const icon = info?.icon ?? item.icon ?? item.menu.icon;
  const tooltip = info?.tooltip ?? item.tooltip ?? item.menu.tooltip;
  const panelAvailable = subMenuData.itemCreators.length > 0;

  return (
    <ContextMenu menu={subMenuData} className={className} rtl={rtl} disclosure {...nestedMenuSettings}>
      {({ loading, disabled }) => (
        <MenuBarItem
          id={item.id}
          hidden={item.hidden}
          aria-label={item.menu.label}
          label={label}
          displayLabel={displayLabel}
          icon={IconComponent ? <IconComponent item={item} {...extraProps} /> : icon}
          title={tooltip}
          loading={loading}
          disabled={disabled}
          displaySubmenuMark={panelAvailable}
        />
      )}
    </ContextMenu>
  );
});
