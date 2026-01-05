/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Icon, registry, s, useS, useTranslate, type IMenuItemGroupArrowElementProps } from '@cloudbeaver/core-blocks';

import style from './MenuBarGroupArrow.module.css';

export const MenuBarGroupArrow = registry(
  observer<IMenuItemGroupArrowElementProps>(function MenuBarGroupArrow({ className, title, ...rest }) {
    const styles = useS(style);
    const t = useTranslate();

    return (
      <button className={s(styles, { menuBarGroupArrowCustomSubmenuMark: true }, className)} title={t(title)} {...rest}>
        <Icon className={s(styles, { icon: true })} name="arrow" viewBox="0 0 16 16" />
      </button>
    );
  }),
);
