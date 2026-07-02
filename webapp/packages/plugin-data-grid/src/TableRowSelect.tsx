/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { use } from 'react';

import { Checkbox, useTranslate } from '@cloudbeaver/core-blocks';

import { TableSelectionContext } from './TableSelectionContext.js';

interface BaseProps {
  disabled?: boolean;
}

export interface ITableRowRootSelectProps extends BaseProps {
  isRoot: true;
  id?: never;
}

export interface ITableRowSelectProps extends BaseProps {
  id: string;
  isRoot?: never;
}

const CELL_CLASS_NAME = 'tw:flex tw:w-full tw:h-full tw:items-center tw:justify-center';

export const TableRowSelect = observer<ITableRowRootSelectProps | ITableRowSelectProps>(function TableRowSelect({ isRoot, id, disabled }) {
  const selection = use(TableSelectionContext);
  const translate = useTranslate();

  if (!selection) {
    throw new Error('TableRowSelect must be used within a TableSelectionContext provider');
  }

  if (isRoot) {
    const indeterminate = selection.selected.length > 0 && selection.keys.length !== selection.selected.length;
    const checked = selection.keys.length > 0 && selection.keys.length === selection.selected.length;
    const rootDisabled = disabled || selection.keys.length === 0;

    return (
      <Checkbox
        className={CELL_CLASS_NAME}
        aria-label={translate('ui_select_all')}
        tabIndex={0}
        checked={checked}
        indeterminate={indeterminate}
        disabled={rootDisabled}
        onChange={selection.selectRoot}
      />
    );
  }

  const checked = selection.selected.includes(id);

  return (
    <Checkbox
      className={CELL_CLASS_NAME}
      aria-label={translate('plugin_data_grid_table_row_select')}
      tabIndex={0}
      checked={checked}
      disabled={disabled}
      onChange={() => selection.select(id)}
    />
  );
});
