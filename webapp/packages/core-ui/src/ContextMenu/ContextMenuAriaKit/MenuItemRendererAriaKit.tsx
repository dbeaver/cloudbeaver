/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useCallback } from 'react';

import { useTranslate } from '@cloudbeaver/core-blocks';
import {
  type IMenuData,
  type IMenuItem,
  isMenuCustomItem,
  MenuBaseItem,
  MenuCheckboxItem,
  MenuRadioItem,
  MenuSeparatorItem,
  MenuSubMenuItem,
} from '@cloudbeaver/core-view';
import {
  MenuItem as AriaMenuItem,
  MenuSeparator as AriaMenuSeparator,
  MenuItemCheckbox as AriaMenuItemCheckbox,
  MenuItemRadio as AriaMenuItemRadio,
} from '@dbeaver/ui-kit';

export interface IMenuItemRendererAriaKitProps extends React.ButtonHTMLAttributes<any> {
  item: IMenuItem;
  menuData: IMenuData;
  onItemClose?: () => void;
}

export const MenuItemRendererAriaKit = observer<IMenuItemRendererAriaKitProps>(function MenuItemRendererAriaKit({ item, menuData, onItemClose }) {
  const translate = useTranslate();

  const onClick = useCallback(
    (keepMenuOpen = true) => {
      item.events?.onSelect?.(menuData.context);

      if (!(item instanceof MenuSubMenuItem) && keepMenuOpen) {
        onItemClose?.();
      }
    },
    [item, onItemClose, menuData.context],
  );

  if (isMenuCustomItem(item)) {
    const CustomMenuItem = item.getComponent();

    return <CustomMenuItem item={item} context={menuData.context} onClick={onClick} />;
  }

  if (item instanceof MenuSubMenuItem) {
    // Submenus are not yet supported in AriaKit wrapper. Render as disabled item for now.
    return (
      <AriaMenuItem aria-label={translate(item.menu.info.label)} hidden={item.hidden} disabled>
        {translate(item.menu.info.label)}
      </AriaMenuItem>
    );
  }

  if (item instanceof MenuSeparatorItem) {
    return <AriaMenuSeparator />;
  }

  if (item instanceof MenuBaseItem) {
    const IconComponent = item.iconComponent?.();
    const extraProps = item.getExtraProps?.();

    return (
      <AriaMenuItem aria-label={translate(item.label)} hidden={item.hidden} disabled={item.disabled} onClick={() => onClick()}>
        {IconComponent ? <IconComponent item={item} {...extraProps} /> : item.icon}
        {translate(item.label)}
      </AriaMenuItem>
    );
  }

  if (item instanceof MenuCheckboxItem) {
    return (
      <AriaMenuItemCheckbox
        hidden={item.hidden}
        aria-label={translate(item.label)}
        disabled={item.disabled}
        name={item.id}
        value={item.label}
        checked={item.checked}
        onClick={() => onClick(false)}
      >
        {translate(item.label)}
      </AriaMenuItemCheckbox>
    );
  }

  if (item instanceof MenuRadioItem) {
    return (
      <AriaMenuItemRadio
        hidden={item.hidden}
        aria-label={translate(item.label)}
        disabled={item.disabled}
        name={item.id}
        value={item.label}
        checked={item.checked}
        onClick={() => onClick()}
      >
        {translate(item.label)}
      </AriaMenuItemRadio>
    );
  }

  if (item instanceof MenuBaseItem) {
    const IconComponent = item.iconComponent?.();
    const extraProps = item.getExtraProps?.();

    return (
      <AriaMenuItem aria-label={translate(item.label)} hidden={item.hidden} disabled={item.disabled} onClick={() => onClick()}>
        {IconComponent ? <IconComponent item={item} {...extraProps} /> : item.icon}
        {translate(item.label)}
      </AriaMenuItem>
    );
  }

  return null;
});
