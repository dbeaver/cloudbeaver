/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { Menu as UIKitMenu, type MenuItemCheckboxProps } from '@dbeaver/ui-kit';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './MenuItem.module.css';

export const MenuItemCheckbox = observer(function MenuItemCheckbox({ hidden, children, className, ...rest }: MenuItemCheckboxProps) {
  const styles = useS(style);

  return (
    <UIKitMenu.ItemCheckbox className={s(styles, { menuItem: true, hidden }, className)} {...rest}>
      {children}
    </UIKitMenu.ItemCheckbox>
  );
});
