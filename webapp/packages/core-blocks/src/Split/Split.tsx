/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Split as BaseSplit, SplitProps } from 'go-split';
import { observer } from 'mobx-react-lite';
import { useRef } from 'react';

import { s } from '../s';
import { useS } from '../useS';
import style from './Split.m.css';
import { useAutoMargin } from './useAutoMargin';

export type ISplitProps = SplitProps & {
  disableAutoMargin?: boolean;
};

export const Split = observer<ISplitProps>(function Split({ className, minSize, maxSize, split, disableAutoMargin = false, ...rest }) {
  const styles = useS(style);
  const ref = useRef<BaseSplit | null>(null);

  const vertical = split === 'vertical' || split === undefined;
  const horizontal = split === 'horizontal';

  const { maxSize: calculatedMaxSize, minSize: calculatedMinSize } = useAutoMargin({
    disableAutoMargin,
    split,
    maxSize,
    minSize,
    ref,
  });

  return (
    <BaseSplit
      ref={ref}
      minSize={calculatedMinSize}
      maxSize={calculatedMaxSize}
      className={s(styles, { split: true, vertical, horizontal }, className)}
      split={split}
      {...rest}
    />
  );
});
