/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Menu as UIKitMenu, type MenuItemProps as UIKitMenuItemProps } from '@dbeaver/ui-kit';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './MenuItem.module.css';

export interface IMenuItemProps extends UIKitMenuItemProps {
  selected?: boolean;
}

export const MenuItem = observer(function MenuItem({ children, selected, hidden, className, ...rest }: IMenuItemProps) {
  const styles = useS(style);

  return (
    <UIKitMenu.Item
      aria-selected={selected}
      {...rest}
      className={s(styles, { menuItem: true, hidden }, className)}
      disabled={selected || rest.disabled}
      style={{ pointerEvents: 'auto' }}
      focusable
    >
      {children}
    </UIKitMenu.Item>
  );
});
