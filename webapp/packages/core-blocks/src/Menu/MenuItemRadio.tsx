/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { MenuItemOptions, MenuItemRadio as ReakitMenuItemRadio } from 'reakit/Menu';
import type { RadioOptions } from 'reakit/ts';

import { s } from '../s';
import { useS } from '../useS';
import style from './MenuItem.m.css';
import { MenuStateContext } from './MenuStateContext';
import type { ReakitProxyComponent, ReakitProxyComponentOptions } from './ReakitProxyComponent';

type Options = RadioOptions & MenuItemOptions;

export const MenuItemRadio: ReakitProxyComponent<'button', Options> = observer<ReakitProxyComponentOptions<'button', Options>>(
  function MenuItemRadio({ hidden, children, className, ...rest }) {
    const menu = useContext(MenuStateContext);
    const styles = useS(style);

    const MenuItemRadio = ReakitMenuItemRadio;

    return (
      <MenuItemRadio {...menu} className={s(styles, { menuItem: true, hidden }, className)} {...rest}>
        {children}
      </MenuItemRadio>
    );
  },
);
