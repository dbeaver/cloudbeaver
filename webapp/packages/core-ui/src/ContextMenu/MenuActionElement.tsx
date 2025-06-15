/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Checkbox, MenuItem, MenuItemCheckbox, MenuItemElement, MenuItemRadio, Radio, useTranslate } from '@cloudbeaver/core-blocks';
import { getBindingLabel, type IMenuActionItem } from '@cloudbeaver/core-view';

import type { IContextMenuItemProps } from './IContextMenuItemProps.js';

interface IMenuActionElementProps extends IContextMenuItemProps {
  item: IMenuActionItem;
}

export const MenuActionElement = observer<IMenuActionElementProps>(function MenuActionElement({ item, onClick }) {
  const translate = useTranslate();
  const actionInfo = item.action.actionInfo;
  const loading = item.action.isLoading();
  let binding;
  if (item.action.binding !== null) {
    binding = getBindingLabel(item.action.binding.binding);
  }

  function handleClick() {
    onClick();
    item.action.activate();
  }

  const label = translate(actionInfo.label);

  if (actionInfo.type === 'select') {
    const checked = item.action.isChecked();
    return (
      <MenuItemRadio
        hidden={item.hidden}
        id={item.id}
        aria-label={label}
        disabled={item.disabled}
        name={item.id}
        value={label}
        checked={checked}
        style={{ pointerEvents: 'auto' }}
        focusable
        onClick={handleClick}
      >
        <MenuItemElement
          label={actionInfo.label}
          icon={<Radio checked={checked} mod={['primary', 'menu']} ripple={false} />}
          tooltip={actionInfo.tooltip}
          loading={loading}
        />
      </MenuItemRadio>
    );
  }

  if (actionInfo.type === 'checkbox') {
    const checked = item.action.isChecked();
    return (
      <MenuItemCheckbox
        hidden={item.hidden}
        id={item.id}
        aria-label={label}
        disabled={item.disabled}
        name={item.id}
        value={label}
        checked={checked}
        style={{ pointerEvents: 'auto' }}
        focusable
        onClick={handleClick}
      >
        <MenuItemElement label={actionInfo.label} icon={<Checkbox checked={checked} size="small" />} tooltip={actionInfo.tooltip} loading={loading} />
      </MenuItemCheckbox>
    );
  }

  return (
    <MenuItem
      hidden={item.hidden}
      id={item.id}
      aria-label={label}
      disabled={item.disabled}
      style={{ pointerEvents: 'auto' }}
      focusable
      onClick={handleClick}
    >
      <MenuItemElement label={actionInfo.label} icon={actionInfo.icon} binding={binding} tooltip={actionInfo.tooltip} loading={loading} />
    </MenuItem>
  );
});
