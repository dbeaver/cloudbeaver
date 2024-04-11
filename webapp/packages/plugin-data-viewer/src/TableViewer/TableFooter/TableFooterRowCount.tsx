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
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const [loading, setLoading] = useState(false);

  const result = model.getResult(resultIndex);

  if (!result) {
    return null;
  }

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

  async function cancelTotalCount() {
    try {
      setLoading(false);
      await model.source.cancelLoadTotalCount(resultIndex);
    } catch (e: any) {
      notificationService.logError({ title: 'data_viewer_total_count_cancel_failed', message: String(e) });
    }
  }

  const currentCount = result.loadedFully ? result.count : `${result.count}+`;
  const count = result.totalCount ?? currentCount;
  const disabled = getComputed(() => model.isLoading() || model.isDisabled(resultIndex));

  if (loading) {
    return styled(tableFooterMenuStyles)(
      <div className={classes.wrapper} title={translate('ui_processing_cancel')}>
        <ToolsAction icon="/icons/data_cancel.svg" viewBox="0 0 32 32" disableLoading disableDisabled onClick={cancelTotalCount}>
          {translate('ui_processing_cancel')}
        </ToolsAction>
      </div>,
    );
  }

  return styled(tableFooterMenuStyles)(
    <div className={classes.wrapper} title={translate('data_viewer_total_count_tooltip')}>
      <ToolsAction disabled={disabled} loading={loading} icon="/icons/data_row_count.svg" viewBox="0 0 32 32" onClick={loadTotalCount}>
        <span>{count}</span>
      </ToolsAction>
    </div>,
  );
});
