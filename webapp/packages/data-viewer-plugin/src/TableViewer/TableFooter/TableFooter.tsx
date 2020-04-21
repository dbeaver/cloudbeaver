/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback } from 'react';
import styled, { css, use } from 'reshadow';

import { Icon } from '@dbeaver/core/blocks';
import { composes, useStyles } from '@dbeaver/core/theming';

const tableFooterStyles = composes(
  css`
    table-footer {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    button {
      composes: theme-text-primary from global;
    }
  `,
  css`
    table-footer {
      height: 40px;
      flex: 0 0 auto;
      display: flex;
      align-items: center;
    }
    button {
      outline: none;
      padding: 0 8px;
      display: flex;
      cursor: pointer;
      background: transparent;

      & Icon,
      & placeholder {
        height: 24px;
        width: 24px;
      }
    }
    count input,
    count placeholder {
      height: 26px;
      width: 80px;
      box-sizing: border-box;
      padding: 4px 7px;
      border: none;
      font-size: 13px;
      line-height: 24px;
    }
    time placeholder {
      height: 16px;
      width: 150px;
    }
    reload,
    count,
    time {
      margin-left: 16px;
    }
  `
);

type TableFooterProps = {
  chunkSize: number;
  requestStatusMessage: string;
  queryDuration: number;
  onRefresh: () => void;
  onDataChange: (value: number) => void;
}

export function TableFooter({
  chunkSize,
  requestStatusMessage,
  queryDuration,
  onRefresh,
  onDataChange,
}: TableFooterProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => onDataChange(parseInt(e.target.value, 10)),
    [onDataChange]
  );

  return styled(useStyles(tableFooterStyles))(
    <table-footer as="div">
      <reload as="div">
        <button type="button" onClick={onRefresh}>
          <Icon name="reload" />
        </button>
      </reload>
      <count as="div">
        <input type="number" value={chunkSize} onBlur={handleChange} {...use({ mod: 'surface' })} />
      </count>
      {requestStatusMessage.length > 0 && (
        <time>
          {requestStatusMessage} - {queryDuration}ms
        </time>
      )}
    </table-footer>
  );
}
