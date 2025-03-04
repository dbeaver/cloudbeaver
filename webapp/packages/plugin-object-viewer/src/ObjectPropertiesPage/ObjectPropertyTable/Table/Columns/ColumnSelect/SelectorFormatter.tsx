/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';

import { Checkbox, getComputed, s, TableState, useS } from '@cloudbeaver/core-blocks';
import type { DBObject } from '@cloudbeaver/core-navigation-tree';

import style from './SelectorFormatter.module.css';

interface Props {
  tableState: TableState<string>;
  object: DBObject;
}

export const SelectorFormatter = observer<Props>(function SelectorFormatter({ tableState, object }) {
  const id = object.id;
  const selected = getComputed(() => tableState?.selected.get(id));
  const styles = useS(style);

  const select = useCallback(() => {
    tableState?.selected.set(id, !selected);
  }, [tableState, id, selected]);

  return (
    <div className={s(styles, { container: true })}>
      <Checkbox className={s(styles, { checkbox: true })} checked={selected} onClick={select} />
    </div>
  );
});
