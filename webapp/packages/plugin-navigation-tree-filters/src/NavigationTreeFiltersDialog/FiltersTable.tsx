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

import { Button, Group, InputField, SubmittingForm, Table, TableBody, useStyles, useTranslate } from '@cloudbeaver/core-blocks';

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
    flex-direction: column;
    padding-bottom: 16px;
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
  SubmittingForm {
    width: 100%;
  }
  h4 {
    margin: 0;
  }
`;

interface Props {
  title: string;
  filters: string[];
  onAdd: (filter: string) => void;
  onDelete: (filter: string) => void;
}

export const FiltersTable = observer<Props>(function FiltersTable({ title, filters, onAdd, onDelete }) {
  const translate = useTranslate();
  const style = useStyles(TABLE_STYLES);
  const [filter, setFilter] = useState('');

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
          <h4>{title}</h4>
          <SubmittingForm onSubmit={add}>
            <header-actions>
              <InputField placeholder={translate('plugin_navigation_tree_filters_info')} value={filter} onChange={v => setFilter(String(v))} />
              <Button mod={['unelevated']} onClick={add}>
                +
              </Button>
            </header-actions>
          </SubmittingForm>
        </header>
        <table-container>
          <Table keys={filters}>
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
