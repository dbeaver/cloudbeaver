/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Split as BaseSplit, type SplitProps } from 'go-split';
import { observer } from 'mobx-react-lite';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './Split.module.css';

export type ISplitProps = SplitProps & {
  disableAutoMargin?: boolean;
};

const AUTO_MARGIN = 22;

export const Split = observer<ISplitProps>(function Split({ className, minSize, maxSize, split, disableAutoMargin = false, ...rest }) {
  const styles = useS(style);

  const vertical = split === 'vertical' || split === undefined;
  const horizontal = split === 'horizontal';

  if (!disableAutoMargin) {
    minSize = AUTO_MARGIN;
    maxSize = -AUTO_MARGIN;
  }

  return (
    <BaseSplit minSize={minSize} maxSize={maxSize} className={s(styles, { split: true, vertical, horizontal }, className)} split={split} {...rest} />
  );
});
