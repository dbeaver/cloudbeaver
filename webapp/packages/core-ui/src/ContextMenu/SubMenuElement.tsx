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
  useTranslate,
  type IMenuItemElementProps,
  type IMenuItemGroupArrowElementProps,
  type IMenuItemGroupElementProps,
} from '@cloudbeaver/core-blocks';
import { type IMenuActionItem, type IMenuData, type IMenuSubMenuItem, MenuActionItem, MenuService } from '@cloudbeaver/core-view';

import type { IContextMenuNewProps } from './ContextMenu.js';
import { type HovercardStoreState, MenuItem } from '@dbeaver/ui-kit';
import { useService } from '@cloudbeaver/core-di';
import { MenuActionElement } from './MenuActionElement.js';
import { MenuContext, type IMenuContext } from './MenuContext.js';
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
  // The parent model creates and prepares this scope independently of the submenu UI.
  const subMenuData = menuData.getSubMenu(subMenu)!;

  const handler = subMenuData.handler;

  const hidden = getComputed(() => subMenuData.hidden);
  const IconComponent = handler?.iconComponent?.() ?? subMenu.iconComponent?.();
  const extraProps = handler?.getExtraProps?.() ?? (subMenu.getExtraProps?.() as any);
  const loading = handler?.isLoading?.(subMenuData.context) ?? false;
  /** @deprecated must be refactored (#1)*/
  const displayLabel = getComputed(() => handler?.isLabelVisible?.(subMenuData.context, subMenuData.menu) ?? true);
  const info = handler?.getInfo?.(subMenuData.context, subMenuData.menu);
  const action = info ? info.action : subMenu.menu.info.action;
  const label = info?.label ?? subMenu.label ?? subMenu.menu.info.label;
  const icon = info?.icon ?? subMenu.icon ?? subMenu.menu.info.icon;
  const group = info ? info.group : subMenu.menu.info.group;
  const disabled = getComputed(() => (!subMenuData.prepared && !subMenuData.isError()) || handler?.isDisabled?.(subMenuData.context));

  const tooltip = info?.tooltip ?? subMenu.tooltip ?? subMenu.menu.info.tooltip;
  const MenuComponent = menuComponent;

  let actionItem: IMenuActionItem | null = null;

  if (action && subMenuData.prepared) {
    actionItem = menuService.createActionItem(subMenuData.context, action);
  }
  const menuContext = useMemo<IMenuContext>(() => ({ menu: subMenuData, rtl: parent?.rtl }), [subMenuData, parent]);

  const handleClick = useCallback(
    function handleClick() {
      subMenu.events?.onSelect?.(menuData.context);
    },
    [menuData, subMenu],
  );

  if (hidden) {
    return null;
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
        {!subMenuData.empty && (
          <MenuComponent
            menu={subMenuData}
            placement={placement}
            title={translate(tooltip || label)}
            render={<MenuItemGroupArrowElement style={{ pointerEvents: 'auto' }} />}
            id={subMenu.id}
            aria-label={translate(label || tooltip)}
            showOnHover={showSubmenuOnHover}
            disabled={disabled}
            onClick={handleClick}
          />
        )}
      </MenuItemGroupElement>
    );
  }

  if (group) {
    const firstActionItem = subMenuData.visibleItems.find(item => item instanceof MenuActionItem);
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
      title={translate(tooltip || label)}
      aria-label={translate(label || tooltip)}
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
              aria-label={translate(label || tooltip)}
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
