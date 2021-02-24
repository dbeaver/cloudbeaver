/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useContext } from 'react';
import type { HeaderRendererProps } from 'react-data-grid';
import styled, { css, use } from 'reshadow';

import { StaticImage, Icon } from '@cloudbeaver/core-blocks';
import type { SqlResultSet } from '@cloudbeaver/core-sdk';
import type { SortMode } from '@cloudbeaver/plugin-data-viewer';

import { DataGridContext } from '../DataGridContext';
import { DataGridSelectionContext } from '../DataGridSelection/DataGridSelectionContext';
import { DataGridSortingContext } from '../DataGridSorting/DataGridSortingContext';

const headerStyles = css`
  table-header {
    display: flex;
    align-items: center;
    align-content: center;
    width: 100%;
    cursor: pointer;
  }
  shrink-container {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    overflow: hidden;
  }
  icon {
    display: flex;
  }
  StaticImage {
    height: 16px;
  }
  name {
    margin-left: 8px;
    font-weight: 400;
    flex-grow: 1;
  }
  
  sort-icon {
    margin-left: 4px;
    display: flex;
    padding: 2px 4px;
    flex-direction: column;
    align-content: center;
    align-items: center;
    min-width: 20px;
    box-sizing: border-box;
    cursor: pointer;
  }

  sort-icon > Icon {
    width: 8px;
    fill: #cbcbcb;
  }
  sort-icon > Icon:last-child {
    transform: scaleY(-1);
  }
  sort-icon > Icon[|active] {
    fill: #338ECC;
  }
  sort-icon:hover > Icon {
    width: 9px;
  }
  sort-icon[|disabled] {
    opacity: 0.7;
    cursor: default;
  }
`;

function getColumn(colIdx: number, source: SqlResultSet) {
  return source.columns?.[colIdx];
}

export const TableColumnHeader: React.FC<HeaderRendererProps<any>> = observer(function TableColumnHeader({
  column: calculatedColumn,
}) {
  const dataGridContext = useContext(DataGridContext);
  const gridSortingContext = useContext(DataGridSortingContext);
  const gridSelectionContext = useContext(DataGridSelectionContext);

  if (!dataGridContext || !gridSortingContext || !gridSelectionContext) {
    throw new Error('One of the following contexts are missed(data grid context, grid sorting context, grid selection context)');
  }

  const model = dataGridContext.model;
  const columnName = calculatedColumn.name as string;
  const column = getColumn(Number(calculatedColumn.key), model.getResult(dataGridContext.resultIndex)?.data);

  const loading = model.isLoading();

  // TODO we want to get "sortable" property from SqlResultColumn data
  const sortable = model.source.results.length === 1;
  const currentSortMode = gridSortingContext.getSortMode(columnName);

  const handleSort = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (loading) {
      return;
    }

    let nextSort: SortMode;
    switch (currentSortMode) {
      case 'asc':
        nextSort = 'desc';
        break;
      case 'desc':
        nextSort = null;
        break;
      default:
        nextSort = 'asc';
    }
    gridSortingContext.setSortMode(columnName, nextSort, e.ctrlKey || e.metaKey);
  };

  const handleColumnSelection = (e: React.MouseEvent<HTMLDivElement>) => {
    gridSelectionContext.selectColumn(calculatedColumn.key, e.ctrlKey || e.metaKey);
  };

  return styled(headerStyles)(
    <table-header as="div" onClick={handleColumnSelection}>
      <shrink-container as='div'>
        <icon as="div">
          <StaticImage icon={column?.icon} />
        </icon>
        <name as="div">{columnName}</name>
      </shrink-container>
      {sortable && (
        <sort-icon as="div" onClick={handleSort} {...use({ disabled: loading })}>
          <Icon name="sort-arrow" viewBox="0 0 6 6" {...use({ active: currentSortMode === 'asc' })} />
          <Icon name="sort-arrow" viewBox="0 0 6 6" {...use({ active: currentSortMode === 'desc' })} />
        </sort-icon>
      )}
    </table-header>
  );
});
