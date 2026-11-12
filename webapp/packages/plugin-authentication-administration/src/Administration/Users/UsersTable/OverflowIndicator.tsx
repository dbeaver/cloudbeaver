/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { s, useS } from '@cloudbeaver/core-blocks';

import style from './OverflowIndicator.module.css';

interface Props {
  count: number;
}

export const OverflowIndicator = observer<Props>(function OverflowIndicator({ count }) {
  const styles = useS(style);

  return (
    <div className={s(styles, { indicator: true })}>
      <span>+{count}</span>
    </div>
  );
});
