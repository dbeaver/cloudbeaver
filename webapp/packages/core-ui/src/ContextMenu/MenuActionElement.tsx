/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Checkbox, getComputed, Radio, registry, useTranslate, type IMenuItemElementProps } from '@cloudbeaver/core-blocks';
import { getBindingLabel, type IMenuActionItem, type IMenuInfo } from '@cloudbeaver/core-view';
import type { IContextMenuItemProps } from './IContextMenuItemProps.js';
import { MenuItem, MenuItemCheckbox, MenuItemRadio } from '@dbeaver/ui-kit';
import { useCallback } from 'react';

interface IMenuActionElementProps extends IContextMenuItemProps {
  item: IMenuActionItem;
  onlyIcons?: boolean;
  parentMenuInfo?: IMenuInfo;
  itemComponent: React.FC<IMenuItemElementProps>;
}

export const MenuActionElement = registry(
  observer<IMenuActionElementProps>(function MenuActionElement({ item, parentMenuInfo, menuData, onlyIcons, itemComponent: MenuItemElement }) {
    const translate = useTranslate();

    const handleClick = useCallback(
      function handleClick() {
        item.events?.onSelect?.(menuData.context);
        item.action.activate();
      },
      [item, menuData],
    );

    if (item.hidden) {
      return null;
    }

    const actionInfo = item.action.actionInfo;
    const loading = getComputed(() => item.action.isLoading());
    let binding: string | undefined;
    if (item.action.binding !== null) {
      binding = getBindingLabel(item.action.binding.binding);
    }

    const label = translate(actionInfo.label);
    const baseItemIcon = getComputed(() => actionInfo.icon ?? parentMenuInfo?.icon);

    function renderMenuItem({ icon }: { icon?: React.ReactNode | string }) {
      return (
        <MenuItemElement
          label={actionInfo.label}
          binding={binding}
          icon={onlyIcons ? (baseItemIcon ?? icon) : icon}
          tooltip={actionInfo.tooltip}
          onlyIcons={onlyIcons}
          loading={loading}
        />
      );
    }

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
          render={renderMenuItem({ icon: <Radio checked={checked} size="small" /> })}
          focusable
          onClick={handleClick}
        />
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
          render={renderMenuItem({ icon: <Checkbox checked={checked} size="small" /> })}
          focusable
          onClick={handleClick}
        />
      );
    }

    return (
      <MenuItem
        id={item.id}
        aria-label={label}
        disabled={item.disabled}
        style={{ pointerEvents: 'auto' }}
        render={renderMenuItem({ icon: baseItemIcon })}
        focusable
        onClick={handleClick}
      />
    );
  }),
);
