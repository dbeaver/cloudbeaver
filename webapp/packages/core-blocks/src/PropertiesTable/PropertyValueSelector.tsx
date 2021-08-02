/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useCallback, useEffect } from 'react';
import {
  useMenuState,
  Menu,
  MenuItem,
  MenuButton
} from 'reakit/Menu';
import styled, { css } from 'reshadow';

import { composes, useStyles } from '@cloudbeaver/core-theming';

const styles = composes(
  css`
    Menu {
      composes: theme-text-on-surface theme-background-surface from global;
    }
    MenuItem, MenuButton {
      composes: theme-ripple from global;
    }
  `,
  css`
    MenuButton {
      background: transparent;
      outline: none;
      padding: 4px;
      cursor: pointer;
    }

    Menu {
      composes: theme-typography--caption theme-elevation-z3 from global;
      display: flex;
      flex-direction: column;
      width: 100%;
      outline: none;
      padding: 4px 0;
      z-index: 999;

      & MenuItem {
        background: transparent;
        display: block;
        padding: 4px 36px;
        text-align: left;
        outline: none;
        color: inherit;
        cursor: pointer;
      }
    }
  `
);

interface Props {
  propertyName?: string;
  values: string[];
  onSelect: (value: string) => void;
  onSwitch: (state: boolean) => void;
}

export const PropertyValueSelector: React.FC<Props> = observer(function PropertyValueSelector({
  propertyName,
  values,
  children,
  onSelect,
  onSwitch,
}) {
  const menu = useMenuState();
  const handleMenuSelect = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      menu.hide();
      onSelect(event.currentTarget.id);
    },
    [menu, onSelect]
  );
  useEffect(() => onSwitch(menu.visible), [menu.visible]);

  return styled(useStyles(styles))(
    <>
      <MenuButton {...menu}>{children}</MenuButton>
      <Menu {...menu} aria-label={propertyName}>
        {menu.visible && values.map(value => (
          <MenuItem key={value} id={value} type='button' {...menu} onClick={handleMenuSelect}>
            {value}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
});
