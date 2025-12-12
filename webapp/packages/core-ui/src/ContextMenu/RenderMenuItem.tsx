/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import {
  Checkbox,
  Radio,
  useTranslate,
  type IMenuItemElementProps,
  type IMenuItemGroupArrowElementProps,
  type IMenuItemGroupElementProps,
} from '@cloudbeaver/core-blocks';
import {
  type IMenuData,
  type IMenuItem,
  isMenuCustomItem,
  MenuActionItem,
  MenuBaseItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuSeparatorItem,
  MenuSubMenuItem,
} from '@cloudbeaver/core-view';
import { type HovercardStoreState, MenuItem, MenuItemCheckbox, MenuItemRadio, MenuSeparator } from '@dbeaver/ui-kit';
import { MenuActionElement } from './MenuActionElement.js';
import type { IContextMenuNewProps } from './ContextMenu.js';
import { SubMenuElement } from './SubMenuElement.js';

export interface IRenderMenuItemProps extends React.ButtonHTMLAttributes<any> {
  item: IMenuItem;
  menuData: IMenuData;
  showSubmenuOnHover?: boolean;
  onlyIcons?: boolean;
  placement?: HovercardStoreState['placement'];
  menuComponent: React.FC<IContextMenuNewProps>;
  itemComponent: React.FC<IMenuItemElementProps>;
  groupComponent: React.FC<IMenuItemGroupElementProps>;
  groupArrowComponent: React.FC<IMenuItemGroupArrowElementProps>;
}

export const RenderMenuItem = observer<IRenderMenuItemProps>(function RenderMenuItem({
  item,
  menuData,
  showSubmenuOnHover,
  onlyIcons,
  placement,
  menuComponent,
  itemComponent: MenuItemElement,
  groupComponent: MenuItemGroupElement,
  groupArrowComponent: MenuItemGroupArrowElement,
}) {
  const translate = useTranslate();
  const onClick = useCallback(() => {
    item.events?.onSelect?.(menuData.context);
  }, [item, menuData]);

  if (item.hidden) {
    return null;
  }

  if (isMenuCustomItem(item)) {
    const CustomMenuItem = item.getComponent();

    return <CustomMenuItem item={item} context={menuData.context} onClick={onClick} />;
  }

  if (item instanceof MenuSubMenuItem) {
    return (
      <SubMenuElement
        subMenu={item}
        menuData={menuData}
        onlyIcons={onlyIcons}
        placement={placement}
        showSubmenuOnHover={showSubmenuOnHover}
        menuComponent={menuComponent}
        itemComponent={MenuItemElement}
        groupComponent={MenuItemGroupElement}
        groupArrowComponent={MenuItemGroupArrowElement}
      />
    );
  }

  if (item instanceof MenuSeparatorItem) {
    return <MenuSeparator />;
  }

  if (item instanceof MenuActionItem) {
    return <MenuActionElement item={item} menuData={menuData} onlyIcons={onlyIcons} itemComponent={MenuItemElement} />;
  }

  if (item instanceof MenuCheckboxItem) {
    return (
      <MenuItemCheckbox
        hidden={item.hidden}
        id={item.id}
        aria-label={translate(item.label)}
        disabled={item.disabled}
        name={item.id}
        value={item.label}
        checked={item.checked}
        render={
          <MenuItemElement label={item.label} icon={<Checkbox checked={item.checked} size="small" />} onlyIcons={onlyIcons} tooltip={item.tooltip} />
        }
        onClick={onClick}
      />
    );
  }

  if (item instanceof MenuRadioItem) {
    return (
      <MenuItemRadio
        hidden={item.hidden}
        id={item.id}
        aria-label={translate(item.label)}
        disabled={item.disabled}
        name={item.id}
        value={item.label}
        checked={item.checked}
        render={
          <MenuItemElement label={item.label} icon={<Radio size="small" checked={item.checked} />} onlyIcons={onlyIcons} tooltip={item.tooltip} />
        }
        onClick={onClick}
      />
    );
  }

  if (item instanceof MenuBaseItem) {
    const IconComponent = item.iconComponent?.();
    const extraProps = item.getExtraProps?.();

    return (
      <MenuItem
        id={item.id}
        aria-label={translate(item.label)}
        disabled={item.disabled}
        style={{ pointerEvents: 'auto' }}
        render={
          <MenuItemElement
            label={item.label}
            icon={IconComponent ? <IconComponent item={item} {...extraProps} /> : item.icon}
            tooltip={item.tooltip}
            onlyIcons={onlyIcons}
          />
        }
        focusable
        onClick={onClick}
      />
    );
  }

  return null;
});
