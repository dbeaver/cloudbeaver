/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import { Checkbox, MenuItem, MenuItemCheckbox, MenuItemElement, MenuItemRadio, MenuSeparator, Radio, useTranslate } from '@cloudbeaver/core-blocks';
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

import { MenuActionElement } from './MenuActionElement.js';
import { SubMenuElement } from './SubMenuElement.js';

export interface IMenuItemRendererProps extends React.ButtonHTMLAttributes<any> {
  item: IMenuItem;
  menuData: IMenuData;
  modal?: boolean;
  rtl?: boolean;
  onItemClose?: () => void;
}

export const MenuItemRenderer = observer<IMenuItemRendererProps>(function MenuItemRenderer({ item, modal, rtl, menuData, onItemClose }) {
  const translate = useTranslate();
  const onClick = useCallback(
    (keepMenuOpen = true) => {
      item.events?.onSelect?.();

      if (!(item instanceof MenuSubMenuItem) && keepMenuOpen) {
        onItemClose?.();
      }
    },
    [item, onItemClose],
  );

  if (isMenuCustomItem(item)) {
    const CustomMenuItem = item.getComponent();

    return <CustomMenuItem item={item} context={menuData.context} onClick={onClick} />;
  }

  if (item instanceof MenuSubMenuItem) {
    return (
      <MenuItem
        {...{ as: SubMenuElement }}
        id={item.id}
        aria-label={translate(item.menu.info.label)}
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
        aria-label={translate(item.label)}
        disabled={item.disabled}
        name={item.id}
        value={item.label}
        checked={item.checked}
        onClick={() => onClick(false)}
      >
        <MenuItemElement label={item.label} icon={<Checkbox checked={item.checked} size="small" />} tooltip={item.tooltip} />
      </MenuItemCheckbox>
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
        onClick={() => onClick()}
      >
        <MenuItemElement label={item.label} icon={<Radio size="small" checked={item.checked} />} tooltip={item.tooltip} />
      </MenuItemRadio>
    );
  }

  if (item instanceof MenuBaseItem) {
    const IconComponent = item.iconComponent?.();
    const extraProps = item.getExtraProps?.();

    return (
      <MenuItem
        id={item.id}
        aria-label={translate(item.label)}
        hidden={item.hidden}
        disabled={item.disabled}
        style={{ pointerEvents: 'auto' }}
        focusable
        onClick={() => onClick()}
      >
        <MenuItemElement label={item.label} icon={IconComponent ? <IconComponent item={item} {...extraProps} /> : item.icon} tooltip={item.tooltip} />
      </MenuItem>
    );
  }

  return null;
});
