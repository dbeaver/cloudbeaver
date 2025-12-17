/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { registry, s, useS, type IMenuItemGroupElementProps } from '@cloudbeaver/core-blocks';

import style from './MenuBarGroup.module.css';

export const MenuBarGroup = registry(
  observer<IMenuItemGroupElementProps>(function MenuBarGroup({ className, children, ...rest }) {
    const styles = useS(style);

    return (
      <div className={s(styles, { menuBarGroup: true }, className)} {...rest}>
        {children}
      </div>
    );
  }),
);
