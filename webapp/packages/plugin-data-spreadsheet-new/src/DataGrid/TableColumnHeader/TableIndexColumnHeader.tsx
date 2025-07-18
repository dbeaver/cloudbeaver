/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { getComputed, IconOrImage, s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import { DataGridContext } from '../DataGridContext.js';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext.js';
import { TableDataContext } from '../TableDataContext.js';
import style from './TableIndexColumnHeader.module.css';

export const TableIndexColumnHeader = observer(function TableIndexColumnHeader() {
  const dataGridContext = useContext(DataGridContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const tableDataContext = useContext(TableDataContext);
  const translate = useTranslate();
  const styles = useS(style);

  if (!tableDataContext || !selectionContext || !dataGridContext) {
    throw new Error('Contexts required');
  }

  const readonly = getComputed(
    () => dataGridContext.model.isReadonly(dataGridContext.resultIndex) || !dataGridContext.model.hasElementIdentifier(dataGridContext.resultIndex),
  );

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    selectionContext.selectTable();
    dataGridContext.focus();
  }

  return (
    <>
      {readonly && (
        <IconOrImage title={translate('data_grid_table_readonly_tooltip')} icon="/icons/lock.png" className={s(styles, { iconOrImage: true })} />
      )}
      <div
        role="button"
        title={translate('data_grid_table_index_column_tooltip')}
        className={s(styles, { clickAreaOverlay: true })}
        onClick={handleClick}
      />
    </>
  );
});
