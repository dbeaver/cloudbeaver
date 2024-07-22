/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ActionIconButton, Container, s, TableColumnValue, TableItem, useS } from '@cloudbeaver/core-blocks';

import classes from './DataImportFileItem.module.css';

interface Props {
  id: string;
  name: string;
  disabled?: boolean;
  tooltip?: string;
  className?: string;
  onDelete: (id: string) => void;
}

export const DataImportFileItem = observer<Props>(function DataImportFileItem({ id, name, tooltip, disabled, className, onDelete }) {
  const styles = useS(classes);

  return (
    <TableItem item={id} title={tooltip} disabled={disabled} selectDisabled={disabled} className={className}>
      <TableColumnValue className={s(styles, { tableColumnValue: true })}>{name}</TableColumnValue>
      <TableColumnValue className={s(styles, { tableColumnValue: true })} flex centerContent>
        <Container zeroBasis />
        <ActionIconButton name="cross-bold" onClick={() => onDelete(id)} />
      </TableColumnValue>
    </TableItem>
  );
});
