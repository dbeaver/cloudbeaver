/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { useTranslate } from '@cloudbeaver/core-localization';

import type { IDatabaseDataModel } from '../DatabaseDataModel/IDatabaseDataModel';

interface Props {
  model: IDatabaseDataModel<any>;
  resultIndex: number;
}

const styles = css`
  statistics {
    composes: theme-typography--caption from global;
    flex: 1;
    overflow: auto;
    box-sizing: border-box;
    white-space: pre-wrap;
    padding: 16px;
  }
`;

export const TableStatistics = observer<Props>(function TableStatistics({
  model,
  resultIndex,
}) {
  const translate = useTranslate();
  const source = model.source;
  const result = model.getResult(resultIndex);

  return styled(styles)(
    <statistics as='div'>
      {translate('data_viewer_statistics_status')} {source.requestInfo.requestMessage}<br />
      {translate('data_viewer_statistics_duration')} {source.requestInfo.requestDuration} ms<br />
      {translate('data_viewer_statistics_updated_rows')} {result?.updateRowCount || 0}<br />
      <br />
      <pre>{source.requestInfo.source}</pre>
    </statistics>
  );
});
