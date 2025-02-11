/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import { type MenuItemOptions, MenuItemRadio as ReakitMenuItemRadio, type RadioOptions } from 'reakit';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './MenuItem.module.css';
import { MenuStateContext } from './MenuStateContext.js';
import type { ReakitProxyComponent, ReakitProxyComponentOptions } from './ReakitProxyComponent.js';

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
) as ReakitProxyComponent<'button', Options>;
