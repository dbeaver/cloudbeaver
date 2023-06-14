/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';
import { MenuItem, MenuItemCheckbox, MenuItemRadio } from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { Checkbox, MenuItemElement, menuPanelStyles, Radio, useStyles } from '@cloudbeaver/core-blocks';
import type { IMenuActionItem } from '@cloudbeaver/core-view';

import type { IContextMenuItemProps } from './IContextMenuItemProps';

interface IMenuActionElementProps extends IContextMenuItemProps {
  item: IMenuActionItem;
}

export const MenuActionElement = observer<IMenuActionElementProps>(function MenuActionElement({ item, menu, style, onClick }) {
  const styles = useStyles(menuPanelStyles, style);
  const actionInfo = item.action.actionInfo;
  const loading = item.action.isLoading();

  function handleClick() {
    onClick();
    item.action.activate();
  }

  if (actionInfo.type === 'select') {
    const checked = item.action.isChecked();
    return styled(styles)(
      <MenuItemRadio
        {...menu}
        {...use({ hidden: item.hidden })}
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
          style={style}
        />
      </MenuItemRadio>,
    );
  }

  if (actionInfo.type === 'checkbox') {
    const checked = item.action.isChecked();
    return styled(styles)(
      <MenuItemCheckbox
        {...menu}
        {...use({ hidden: item.hidden })}
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
          icon={<Checkbox checked={checked} mod={['primary', 'small']} style={style} ripple={false} />}
          tooltip={actionInfo.tooltip}
          loading={loading}
          style={style}
        />
      </MenuItemCheckbox>,
    );
  }

  return styled(styles)(
    <MenuItem {...menu} {...use({ hidden: item.hidden })} id={item.id} aria-label={actionInfo.label} disabled={item.disabled} onClick={handleClick}>
      <MenuItemElement
        label={actionInfo.label}
        icon={actionInfo.icon}
        binding={item.action.binding?.binding.label}
        tooltip={actionInfo.tooltip}
        loading={loading}
        style={style}
      />
    </MenuItem>,
  );
});
