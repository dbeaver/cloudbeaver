/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React, { useContext } from 'react';
import { MenuItem as ReakitMenuItem, type CompositeItemOptions } from 'reakit';

import { s } from '../s.js';
import { useCombinedHandler } from '../useCombinedHandler.js';
import { useS } from '../useS.js';
import style from './MenuItem.module.css';
import { MenuStateContext } from './MenuStateContext.js';
import type { ReakitProxyComponent, ReakitProxyComponentOptions } from './ReakitProxyComponent.js';

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
        style={{ pointerEvents: 'auto' }}
        focusable
        onClick={handleClick}
      >
        {children}
      </MenuItem>
    );
  },
) as ReakitProxyComponent<'button', MenuItemOptions>;
