/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useEffect, useState } from 'react';
import styled, { css, use } from 'reshadow';

import { AgEvent, GridApi, Column, FirstDataRenderedEvent } from '@ag-grid-community/core';
import { StaticImage, Icon } from '@cloudbeaver/core-blocks';
import { SortMode } from '@cloudbeaver/plugin-data-viewer';

interface HeaderProps {
  api: GridApi;
  reactContainer: HTMLElement;
  column: Column;
  enableMenu: boolean;
  enableSorting: boolean;
  menuIcon: string;
  displayName: string;
  showColumnMenu: (button?: HTMLDivElement) => void;
  setSort: (order: SortMode, shiftKey: boolean) => void;
  icon?: string;
}

const headerStyles = css`
  table-header {
    display: flex;
    align-items: center;
    align-content: center;
    width: 100%;
  }
  shrink-container {
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    overflow: hidden;
  }
  icon {
    height: 16px;
  }
  StaticImage {
    height: 100%;
  }
  name {
    margin-left: 8px;
    text-transform: uppercase;
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
`;

export interface IAgColumnClickEvent extends AgEvent{
  columnId: string;
  isMultiple: boolean;
}

export interface IAgColumnHeaderMount extends AgEvent {
  columnId: string;
}

export const COLUMN_CLICK_EVENT_TYPE = 'column-click';
export const COLUMN_HEADER_MOUNT_EVENT_TYPE = 'column-header-mount';

export function TableColumnHeader(props: HeaderProps) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const event: IAgColumnClickEvent = Object.freeze({
      type: COLUMN_CLICK_EVENT_TYPE,
      columnId: props.column.getColId(),
      isMultiple: e.ctrlKey,
    });

    props.api.dispatchEvent(event);
  }, []);

  const handleColumnMount = useCallback(() => {
    const event: IAgColumnHeaderMount = Object.freeze({
      type: COLUMN_HEADER_MOUNT_EVENT_TYPE,
      columnId: props.column.getColId(),
    });

    props.api.dispatchEvent(event);
  }, []);

  const [sortMode, setSortMode] = useState<SortMode>(() => props.column.getSort() as SortMode);
  useEffect(() => {
    function onSortChanged() {
      setSortMode(props.column.getSort() as SortMode);
    }

    props.column.addEventListener('sortChanged', onSortChanged);
    return function cleanup() {
      props.column.removeEventListener('sortChanged', onSortChanged);
    };
  }, [props.column]);

  const handleSort = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const sort = props.column.getSort() as SortMode;
      let nextSort: SortMode;
      switch (sort) {
        case 'asc':
          nextSort = 'desc';
          break;
        case 'desc':
          nextSort = null;
          break;
        default:
          nextSort = 'asc';
      }
      props.setSort(nextSort, e.ctrlKey);
    },
    []
  );

  useEffect(() => {
    handleColumnMount();
  }, []);

  return styled(headerStyles)(
    <table-header as="div" onClick={handleClick}>
      <shrink-container as='div'>
        <icon as="div">
          <StaticImage icon={props.icon} />
        </icon>
        <name as="div">{props.displayName}</name>
      </shrink-container>
      {props.enableSorting && (
        <sort-icon as="div" onClick={handleSort}>
          <Icon name="sort-arrow" viewBox="0 0 6 6" {...use({ active: sortMode === 'asc' })} />
          <Icon name="sort-arrow" viewBox="0 0 6 6" {...use({ active: sortMode === 'desc' })} />
        </sort-icon>
      )}
    </table-header>
  );
}
