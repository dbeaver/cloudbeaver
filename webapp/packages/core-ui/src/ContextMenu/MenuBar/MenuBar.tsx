/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { forwardRef, useCallback } from 'react';

import {
  getComputed,
  Loader,
  MenuSeparator,
  MenuSeparatorStyles,
  registry,
  s,
  SContext,
  type StyleRegistry,
  useAutoLoad,
  useListKeyboardNavigation,
  useMergeRefs,
  useS,
} from '@cloudbeaver/core-blocks';
import { type IDataContext, useDataContextLink } from '@cloudbeaver/core-data-context';
import {
  DATA_CONTEXT_MENU_NESTED,
  DATA_CONTEXT_SUBMENU_ITEM,
  type IMenuActionItem,
  type IMenuData,
  type IMenuInfo,
  type IMenuItem,
  isMenuCustomItem,
  MenuActionItem,
  MenuBaseItem,
  MenuSeparatorItem,
  MenuService,
  MenuSubMenuItem,
  useMenu,
} from '@cloudbeaver/core-view';

import { ContextMenu } from '../ContextMenu.js';
import type { IMenuBarNestedMenuSettings, IMenuBarProps } from './IMenuBarProps.js';
import style from './MenuBar.module.css';
import { MenuBarItem } from './MenuBarItem.js';
import { useService } from '@cloudbeaver/core-di';

const styleRegistry: StyleRegistry = [
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
    const refNav = useListKeyboardNavigation();
    const mergedRef = useMergeRefs(ref, refNav);
    const styles = useS(style);
    const items = menu.items;
    useAutoLoad(MenuBar, menu.loaders, true, false, true);

    if (!items.length) {
      return null;
    }

    return (
      <SContext registry={styleRegistry}>
        <div ref={mergedRef} className={s(styles, { menuBar: true }, className)} tabIndex={0} {...props}>
          <Loader suspense small inline>
            {items.map(item => (
              <MenuBarElement key={item.id} item={item} menuData={menu} nestedMenuSettings={nestedMenuSettings} rtl={rtl} />
            ))}
          </Loader>
        </div>
      </SContext>
    );
  }),
);

interface IMenuBarElementProps {
  item: IMenuItem;
  menuData: IMenuData;
  nestedMenuSettings?: IMenuBarNestedMenuSettings;
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
    return <SubMenuGroupItem item={item} menuData={menuData} className={className} rtl={rtl} nestedMenuSettings={nestedMenuSettings} />;
  }

  if (item instanceof MenuSeparatorItem) {
    return <MenuSeparator className={className} />;
  }

  if (isMenuCustomItem(item)) {
    const CustomMenuItem = item.getComponent();

    return <CustomMenuItem item={item} context={menuData.context} onClick={onClick} />;
  }

  if (item instanceof MenuActionItem) {
    return <MenuBarAction item={item} context={menuData.context} className={className} />;
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

export interface IMenuBarActionProps {
  item: IMenuActionItem;
  parentMenuInfo?: IMenuInfo;
  context: IDataContext;
  icon?: string;
  submenu?: React.FC<React.PropsWithChildren>;
  className?: string;
}

export const MenuBarAction = registry(
  observer<IMenuBarActionProps>(function MenuBarAction({ item, parentMenuInfo, submenu, className }) {
    const actionInfo = item.action.actionInfo;
    const loading = item.action.isLoading();

    /** @deprecated must be refactored (#1)*/
    const displayLabel = item.action.isLabelVisible();

    function handleClick() {
      item.events?.onSelect?.();
      item.action.activate();
    }

    return (
      <MenuBarItem
        id={item.id}
        hidden={item.hidden}
        aria-label={actionInfo.label}
        label={actionInfo.label}
        displayLabel={displayLabel}
        icon={actionInfo.icon ?? parentMenuInfo?.icon}
        title={actionInfo.tooltip ?? parentMenuInfo?.tooltip}
        disabled={item.disabled}
        loading={loading}
        submenu={submenu}
        className={className}
        onClick={handleClick}
      />
    );
  }),
);

interface ISubMenuItemProps extends React.PropsWithChildren {
  item: MenuSubMenuItem;
  menuData: IMenuData;
  filterAction?: IMenuActionItem;
  nestedMenuSettings?: IMenuBarNestedMenuSettings;
  className?: string;
  rtl?: boolean;
}

const SubMenuItem = observer<ISubMenuItemProps>(function SubMenuItem({ children, item, filterAction, menuData, nestedMenuSettings, className, rtl }) {
  const subMenuData = useMenu({ menu: item.menu, context: menuData.context, filterAction });

  useDataContextLink(subMenuData.context, (context, id) => {
    subMenuData.context.set(DATA_CONTEXT_MENU_NESTED, true, id);
    subMenuData.context.set(DATA_CONTEXT_SUBMENU_ITEM, item, id);
  });

  const handler = subMenuData.handler;
  const hideIfEmpty = handler?.hideIfEmpty?.(subMenuData.context) ?? true;
  const hidden = getComputed(() => subMenuData.items.every(item => item.hidden));

  // TODO: need to be fixed, in case when menu depend on data from loaders this may be always true
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
  const label = info?.label ?? item.label ?? item.menu.info.label;
  const icon = info?.icon ?? item.icon ?? item.menu.info.icon;
  const tooltip = info?.tooltip ?? item.tooltip ?? item.menu.info.tooltip;
  const panelAvailable = subMenuData.itemCreators.length > 0;

  return (
    <ContextMenu menu={subMenuData} className={className} rtl={rtl} modal disclosure {...nestedMenuSettings}>
      {({ loading, disabled }) =>
        children || (
          <MenuBarItem
            id={item.id}
            hidden={item.hidden}
            aria-label={item.menu.info.label}
            label={label}
            displayLabel={displayLabel}
            icon={IconComponent ? <IconComponent item={item} {...extraProps} /> : icon}
            title={tooltip}
            loading={loading}
            disabled={disabled}
            displaySubmenuMark={panelAvailable}
          />
        )
      }
    </ContextMenu>
  );
});

interface ISubMenuGroupItemProps {
  item: MenuSubMenuItem;
  menuData: IMenuData;
  nestedMenuSettings?: IMenuBarNestedMenuSettings;
  className?: string;
  rtl?: boolean;
}

const SubMenuGroupItem = observer<ISubMenuGroupItemProps>(function SubMenuGroupItem({ item, menuData, nestedMenuSettings, className, rtl }) {
  const menuService = useService(MenuService);
  const subMenuData = useMenu({ menu: item.menu, context: menuData.context });

  useDataContextLink(subMenuData.context, (context, id) => {
    subMenuData.context.set(DATA_CONTEXT_MENU_NESTED, true, id);
    subMenuData.context.set(DATA_CONTEXT_SUBMENU_ITEM, item, id);
  });

  const handler = subMenuData.handler;
  const hideIfEmpty = handler?.hideIfEmpty?.(subMenuData.context) ?? true;
  const hidden = getComputed(() => subMenuData.items.every(item => item.hidden));
  const info = handler?.getInfo?.(subMenuData.context, subMenuData.menu);
  const action = info ? info.action : item.menu.info.action;
  const group = info ? info.group : item.menu.info.group;
  let actionItem: IMenuActionItem | null = null;

  if (action) {
    actionItem = menuService.createActionItem(subMenuData.context, action);
  }

  // TODO: need to be fixed, in case when menu depend on data from loaders this may be always true
  if (hideIfEmpty && hidden && !action) {
    return null;
  }

  if (actionItem) {
    return (
      <MenuBarAction
        item={actionItem}
        parentMenuInfo={info ?? item.menu.info}
        context={menuData.context}
        submenu={({ children }) => (
          <SubMenuItem item={item} menuData={menuData} className={className} rtl={rtl} nestedMenuSettings={nestedMenuSettings}>
            {children}
          </SubMenuItem>
        )}
        className={className}
      />
    );
  }

  if (group) {
    const firstActionItem = subMenuData.items.find(item => item instanceof MenuActionItem);
    if (firstActionItem) {
      // TODO: don't want to show submenu right now
      // if (subMenuData.items.length === 1) {
      return <MenuBarAction item={firstActionItem} parentMenuInfo={info ?? item.menu.info} context={subMenuData.context} className={className} />;
      // }

      // return (
      //   <MenuBarAction
      //     item={firstActionItem}
      //     parentMenuInfo={info ?? item.menu.info}
      //     context={menuData.context}
      //     submenu={({ children }) => (
      //       <SubMenuItem item={item} menuData={menuData} className={className} rtl={rtl} nestedMenuSettings={nestedMenuSettings}>
      //         {children}
      //       </SubMenuItem>
      //     )}
      //     className={className}
      //   />
      // );
    }
  }

  return <SubMenuItem item={item} menuData={menuData} className={className} rtl={rtl} nestedMenuSettings={nestedMenuSettings} />;
});
