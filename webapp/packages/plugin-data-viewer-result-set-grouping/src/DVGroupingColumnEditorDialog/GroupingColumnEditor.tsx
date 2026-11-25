/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useId, useState } from 'react';

import { Button, Container, Form, Group, GroupTitle, InputField, s, useS } from '@cloudbeaver/core-blocks';

import styles from './GroupingColumnEditor.module.css';
import { GroupingItem } from './GroupingItem.js';

interface Props {
  title: string;
  placeholder: string;
  items: string[];
  onAdd: (name: string) => void;
  onDelete: (name: string) => void;
}

export const GroupingColumnEditor = observer<Props>(function GroupingColumnEditor({ title, placeholder, items, onAdd, onDelete }) {
  const style = useS(styles);
  const titleId = useId();
  const [newItemName, setNewItemName] = useState('');

  function addItemHandler() {
    const value = newItemName.trim();

    if (value) {
      onAdd(value);
      setNewItemName('');
    }
  }

  return (
    <Group box medium overflow>
      <Container className={s(style, { header: true })}>
        <GroupTitle id={titleId}>{title}</GroupTitle>
        <Form className={s(style, { headerActions: true })} onSubmit={addItemHandler}>
          <InputField
            className={s(style, { inputField: true })}
            placeholder={placeholder}
            value={newItemName}
            onChange={v => setNewItemName(String(v))}
          />
          <Button onClick={addItemHandler}>+</Button>
        </Form>
      </Container>
      <Container className={s(style, { listContainer: true })} overflow>
        <ul role="list" aria-labelledby={titleId} className={s(style, { list: true })}>
          {items.map((name, index) => (
            <GroupingItem key={index} name={name} onDelete={onDelete} />
          ))}
        </ul>
      </Container>
    </Group>
  );
});
