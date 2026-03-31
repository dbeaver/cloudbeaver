/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  getComputed,
  useAutoLoad,
  useTranslate,
  type IMenuItemElementProps,
  type IMenuItemGroupArrowElementProps,
  type IMenuItemGroupElementProps,
} from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import {
  DATA_CONTEXT_MENU_NESTED,
  DATA_CONTEXT_SUBMENU_ITEM,
  type IMenuActionItem,
  type IMenuData,
  type IMenuSubMenuItem,
  MenuActionItem,
  MenuService,
  useMenu,
} from '@cloudbeaver/core-view';

import type { IContextMenuNewProps } from './ContextMenu.js';
import { type HovercardStoreState, MenuItem } from '@dbeaver/ui-kit';
import { useService } from '@cloudbeaver/core-di';
import { MenuActionElement } from './MenuActionElement.js';
import { MenuContext, type IMenuContext } from './MenuContext.js';
import { RenderMenuItem } from './RenderMenuItem.js';
import { use, useCallback, useMemo } from 'react';

interface ISubMenuElementProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  menuData: IMenuData;
  subMenu: IMenuSubMenuItem;
  onlyIcons?: boolean;
  showSubmenuOnHover?: boolean;
  placement?: HovercardStoreState['placement'];
  menuComponent: React.FC<IContextMenuNewProps>;
  itemComponent: React.FC<IMenuItemElementProps>;
  groupComponent: React.FC<IMenuItemGroupElementProps>;
  groupArrowComponent: React.FC<IMenuItemGroupArrowElementProps>;
}

export const SubMenuElement = observer<ISubMenuElementProps>(function SubMenuElement({
  menuData,
  subMenu,
  placement,
  onlyIcons,
  showSubmenuOnHover,
  menuComponent,
  itemComponent: MenuItemElement,
  groupComponent: MenuItemGroupElement,
  groupArrowComponent: MenuItemGroupArrowElement,
}) {
  const parent = use(MenuContext);
  const translate = useTranslate();
  const menuService = useService(MenuService);
  const subMenuData = useMenu({ menu: subMenu.menu, context: menuData.context });

  useAutoLoad({ name: `SubMenuElement(${subMenu.menu.id})` }, subMenuData.loaders, true, true, false);

  useDataContextLink(subMenuData.context, (context, id) => {
    context.set(DATA_CONTEXT_MENU_NESTED, true, id);
    context.set(DATA_CONTEXT_SUBMENU_ITEM, subMenu, id);
  });

  const handler = subMenuData.handler;
  const hasVisibleItems = getComputed(() => subMenuData.items.some(item => !item.hidden));
  const allLoadersFinished = getComputed(() => subMenuData.loaders.every(loader => loader.isLoaded() || loader.isError()));

  const hidden = getComputed(() => {
    if (handler?.isHidden?.(subMenuData.context)) {
      return true;
    }

    return !hasVisibleItems;
  });
  const IconComponent = handler?.iconComponent?.() ?? subMenu.iconComponent?.();
  const extraProps = handler?.getExtraProps?.() ?? (subMenu.getExtraProps?.() as any);
  // TODO: fix, this triggers `Cannot update a component (`SubMenuElement`) while rendering a different component`
  //       and if getComputed used update will be skipped
  const loading = handler?.isLoading?.(subMenuData.context) || subMenuData.loaders.some(loader => loader.isLoading()) || false;
  /** @deprecated must be refactored (#1)*/
  const displayLabel = getComputed(() => handler?.isLabelVisible?.(subMenuData.context, subMenuData.menu) ?? true);
  const info = handler?.getInfo?.(subMenuData.context, subMenuData.menu);
  const action = info ? info.action : subMenu.menu.info.action;
  const label = info?.label ?? subMenu.label ?? subMenu.menu.info.label;
  const icon = info?.icon ?? subMenu.icon ?? subMenu.menu.info.icon;
  const group = info ? info.group : subMenu.menu.info.group;
  const disabled = getComputed(() => handler?.isDisabled?.(subMenuData.context) || !hasVisibleItems);

  const tooltip = info?.tooltip ?? subMenu.tooltip ?? subMenu.menu.info.tooltip;
  const MenuComponent = menuComponent;

  let actionItem: IMenuActionItem | null = null;

  if (action) {
    actionItem = menuService.createActionItem(subMenuData.context, action);
  }
  const menuContext = useMemo<IMenuContext>(() => ({ menu: subMenuData, rtl: parent?.rtl }), [subMenuData, parent]);

  const handleClick = useCallback(
    function handleClick() {
      subMenu.events?.onSelect?.(menuData.context);
    },
    [menuData, subMenu],
  );

  if (!allLoadersFinished) {
    return null;
  }

  // TODO: need to be fixed, in case when menu depend on data from loaders this may be always true
  if (hidden && !action) {
    return null;
  }

  const visibleItems = getComputed(() => subMenuData.items.filter(item => !item.hidden));

  if (!action && visibleItems.length === 1) {
    const singleItem = visibleItems[0]!;
    return (
      <RenderMenuItem
        item={singleItem}
        menuData={subMenuData}
        onlyIcons={onlyIcons}
        menuComponent={menuComponent}
        itemComponent={MenuItemElement}
        groupComponent={MenuItemGroupElement}
        groupArrowComponent={MenuItemGroupArrowElement}
      />
    );
  }

  if (actionItem) {
    return (
      <MenuItemGroupElement>
        <MenuContext value={menuContext}>
          <MenuActionElement
            item={actionItem}
            parentMenuInfo={info ?? subMenuData.menu.info}
            menuData={subMenuData}
            onlyIcons={!displayLabel || onlyIcons}
            itemComponent={MenuItemElement}
          />
        </MenuContext>
        <MenuComponent
          menu={subMenuData}
          placement={placement}
          render={<MenuItemGroupArrowElement title={label ?? tooltip} style={{ pointerEvents: 'auto' }} />}
          id={subMenu.id}
          aria-label={translate(subMenu.label)}
          showOnHover={showSubmenuOnHover}
          disabled={disabled}
          onClick={handleClick}
        />
      </MenuItemGroupElement>
    );
  }

  if (group) {
    const firstActionItem = subMenuData.items.find(item => item instanceof MenuActionItem);
    if (firstActionItem) {
      // TODO: don't want to show submenu right now
      // if (subMenuData.items.length === 1) {
      return (
        <MenuContext value={menuContext}>
          <MenuActionElement
            item={firstActionItem}
            parentMenuInfo={info ?? subMenuData.menu.info}
            menuData={subMenuData}
            onlyIcons={!displayLabel || onlyIcons}
            itemComponent={MenuItemElement}
          />
        </MenuContext>
      );
      // }

      // return (
      //   <MenuItemGroupElement>
      //     <MenuContext value={menuContext}>
      //       <MenuActionElement
      //         item={firstActionItem}
      //         parentMenuInfo={info ?? subMenuData.menu.info}
      //         menuData={subMenuData}
      //         onlyIcons={!displayLabel || onlyIcons}
      //         itemComponent={MenuItemElement}
      //       />
      //     </MenuContext>
      //     <MenuComponent
      //       menu={subMenuData}
      //       placement={placement}
      //       render={<MenuItemGroupArrowElement title={label ?? tooltip} style={{ pointerEvents: 'auto' }} />}
      //       id={subMenu.id}
      //       aria-label={translate(subMenu.label)}
      //       disabled={disabled}
      //       onClick={handleClick}
      //     />
      //   </MenuItemGroupElement>
      // );
    }
  }

  return (
    <MenuComponent
      menu={subMenuData}
      placement={placement}
      gutter={-4}
      render={
        <MenuItem
          id={subMenu.id}
          render={
            <MenuItemElement
              label={label}
              onlyIcons={!displayLabel || onlyIcons}
              icon={IconComponent ? <IconComponent item={subMenu} {...extraProps} /> : icon}
              tooltip={tooltip}
              loading={loading}
              style={{ pointerEvents: 'auto' }}
              aria-label={translate(subMenu.label)}
              displaySubmenuMark
            />
          }
        />
      }
      showOnHover={showSubmenuOnHover}
      disabled={disabled}
      onClick={handleClick}
    />
  );
});
