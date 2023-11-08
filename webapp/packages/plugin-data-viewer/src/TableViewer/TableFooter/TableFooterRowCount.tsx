/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { getComputed, ToolsAction } from '@cloudbeaver/core-blocks';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { tableFooterMenuStyles } from './TableFooterMenu/TableFooterMenuItem';
import classes from './TableFooterRowCount.m.css';

interface Props {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
}

export const TableFooterRowCount: React.FC<Props> = observer(function TableFooterRowCount({ resultIndex, model }) {
  const result = model.getResult(resultIndex);

  if (!result) {
    return null;
  }

  async function loadTotalCount() {
    await model.source.loadTotalCount(resultIndex);
  }

  const currentCount = result.loadedFully ? result.count : `${result.count}+`;
  const count = result.totalCount ?? currentCount;
  const disabled = getComputed(() => model.isLoading() || model.isDisabled(resultIndex));

  return styled(tableFooterMenuStyles)(
    <div className={classes.wrapper}>
      <ToolsAction disabled={disabled} icon="/icons/data_row_count.svg" viewBox="0 0 32 32" onClick={loadTotalCount}>
        <span>{count}</span>
      </ToolsAction>
    </div>,
  );
});
