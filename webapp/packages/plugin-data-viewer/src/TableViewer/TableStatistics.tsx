/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';
import classes from './TableStatistics.m.css';

interface Props {
  model: IDatabaseDataModel;
  resultIndex: number;
}

export const TableStatistics = observer<Props>(function TableStatistics({ model, resultIndex }) {
  const styles = useS(classes);
  const translate = useTranslate();
  const source = model.source;
  const result = model.getResult(resultIndex);

  return (
    <div className={s(styles, { statistics: true })}>
      {translate('data_viewer_statistics_status')} {source.requestInfo.requestMessage}
      <br />
      {translate('data_viewer_statistics_duration')} {source.requestInfo.requestDuration} ms
      <br />
      {translate('data_viewer_statistics_updated_rows')} {result?.updateRowCount || 0}
      <br />
      <br />
      <pre>{source.requestInfo.source}</pre>
    </div>
  );
});
