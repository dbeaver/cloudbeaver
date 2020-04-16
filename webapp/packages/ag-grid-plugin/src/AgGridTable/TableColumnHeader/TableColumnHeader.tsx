/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { AgEvent, GridApi, Column } from '@ag-grid-community/core';
import { StaticImage } from '@dbeaver/core/blocks';

type HeaderProps = {
  api: GridApi;
  reactContainer: HTMLElement;
  column: Column;
  enableMenu: boolean;
  enableSorting: boolean;
  menuIcon: string;
  displayName: string;
  showColumnMenu: (button?: HTMLDivElement) => void;
  setSort: (order: string, shiftKey: boolean) => void;
  icon?: string;
}

const headerStyles = css`
  table-header {
    display: flex;
    align-items: center;
    align-content: center;
    width: 100%;
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
  }
`;

export interface IAgColumnClickEvent extends AgEvent{
  columnIndex: number;
  isMultiple: boolean;
}

export const COLUMN_CLICK_EVENT_TYPE = 'column-click';

export function TableColumnHeader(props: HeaderProps) {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const event: IAgColumnClickEvent = Object.freeze({
      type: COLUMN_CLICK_EVENT_TYPE,
      columnIndex: parseInt(props.column.getColId()),
      isMultiple: e.ctrlKey,
    });

    props.api.dispatchEvent(event);
  }, []);

  return styled(headerStyles)(
    <table-header as="div" onClick={handleClick}>
      <icon as="div">
        <StaticImage icon={props.icon} />
      </icon>
      <name as="div">{props.displayName}</name>
    </table-header>
  );
}
