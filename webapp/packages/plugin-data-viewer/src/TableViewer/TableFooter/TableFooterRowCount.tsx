/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled from 'reshadow';

import { getComputed, ToolsAction, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { tableFooterMenuStyles } from './TableFooterMenu/TableFooterMenuItem';
import classes from './TableFooterRowCount.m.css';

interface Props {
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
}

export const TableFooterRowCount: React.FC<Props> = observer(function TableFooterRowCount({ resultIndex, model }) {
  const notificationService = useService(NotificationService);
  const [loading, setLoading] = useState(false);

  async function loadTotalCount() {
    try {
      setLoading(true);
      await model.source.loadTotalCount(resultIndex);
    } catch (exception: any) {
      notificationService.logException(exception, 'data_viewer_total_count_failed');
    } finally {
      setLoading(false);
    }
  }

  function cancelTotalCount() {
    try {
      setLoading(false);
      model.source.cancelLoadTotalCount();
    } catch (e: any) {
      const cancelled = model.source.cancelLoadTotalCountTask?.cancelled;

      if (!cancelled) {
        notificationService.logException(e, 'data_viewer_total_count_cancel_failed_title', typeof e === 'string' ? e : undefined);
      }
    }
  }

  if (loading) {
    return <CancelTotalCountAction onClick={cancelTotalCount} />;
  }

  return <TotalCountAction loading={loading} resultIndex={resultIndex} model={model} onClick={loadTotalCount} />;
});

const CancelTotalCountAction = observer(function CancelTotalCountAction({ onClick }: { onClick: VoidFunction }) {
  const translate = useTranslate();

  return styled(tableFooterMenuStyles)(
    <div className={classes.wrapper} title={translate('ui_processing_cancel')}>
      <ToolsAction icon="/icons/data_cancel.svg" viewBox="0 0 32 32" onClick={onClick}>
        {translate('ui_processing_cancel')}
      </ToolsAction>
    </div>,
  );
});

const TotalCountAction = observer(function TotalCountAction({
  onClick,
  loading,
  resultIndex,
  model,
}: {
  onClick: VoidFunction;
  loading: boolean;
  resultIndex: number;
  model: IDatabaseDataModel<any, IDatabaseResultSet>;
}) {
  const result = model.getResult(resultIndex);
  const translate = useTranslate();
  const disabled = getComputed(() => model.isLoading() || model.isDisabled(resultIndex));

  if (!result) {
    return null;
  }

  const currentCount = result.loadedFully ? result.count : `${result.count}+`;
  const count = result.totalCount ?? currentCount;

  return styled(tableFooterMenuStyles)(
    <div className={classes.wrapper} title={translate('data_viewer_total_count_tooltip')}>
      <ToolsAction disabled={disabled} loading={loading} icon="/icons/data_row_count.svg" viewBox="0 0 32 32" onClick={onClick}>
        <span>{count}</span>
      </ToolsAction>
    </div>,
  );
});
