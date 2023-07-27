/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import {
  Button,
  Group,
  InputField,
  Table,
  TableBody,
  TableColumnHeader,
  TableHeader,
  useStyles,
  useTable,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import { FiltersTableItem } from './FiltersTableItem';

export const TABLE_STYLES = css`
  Table {
    composes: theme-background-surface theme-text-on-surface from global;
  }
  header {
    composes: theme-border-color-background theme-background-surface theme-text-on-surface from global;
    overflow: hidden;
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    gap: 16px;
    border-bottom: 1px solid;
    flex: 1 0 auto;
  }
  header-actions {
    width: 100%;
    display: flex;
    gap: 16px;
  }
  Group {
    position: relative;
  }
  Group,
  container,
  table-container {
    height: 100%;
  }
  container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  table-container {
    overflow: auto;
  }
  InputField {
    flex: 1;
  }
`;

interface Props {
  filters: string[];
  onAdd: (filter: string) => void;
  onDelete: (filter: string) => void;
}

export const FiltersTable = observer<Props>(function FiltersTable({ filters, onAdd, onDelete }) {
  const translate = useTranslate();
  const style = useStyles(TABLE_STYLES);
  const notificationService = useService(NotificationService);

  const [filter, setFilter] = useState('');

  const table = useTable();

  function add() {
    const value = filter.trim();

    if (value) {
      onAdd(value);
      setFilter('');
    }
  }

  return styled(style)(
    <Group box medium overflow>
      <container>
        <header>
          <header-actions>
            <InputField placeholder="Filter..." value={filter} onChange={v => setFilter(String(v))} />
            <Button mod={['unelevated']} onClick={add}>
              Add
            </Button>
          </header-actions>
        </header>
        <table-container>
          <Table keys={filters} selectedItems={table.selected}>
            <TableHeader fixed>
              <TableColumnHeader>{translate('administration_libraries_name_label')}</TableColumnHeader>
              <TableColumnHeader />
            </TableHeader>
            <TableBody>
              {filters.map(filter => (
                <FiltersTableItem key={filter} id={filter} name={filter} onDelete={onDelete} />
              ))}
            </TableBody>
          </Table>
        </table-container>
      </container>
    </Group>,
  );
});
