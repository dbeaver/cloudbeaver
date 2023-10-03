/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ActionIconButtonStyles, IconButton, s, TableColumnValue, TableItem, useS } from '@cloudbeaver/core-blocks';

import styles from './FiltersTableItem.m.css';

interface Props {
  id: string;
  name: string;
  disabled?: boolean;
  className?: string;
  onDelete: (id: string) => void;
}

export const FiltersTableItem = observer<Props>(function FiltersTableItem({ id, name, disabled, className, onDelete }) {
  const style = useS(ActionIconButtonStyles, styles);

  return (
    <TableItem className={s(style, { tableItem: true }, className)} item={id} title={name} disabled={disabled} selectDisabled={disabled}>
      <TableColumnValue>{name}</TableColumnValue>
      <TableColumnValue className={s(style, { deleteColumnCell: true })} flex>
        <IconButton className={s(ActionIconButtonStyles, { actionIconButton: true })} name="cross-bold" onClick={() => onDelete(id)} />
      </TableColumnValue>
    </TableItem>
  );
});
