/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button, Group, InputField, s, Table, TableBody, useS, useTranslate } from '@cloudbeaver/core-blocks';

import styles from './GroupingColumnEditorTable.m.css';
import { GroupingTableItem } from './GroupingTableItem';

interface Props {
  title: string;
  columns: string[];
  onAdd: (name: string) => void;
  onDelete: (name: string) => void;
  onColumnChange: (name: string, index: number) => void;
}

export const GroupingColumnEditorTable = observer<Props>(function GroupingColumnEditorTable({ title, columns, onAdd, onDelete, onColumnChange }) {
  const translate = useTranslate();
  const style = useS(styles);
  const [newColumnName, setNewColumnName] = useState('');

  return (
    <Group className={styles.group} box medium overflow>
      <container className={s(style, { container: true })}>
        <header className={s(style, { header: true })}>
          <h4 className={s(style, { headerTitle: true })}>{title}</h4>
          <div className={s(style, { submittingForm: true })}>
            <div className={s(style, { headerActions: true })}>
              <InputField
                className={s(style, { inputField: true })}
                placeholder={translate('')}
                value={newColumnName}
                onChange={v => setNewColumnName(String(v))}
              />
              <Button className={style.button} mod={['unelevated']} onClick={() => onAdd(newColumnName)}>
                +
              </Button>
            </div>
          </div>
        </header>
        <div className={s(style, { tableContainer: true })}>
          <Table className={s(style, { table: false })} keys={columns} selectedItems={new Map()}>
            <TableBody>
              {columns.map((name, idx) => (
                <GroupingTableItem
                  key={idx}
                  id={name}
                  name={name}
                  onDelete={onDelete}
                  onChange={name => onColumnChange(name, idx)}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </container>
    </Group>
  );
});
