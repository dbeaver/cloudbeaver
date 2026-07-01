/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { use } from 'react';

import { Command } from '@dbeaver/ui-kit';
import { CheckboxIndicator } from '@cloudbeaver/core-blocks';

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

const CELL_CLASS_NAME = 'tw:flex tw:w-full tw:h-full tw:items-center tw:justify-center tw:outline-0!';

export const TableRowSelect = observer<ITableRowRootSelectProps | ITableRowSelectProps>(function TableRowSelect({ isRoot, id, disabled }) {
  const selection = use(TableSelectionContext);

  if (!selection) {
    throw new Error('TableRowSelect must be used within a TableSelectionContext provider');
  }

  if (isRoot) {
    const indeterminate = selection.selected.length > 0 && selection.keys.length !== selection.selected.length;
    const checked = selection.keys.length > 0 && selection.keys.length === selection.selected.length;
    const rootDisabled = disabled || selection.keys.length === 0;

    return (
      <div className={CELL_CLASS_NAME} onClick={rootDisabled ? undefined : selection.selectRoot}>
        <CheckboxIndicator checked={checked} indeterminate={indeterminate} disabled={rootDisabled} />
      </div>
    );
  }

  const checked = selection.selected.includes(id);

  return (
    <Command className={CELL_CLASS_NAME} disabled={disabled} tabIndex={0} onClick={() => selection.select(id)}>
      <CheckboxIndicator checked={checked} disabled={disabled} />
    </Command>
  );
});
