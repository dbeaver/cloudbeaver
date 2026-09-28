/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ActionIconButton, Container, s, TableColumnValue, TableItem, useS, useTranslate } from '@cloudbeaver/core-blocks';

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
  const translate = useTranslate();

  return (
    <TableItem item={id} title={tooltip} disabled={disabled} selectDisabled={disabled} className={className}>
      <TableColumnValue className={s(styles, { tableColumnValue: true })}>{name}</TableColumnValue>
      <TableColumnValue className={s(styles, { tableColumnValue: true })} flex centerContent>
        <Container zeroBasis />
        <ActionIconButton name="cross-bold" title={`${translate('ui_remove')}: ${name}`} disabled={disabled} onClick={() => onDelete(id)} />
      </TableColumnValue>
    </TableItem>
  );
});
