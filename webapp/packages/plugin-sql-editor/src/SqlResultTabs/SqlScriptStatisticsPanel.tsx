/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Loader, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';

import type { IStatisticsTab } from '../ISqlEditorTabState';
import { SqlQueryService } from './SqlQueryService';

interface IProps {
  tab: IStatisticsTab;
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
  box {
    display: flex;
    align-items: center;
  }
  icon {
    width: 16px;
    height: 16px;
    margin-right: 8px;
  }
`;

export const SqlScriptStatisticsPanel: React.FC<IProps> = observer(function SqlScriptStatisticsPanel({
  tab,
}) {
  const sqlQueryService = useService(SqlQueryService);
  const statistics = sqlQueryService.getStatistics(tab.tabId);
  const translate = useTranslate();

  if (!statistics) {
    return <TextPlaceholder>{translate('sql_editor_sql_statistics_unavailable')}</TextPlaceholder>;
  }

  return styled(styles)(
    <statistics as='div'>
      {translate('sql_editor_sql_execution_queries')} {statistics.executedQueries} / {statistics.queries}<br />
      {translate('data_viewer_statistics_duration')} {statistics.executeTime} ms<br />
      {translate('data_viewer_statistics_updated_rows')} {statistics.updatedRows}<br />
      {statistics.currentQuery && (
        <>
          <h3><box><icon><Loader small fullSize /></icon>{translate('sql_editor_sql_execution_executing')}</box></h3>
          <pre>{statistics.currentQuery}</pre>
        </>
      )}
    </statistics>
  );
});
