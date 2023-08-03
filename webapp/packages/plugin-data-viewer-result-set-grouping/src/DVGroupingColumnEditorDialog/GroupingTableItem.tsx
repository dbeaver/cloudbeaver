/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useRef, useState } from 'react';

import { IconButton, s, TableColumnValue, TableItem, useS } from '@cloudbeaver/core-blocks';

import styles from './GroupingTableItem.m.css';

interface Props {
  id: string;
  name: string;
  disabled?: boolean;
  className?: string;
  onDelete: (id: string) => void;
  onChange: (name: string) => void;
}

export const GroupingTableItem = observer<Props>(function GroupingTableItem({ id, name, disabled, className, onDelete, onChange }) {
  const style = useS(styles);

  const [isEdited, setIsEdited] = useState(false);
  const focusedRef = useRef<HTMLInputElement>(null);

  return (
    <TableItem className={s(style, { tableItem: true }, className)} item={id} title={name} disabled={disabled} selectDisabled={disabled}>
      {isEdited ? (
        <TableColumnValue className={s(style, { tableColumnValue: true, tableColumnInput: true })}>
          <input
            ref={focusedRef}
            className={s(style, { input: true })}
            value={name}
            onChange={e => onChange(e.target.value)}
            onBlur={() => setIsEdited(false)}
          />
        </TableColumnValue>
      ) : (
        <TableColumnValue
          className={s(style, { tableColumnValue: true })}
          onClick={() => {
            setIsEdited(true);
            requestAnimationFrame(() => {
              focusedRef.current?.focus();
            });
          }}
        >
          {name}
        </TableColumnValue>
      )}
      <TableColumnValue>
        <IconButton name="cross-bold" onClick={() => onDelete(id)} />
      </TableColumnValue>
    </TableItem>
  );
});
