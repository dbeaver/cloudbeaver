/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import { Checkbox, MenuItem, MenuItemCheckbox, MenuItemElement, MenuSeparator } from '@cloudbeaver/core-blocks';
import {
  IMenuData,
  IMenuItem,
  MenuActionItem,
  MenuBaseItem,
  MenuCheckboxItem,
  MenuCustomItem,
  MenuSeparatorItem,
  MenuSubMenuItem,
} from '@cloudbeaver/core-view';

import { MenuActionElement } from './MenuActionElement';
import { SubMenuElement } from './SubMenuElement';

export interface IMenuItemRendererProps extends React.ButtonHTMLAttributes<any> {
  item: IMenuItem;
  menuData: IMenuData;
  modal?: boolean;
  rtl?: boolean;
  onItemClose?: () => void;
}

export const MenuItemRenderer = observer<IMenuItemRendererProps>(function MenuItemRenderer({ item, modal, rtl, menuData, onItemClose }) {
  const onClick = useCallback(
    (keepMenuOpen = true) => {
      item.events?.onSelect?.();

      if (!(item instanceof MenuSubMenuItem) && keepMenuOpen) {
        onItemClose?.();
      }
    },
    [item, onItemClose],
  );

  if (item instanceof MenuCustomItem) {
    const CustomMenuItem = item.getComponent();

    return <CustomMenuItem item={item} menuData={menuData} onClick={onClick} />;
  }

  if (item instanceof MenuSubMenuItem) {
    return (
      <MenuItem
        {...{ as: SubMenuElement }}
        id={item.id}
        aria-label={item.menu.label}
        hidden={item.hidden}
        itemRenderer={MenuItemRenderer}
        menuRtl={rtl}
        menuData={menuData}
        menuModal={modal}
        subMenu={item}
        onItemClose={onItemClose}
        onClick={() => onClick()}
      />
    );
  }

  if (item instanceof MenuSeparatorItem) {
    return <MenuSeparator />;
  }

  if (item instanceof MenuActionItem) {
    return <MenuActionElement item={item} menuData={menuData} onClick={onClick} />;
  }

  if (item instanceof MenuCheckboxItem) {
    return (
      <MenuItemCheckbox
        hidden={item.hidden}
        id={item.id}
        aria-label={item.label}
        disabled={item.disabled}
        name={item.id}
        value={item.label}
        checked={item.checked}
        onClick={() => onClick(false)}
      >
        <MenuItemElement
          label={item.label}
          icon={<Checkbox checked={item.checked} mod={['primary', 'small']} ripple={false} />}
          tooltip={item.tooltip}
        />
      </MenuItemCheckbox>
    );
  }

  if (item instanceof MenuBaseItem) {
    const IconComponent = item.iconComponent?.();
    const extraProps = item.getExtraProps?.();

    return (
      <MenuItem id={item.id} aria-label={item.label} hidden={item.hidden} disabled={item.disabled} onClick={() => onClick()}>
        <MenuItemElement label={item.label} icon={IconComponent ? <IconComponent item={item} {...extraProps} /> : item.icon} tooltip={item.tooltip} />
      </MenuItem>
    );
  }

  return null;
});
