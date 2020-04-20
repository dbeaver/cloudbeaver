/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect } from 'react';
import {
  useMenuState,
  Menu,
  MenuItem,
  MenuDisclosure,
} from 'reakit/Menu';
import { Portal } from 'reakit/Portal';
import styled, { css } from 'reshadow';

import { composes, useStyles } from '@dbeaver/core/theming';

const styles = composes(
  css`
    Menu {
      composes: theme-text-on-surface theme-background-surface from global;
    }
    MenuItem, MenuDisclosure {
      composes: theme-ripple from global;
    }
  `,
  css`
    MenuDisclosure {
      background: transparent;
      outline: none;
      padding: 4px;
      cursor: pointer;
    }

    Menu {
      composes: theme-typography--caption theme-elevation-z3 from global;
      display: flex;
      flex-direction: column;
      width: 420px;
      outline: none;
      padding: 4px 0;

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

type DriverPropertyValueSelectorProps = React.PropsWithChildren<{
  propertyName?: string;
  values: string[];
  onSelect(value: string): void;
  onSwitch(state: boolean): void;
}>

export function DriverPropertyValueSelector({
  propertyName,
  values,
  children,
  onSelect,
  onSwitch,
}: DriverPropertyValueSelectorProps) {
  const menu = useMenuState();
  const handleMenuSelect = useCallback(
    (value: string) => {
      menu.hide();
      onSelect(value);
    },
    [menu, onSelect]
  );
  useEffect(() => onSwitch(menu.visible), [menu.visible]);

  return styled(useStyles(styles))(
    <>
      <MenuDisclosure {...menu}>{children}</MenuDisclosure>
      <Portal>
        <Menu {...menu} aria-label={propertyName}>
          {values.map(value => (
            <MenuItem key={value} {...menu} onClick={() => handleMenuSelect(value)}>
              {value}
            </MenuItem>
          ))}
        </Menu>
      </Portal>
    </>
  );
}
