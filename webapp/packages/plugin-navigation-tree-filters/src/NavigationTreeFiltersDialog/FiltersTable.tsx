/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Button, Form, Group, InputField, s, Table, TableBody, useS, useTranslate } from '@cloudbeaver/core-blocks';

import styles from './FiltersTable.module.css';
import { FiltersTableItem } from './FiltersTableItem.js';

interface Props {
  title: string;
  filters: string[];
  onAdd: (filter: string) => void;
  onDelete: (filter: string) => void;
}

export const FiltersTable = observer<Props>(function FiltersTable({ title, filters, onAdd, onDelete }) {
  const translate = useTranslate();
  const style = useS(styles);
  const [filter, setFilter] = useState('');

  function add() {
    const value = filter.trim();

    if (value) {
      onAdd(value);
      setFilter('');
    }
  }

  return (
    <Group className={styles['group']} box medium overflow>
      <div className={s(style, { container: true })}>
        <header className={s(style, { header: true })}>
          <h4 className={s(style, { headerTitle: true })}>{title}</h4>
          <Form className={s(style, { submittingForm: true })} onSubmit={add}>
            <div className={s(style, { headerActions: true })}>
              <InputField
                className={s(style, { inputField: true })}
                placeholder={translate('plugin_navigation_tree_filters_info')}
                value={filter}
                onChange={v => setFilter(String(v))}
              />
              <Button className={style['button']} onClick={add}>
                +
              </Button>
            </div>
          </Form>
        </header>
        <div className={s(style, { tableContainer: true })}>
          <Table className={s(style, { table: true })} keys={filters}>
            <TableBody>
              {filters.map(filter => (
                <FiltersTableItem key={filter} id={filter} name={filter} onDelete={onDelete} />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Group>
  );
});
