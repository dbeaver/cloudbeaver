/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import { DataGridContext } from '../DataGridContext.js';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext.js';
import { TableDataContext } from '../TableDataContext.js';
import style from './TableIndexColumnHeader.module.css';
import { TableStatusIndicator } from './TableStatusIndicator.js';

export const TableIndexColumnHeader = observer(function TableIndexColumnHeader() {
  const dataGridContext = useContext(DataGridContext);
  const selectionContext = useContext(DataGridSelectionContext);
  const tableDataContext = useContext(TableDataContext);
  const translate = useTranslate();
  const styles = useS(style);

  if (!tableDataContext || !selectionContext || !dataGridContext) {
    throw new Error('Contexts required');
  }

  function handleClick() {
    selectionContext.selectTable();
    dataGridContext.focus();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  }

  return (
    <>
      <TableStatusIndicator />
      <div
        role="button"
        tabIndex={0}
        title={translate('data_grid_table_index_column_tooltip')}
        className={s(styles, { clickAreaOverlay: true })}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      />
    </>
  );
});
