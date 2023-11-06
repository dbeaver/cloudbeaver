/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled from 'reshadow';

import { getComputed, ToolsAction } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTask, AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { tableFooterMenuStyles } from './TableFooterMenu/TableFooterMenuItem';
import classes from './TableFooterRowCount.m.css';

interface Props {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
}

export const TableFooterRowCount: React.FC<Props> = observer(function TableFooterRowCount({ resultIndex, model }) {
  const graphQLService = useService(GraphQLService);
  const asyncTaskInfoService = useService(AsyncTaskInfoService);
  const notificationService = useService(NotificationService);

  const [task, setTask] = useState<AsyncTask | null>(null);

  const result = model.getResult(resultIndex);
  const context = model.source.executionContext?.context;

  if (!result) {
    return null;
  }

  async function getTotalRowsCount() {
    if (!context || !result?.id) {
      return;
    }

    try {
      const task = asyncTaskInfoService.create(async () => {
        const { taskInfo } = await graphQLService.sdk.asyncSqlRowDataCount({
          resultsId: result.id!,
          connectionId: context.connectionId,
          contextId: context.id,
          projectId: context.projectId,
        });

        return taskInfo;
      });

      setTask(task);

      const info = await asyncTaskInfoService.run(task);

      if (task.cancelled) {
        setTask(null);
        return;
      }

      const { count } = await graphQLService.sdk.getSqlRowDataCountResult({ taskId: info.id });

      if (count !== undefined) {
        model.source.setTotalRowsCount(count);
      }
    } catch (exception: any) {
      notificationService.logException(exception, 'data_viewer_total_rows_count_failed');
    } finally {
      setTask(null);
    }
  }

  let currentCount = result.data?.rows?.length ?? 'n/a';

  if (!result.loadedFully) {
    currentCount = currentCount + '+';
  }

  const count = model.source.totalRowsCount ?? currentCount;
  const processing = task?.info?.running;
  const disabled = getComputed(() => model.isLoading() || model.isDisabled(resultIndex) || processing);

  return styled(tableFooterMenuStyles)(
    <div className={classes.wrapper}>
      <ToolsAction disabled={disabled} icon="/icons/data_row_count.svg" viewBox="0 0 32 32" loading={processing} onClick={getTotalRowsCount}>
        <span>{count}</span>
      </ToolsAction>
    </div>,
  );
});
