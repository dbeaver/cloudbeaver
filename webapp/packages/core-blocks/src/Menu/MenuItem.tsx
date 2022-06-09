/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { MenuItem as ReakitMenuItem } from 'reakit/Menu';
import styled, { use } from 'reshadow';

import { ComponentStyle, useStyles } from '@cloudbeaver/core-theming';

import { useCombinedHandler } from '../useCombinedHandler';
import { menuPanelStyles } from './menuPanelStyles';
import { MenuStateContext } from './MenuStateContext';


export interface IMenuItemProps extends Omit<React.ButtonHTMLAttributes<any>, 'style'> {
  label: string;
  hidden?: boolean;
  selected?: boolean;
  close?: boolean;
  style?: ComponentStyle;
}

export const MenuItem = observer<IMenuItemProps>(function MenuItem({
  label,
  children,
  hidden,
  selected,
  close,
  style,
  onClick,
  ...rest
}) {
  const menu = useContext(MenuStateContext);
  const styles = useStyles(menuPanelStyles, style);

  const handleClick = useCombinedHandler<[React.MouseEvent<HTMLButtonElement>]>(onClick, function handleClick() {
    if (close) {
      menu?.hide();
    }
  });

  const MenuItem = ReakitMenuItem;

  return styled(styles)(
    <MenuItem
      {...menu}
      {...use({ hidden: hidden })}
      aria-label={label}
      aria-selected={selected}
      {...rest}
      disabled={selected || rest.disabled}
      onClick={handleClick}
    >
      {children}
    </MenuItem>
  );
});