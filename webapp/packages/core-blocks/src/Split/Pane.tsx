/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Pane as BasePane, PaneProps } from 'go-split';
import { observer } from 'mobx-react-lite';

import { s } from '../s';
import { useS } from '../useS';
import style from './Pane.m.css';
import { useSplit } from './useSplit';

export const Pane = observer<PaneProps>(function Pane({ className, ...rest }) {
  const styles = useS(style);
  const split = useSplit();
  let hiddenContent = false;

  if (rest.main && split.state.mode === 'minimize') {
    hiddenContent = true;
  }

  return <BasePane className={s(styles, { pane: true, hiddenContent }, className)} {...rest} />;
});
