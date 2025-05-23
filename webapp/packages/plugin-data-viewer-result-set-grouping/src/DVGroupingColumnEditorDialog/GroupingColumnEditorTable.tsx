/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button, Container, Form, Group, GroupTitle, InputField, s, Table, TableBody, useS } from '@cloudbeaver/core-blocks';

import styles from './GroupingColumnEditorTable.module.css';
import { GroupingTableItem } from './GroupingTableItem.js';

interface Props {
  title: string;
  placeholder: string;
  columns: string[];
  onAdd: (name: string) => void;
  onDelete: (name: string) => void;
}

export const GroupingColumnEditorTable = observer<Props>(function GroupingColumnEditorTable({ title, placeholder, columns, onAdd, onDelete }) {
  const style = useS(styles);
  const [newColumnName, setNewColumnName] = useState('');

  function addColumnHandler() {
    const value = newColumnName.trim();

    if (value) {
      onAdd(value);
      setNewColumnName('');
    }
  }

  return (
    <Group box medium overflow>
      <Container className={s(style, { header: true })}>
        <GroupTitle>{title}</GroupTitle>
        <Form className={s(style, { headerActions: true })} onSubmit={addColumnHandler}>
          <InputField
            className={s(style, { inputField: true })}
            placeholder={placeholder}
            value={newColumnName}
            onChange={v => setNewColumnName(String(v))}
          />
          <Button onClick={addColumnHandler}>+</Button>
        </Form>
      </Container>
      <Container className={s(style, { tableContainer: true })} overflow>
        <Table keys={columns}>
          <TableBody>
            {columns.map((name, idx) => (
              <GroupingTableItem key={idx} id={name} name={name} onDelete={onDelete} />
            ))}
          </TableBody>
        </Table>
      </Container>
    </Group>
  );
});
