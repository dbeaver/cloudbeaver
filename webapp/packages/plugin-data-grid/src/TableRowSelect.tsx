/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { use } from 'react';

import { Checkbox } from '@cloudbeaver/core-blocks';

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

export const TableRowSelect = observer<ITableRowRootSelectProps | ITableRowSelectProps>(function TableRowSelect({ isRoot, id, disabled }) {
  const selection = use(TableSelectionContext);

  if (!selection) {
    throw new Error('TableRowSelect must be used within a TableSelectionContext provider');
  }

  if (isRoot) {
    const indeterminate = selection.selected.length > 0 && selection.keys.length !== selection.selected.length;
    const checked = selection.keys.length > 0 && selection.keys.length === selection.selected.length;

    return (
      <Checkbox disabled={disabled || selection.keys.length === 0} checked={checked} indeterminate={indeterminate} onChange={selection.selectRoot} />
    );
  }

  return <Checkbox disabled={disabled} checked={selection.selected.includes(id)} onChange={() => selection.select(id)} />;
});
