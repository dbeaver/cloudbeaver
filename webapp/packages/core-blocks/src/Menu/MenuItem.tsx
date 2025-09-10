/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';
import { Menu as UIKitMenu, type MenuItemProps as UIKitMenuItemProps } from '@dbeaver/ui-kit';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './MenuItem.module.css';

export type MenuItemOptions = {
  selected?: boolean;
  close?: boolean;
};

export interface IMenuItemProps extends Omit<UIKitMenuItemProps, 'children' | 'className'>, React.HTMLAttributes<HTMLDivElement> {
  selected?: boolean;
}

export const MenuItem = observer(function MenuItem({ children, selected, className, ...rest }: IMenuItemProps) {
  const styles = useS(style);

  return (
    <UIKitMenu.Item aria-selected={selected} className={s(styles, { menuItem: true }, className)} {...rest}>
      {children}
    </UIKitMenu.Item>
  );
});
