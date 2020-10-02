/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import { useCallback, useRef } from 'react';
import styled, { css, use } from 'reshadow';

import { IconButton, SubmittingForm } from '@cloudbeaver/core-blocks';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { DataModelWrapper } from '../DataModelWrapper';
import { TableFooterMenu } from './TableFooterMenu/TableFooterMenu';

const tableFooterStyles = composes(
  css`
    table-footer {
      composes: theme-background-secondary theme-text-on-secondary from global;
    }
    reload {
      composes: theme-text-primary theme-ripple from global;
    }
  `,
  css`
    table-footer {
      height: 40px;
      flex: 0 0 auto;
      display: flex;
      align-items: center;
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
    reload {
      height: 100%;
      display: flex;
      align-items: center;
    }
    IconButton {
      position: relative;
      height: 24px;
      width: 24px;
      display: block;
    }
    reload,
    count,
    TableFooterMenu {
      margin-left: 16px;
    }
    time {
      composes: theme-typography--caption from global;
      margin-left: auto;
      margin-right: 16px;
    }
  `
);

type TableFooterProps = {
  model: DataModelWrapper;
}

export const TableFooter = observer(function TableFooter({
  model,
}: TableFooterProps) {
  const ref = useRef<HTMLInputElement>(null);
  const handleChange = useCallback(
    () => {
      if (!ref.current) {
        return;
      }
      const value = parseInt(ref.current.value, 10);

      if (model.countGain !== value) {
        model.setCountGain(value);
      }
    },
    [model]
  );

  return styled(useStyles(tableFooterStyles))(
    <table-footer as="div">
      <reload as="div">
        <IconButton type="button" name='reload' onClick={() => model.refresh()} viewBox="0 0 16 16"/>
      </reload>
      <count as="div">
        <SubmittingForm onSubmit={handleChange}>
          <input type="number" value={model.countGain} ref={ref} onBlur={handleChange} {...use({ mod: 'surface' })} />
        </SubmittingForm>
      </count>
      <TableFooterMenu model={model}/>
      {model.deprecatedModel.requestStatusMessage.length > 0 && (
        <time>
          {model.deprecatedModel.requestStatusMessage} - {model.deprecatedModel.queryDuration}ms
        </time>
      )}
    </table-footer>
  );
});
