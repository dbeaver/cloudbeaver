/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { MenuItem as ReakitMenuItem } from 'reakit/Menu';
import type { CompositeItemOptions } from 'reakit/ts';

import { s } from '../s';
import { useCombinedHandler } from '../useCombinedHandler';
import { useS } from '../useS';
import style from './MenuItem.m.css';
import { MenuStateContext } from './MenuStateContext';
import type { ReakitProxyComponent, ReakitProxyComponentOptions } from './ReakitProxyComponent';

export type MenuItemOptions = CompositeItemOptions & {
  selected?: boolean;
  close?: boolean;
};

export const MenuItem: ReakitProxyComponent<'button', MenuItemOptions> = observer<ReakitProxyComponentOptions<'button', MenuItemOptions>>(
  function MenuItem({ children, hidden, selected, close, onClick, className, ...rest }) {
    const menu = useContext(MenuStateContext);
    const styles = useS(style);

    const handleClick = useCombinedHandler<[React.MouseEvent<HTMLButtonElement>]>(onClick, function handleClick() {
      if (close) {
        menu?.hide();
      }
    });

    const MenuItem = ReakitMenuItem;

    return (
      <MenuItem
        {...menu}
        aria-selected={selected}
        {...rest}
        className={s(styles, { menuItem: true, hidden }, className)}
        disabled={selected || rest.disabled}
        onClick={handleClick}
      >
        {children}
      </MenuItem>
    );
  },
) as ReakitProxyComponent<'button', MenuItemOptions>;
