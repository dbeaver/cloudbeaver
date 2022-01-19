/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { Loader, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { IStatisticsTab } from '../ISqlEditorTabState';
import type { QueryDataSource } from '../QueryDataSource';
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
  pre {
    white-space: pre-wrap;
  }
`;

export const SqlScriptStatisticsPanel = observer<IProps>(function SqlScriptStatisticsPanel({
  tab,
}) {
  const sqlQueryService = useService(SqlQueryService);
  const tableViewerStorageService = useService(TableViewerStorageService);
  const statistics = sqlQueryService.getStatistics(tab.tabId);
  const translate = useTranslate();

  if (!statistics) {
    return <TextPlaceholder>{translate('sql_editor_sql_statistics_unavailable')}</TextPlaceholder>;
  }

  const source: QueryDataSource | undefined = statistics.modelId
    ? tableViewerStorageService.get(statistics.modelId)?.source as QueryDataSource
    : undefined;

  return styled(styles)(
    <statistics>
      {translate('sql_editor_sql_execution_executed_queries')} {statistics.executedQueries} / {statistics.queries}<br />
      {translate('data_viewer_statistics_duration')} {statistics.executeTime} ms<br />
      {translate('data_viewer_statistics_updated_rows')} {statistics.updatedRows}<br />
      {source && (
        <>
          <Loader
            message='sql_editor_sql_execution_executing'
            cancelDisabled={!source.canCancel}
            inline
            onCancel={() => source.cancel()}
          />
          <pre>{source.options?.query}</pre>
        </>
      )}
    </statistics>
  );
});
