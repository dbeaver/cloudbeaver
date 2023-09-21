/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { ComponentStyle } from '@cloudbeaver/core-theming';

import style from './Cell.m.css';
import { s } from './s';
import { useS } from './useS';

interface Props {
  description?: React.ReactElement | string;
  before?: React.ReactElement;
  after?: React.ReactElement;
  style?: ComponentStyle;
  ripple?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const Cell = observer<Props>(function Cell({ before, after, description, className, ripple = true, children }) {
  const styles = useS(style);

  return (
    <cell className={s(styles, { ripple }, className)}>
      <main className={s(styles, { main: true })}>
        <div className={s(styles, { before: true })}>{before}</div>
        <div className={s(styles, { info: true })}>
          {children}
          {description && <div className={s(styles, { description: true })}>{description}</div>}
        </div>
        <div className={s(styles, { after: true })}>{after}</div>
      </main>
    </cell>
  );
});
