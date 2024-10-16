/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import type { HTMLAttributes } from 'react';

import { s, useS, useTranslate } from '@cloudbeaver/core-blocks';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel.js';
import { type IDatabaseResultSet } from '../DatabaseDataModel/IDatabaseResultSet.js';
import { isResultSetDataSource, ResultSetDataSource } from '../ResultSet/ResultSetDataSource.js';
import classes from './TableStatistics.module.css';

interface Props extends HTMLAttributes<HTMLDivElement> {
  model: IDatabaseDataModel;
  resultIndex: number;
}

export const TableStatistics = observer<Props>(function TableStatistics({ model, resultIndex, ...rest }) {
  const styles = useS(classes);
  const translate = useTranslate();
  const source = model.source;
  let updatedRows: number | null = null;

  if (isResultSetDataSource(source)) {
    const result = (source as ResultSetDataSource).getResult(resultIndex) as IDatabaseResultSet | null;
    updatedRows = result?.updateRowCount ?? null;
  }

  return (
    <div {...rest} className={s(styles, { statistics: true })}>
      {translate('data_viewer_statistics_status')} {translate(source.requestInfo.requestMessage)}
      <br />
      {translate('data_viewer_statistics_duration')} {source.requestInfo.requestDuration} {translate('ui_ms')}
      <br />
      {updatedRows !== null && (
        <>
          {translate('data_viewer_statistics_updated_rows')} {updatedRows}
          <br />
        </>
      )}
      <br />
      <pre>{source.requestInfo.source}</pre>
    </div>
  );
});
