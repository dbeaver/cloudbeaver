/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

import type { IDatabaseDataModel } from '../../DatabaseDataModel/IDatabaseDataModel';
import type { IDatabaseResultSet } from '../../DatabaseDataModel/IDatabaseResultSet';
import { CancelTotalCountAction } from './CancelTotalCountAction';
import { TotalCountAction } from './TotalCountAction';

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

  async function cancelTotalCount() {
    try {
      setLoading(false);
      await model.source.cancelLoadTotalCount();
    } catch (e: any) {
      notificationService.logException(e);
    }
  }

  if (loading) {
    return <CancelTotalCountAction onClick={cancelTotalCount} />;
  }

  return <TotalCountAction loading={loading} resultIndex={resultIndex} model={model} onClick={loadTotalCount} />;
});
