/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';

import { Checkbox, MenuItem, MenuItemCheckbox, MenuItemElement, MenuItemRadio, Radio } from '@cloudbeaver/core-blocks';
import { getBindingLabel, IMenuActionItem } from '@cloudbeaver/core-view';

import type { IContextMenuItemProps } from './IContextMenuItemProps';

interface IMenuActionElementProps extends IContextMenuItemProps {
  item: IMenuActionItem;
}

export const MenuActionElement = observer<IMenuActionElementProps>(function MenuActionElement({ item, onClick }) {
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

  if (actionInfo.type === 'select') {
    const checked = item.action.isChecked();
    return (
      <MenuItemRadio
        hidden={item.hidden}
        id={item.id}
        aria-label={actionInfo.label}
        disabled={item.disabled}
        name={item.id}
        value={actionInfo.label}
        checked={checked}
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
        aria-label={actionInfo.label}
        disabled={item.disabled}
        name={item.id}
        value={actionInfo.label}
        checked={checked}
        onClick={handleClick}
      >
        <MenuItemElement
          label={actionInfo.label}
          icon={<Checkbox checked={checked} mod={['primary', 'small']} ripple={false} />}
          tooltip={actionInfo.tooltip}
          loading={loading}
        />
      </MenuItemCheckbox>
    );
  }

  return (
    <MenuItem hidden={item.hidden} id={item.id} aria-label={actionInfo.label} disabled={item.disabled} onClick={handleClick}>
      <MenuItemElement label={actionInfo.label} icon={actionInfo.icon} binding={binding} tooltip={actionInfo.tooltip} loading={loading} />
    </MenuItem>
  );
});
