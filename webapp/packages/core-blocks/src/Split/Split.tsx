/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Split as BaseSplit, SplitProps } from 'go-split';
import { observer } from 'mobx-react-lite';

import { s } from '../s';
import { useS } from '../useS';
import style from './Split.m.css';

export type ISplitProps = SplitProps;

export const Split = observer<ISplitProps>(function Split({ className, split, ...rest }) {
  const styles = useS(style);

  const vertical = split === 'vertical' || split === undefined;
  const horizontal = split === 'horizontal';

  return <BaseSplit className={s(styles, { split: true, vertical, horizontal }, className)} split={split} {...rest} />;
});
