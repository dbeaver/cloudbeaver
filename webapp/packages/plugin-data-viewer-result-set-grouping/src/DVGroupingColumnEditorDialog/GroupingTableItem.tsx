/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { IconButton, s, TableColumnValue, TableItem, useS } from '@cloudbeaver/core-blocks';

import styles from './GroupingTableItem.m.css';

interface Props {
  id: string;
  name: string;
  disabled?: boolean;
  className?: string;
  onDelete: (id: string) => void;
}

export const GroupingTableItem = observer<Props>(function GroupingTableItem({ id, name, disabled, className, onDelete }) {
  const style = useS(styles);

  return (
    <TableItem className={className} item={id} title={name} disabled={disabled} selectDisabled={disabled}>
      <TableColumnValue className={s(style, { tableColumnValue: true })}>{name}</TableColumnValue>
      <TableColumnValue>
        <IconButton name="cross-bold" onClick={() => onDelete(id)} />
      </TableColumnValue>
    </TableItem>
  );
});
