/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Menu as UIKitMenu, type MenuSeparatorProps } from '@dbeaver/ui-kit';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './MenuSeparator.module.css';

export const MenuSeparator = function MenuSeparator({ className, ...props }: MenuSeparatorProps) {
  const styles = useS(style);
  return <UIKitMenu.Separator {...props} className={s(styles, { menuSeparator: true }, className)} />;
};
