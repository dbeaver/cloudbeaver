/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useContext } from 'react';

import { Checkbox, getComputed, s, useS } from '@cloudbeaver/core-blocks';
import type { DBObject } from '@cloudbeaver/core-navigation-tree';
import type { RenderCellProps } from '@cloudbeaver/plugin-data-grid';

import { TableContext } from '../../TableContext.js';
import style from './SelectorFormatter.module.css';

export const SelectorFormatter = observer<RenderCellProps<DBObject>>(function SelectorFormatter(props) {
  const context = useContext(TableContext);
  const id = props.row.id;
  const selected = getComputed(() => context.tableState?.selected.get(id));
  const styles = useS(style);

  const select = useCallback(() => {
    context.tableState?.selected.set(id, !selected);
  }, [id, selected]);

  return (
    <div className={s(styles, { container: true })}>
      <Checkbox className={s(styles, { checkbox: true })} checked={selected} onClick={select} />
    </div>
  );
});
