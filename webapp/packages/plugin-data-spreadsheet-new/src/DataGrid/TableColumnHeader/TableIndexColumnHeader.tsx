/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, IconOrImage, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import type { RenderHeaderCellProps } from '@cloudbeaver/plugin-react-data-grid';

import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { TableDataContext } from '../TableDataContext';
import style from './TableIndexColumnHeader.m.css';

export const TableIndexColumnHeader = observer<RenderHeaderCellProps<any>>(function TableIndexColumnHeader(props) {
  const dataGridContext = useContext(DataGridContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const tableDataContext = useContext(TableDataContext);
  const translate = useTranslate();
  const styles = useS(style);

  if (!tableDataContext || !selectionContext || !dataGridContext) {
    throw new Error('Contexts required');
  }

  const readonly = getComputed(() => tableDataContext.isReadOnly() || dataGridContext.model.isReadonly(dataGridContext.resultIndex));

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    selectionContext.selectTable();
    dataGridContext.focus();
  }

  return (
    <div title={translate('data_grid_table_index_column_tooltip')} className={s(styles, { container: true })} onClick={handleClick}>
      {readonly && (
        <IconOrImage title={translate('data_grid_table_readonly_tooltip')} icon="/icons/lock.png" className={s(styles, { iconOrImage: true })} />
      )}
      {props.column.name}
    </div>
  );
});
