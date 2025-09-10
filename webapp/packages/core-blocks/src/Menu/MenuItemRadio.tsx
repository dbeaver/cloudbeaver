/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Menu as UIKitMenu, type MenuItemRadioProps } from '@dbeaver/ui-kit';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './MenuItem.module.css';

export const MenuItemRadio = observer(function MenuItemRadio({ hidden, children, className, ...rest }: MenuItemRadioProps) {
  const styles = useS(style);

  return (
    <UIKitMenu.ItemRadio className={s(styles, { menuItem: true, hidden }, className)} {...rest}>
      {children}
    </UIKitMenu.ItemRadio>
  );
});
