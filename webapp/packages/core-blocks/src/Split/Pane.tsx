/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Pane as BasePane, type PaneProps } from 'go-split';
import { observer } from 'mobx-react-lite';

import { s } from '../s.js';
import { useS } from '../useS.js';
import style from './Pane.module.css';
import { useSplit } from './useSplit.js';

export const Pane = observer<PaneProps>(function Pane({ className, children, ...rest }) {
  const styles = useS(style);
  const split = useSplit();
  const shouldHideContent = (rest.main && split.state.mode === 'minimize') || (!rest.main && split.state.mode === 'maximize');

  return (
    <BasePane className={s(styles, { pane: true }, className)} {...rest}>
      {shouldHideContent ? null : children}
    </BasePane>
  );
});
