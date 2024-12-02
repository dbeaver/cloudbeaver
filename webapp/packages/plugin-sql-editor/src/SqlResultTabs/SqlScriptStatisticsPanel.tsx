/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Loader, s, TextPlaceholder, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type IDatabaseDataModel, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { IStatisticsTab } from '../ISqlEditorTabState.js';
import type { QueryDataSource } from '../QueryDataSource.js';
import { SqlQueryService } from './SqlQueryService.js';
import classes from './SqlScriptStatisticsPanel.module.css';

interface IProps {
  tab: IStatisticsTab;
}

export const SqlScriptStatisticsPanel = observer<IProps>(function SqlScriptStatisticsPanel({ tab }) {
  const sqlQueryService = useService(SqlQueryService);
  const tableViewerStorageService = useService(TableViewerStorageService);
  const statistics = sqlQueryService.getStatistics(tab.tabId);
  const translate = useTranslate();
  const styles = useS(classes);

  if (!statistics) {
    return <TextPlaceholder>{translate('sql_editor_sql_statistics_unavailable')}</TextPlaceholder>;
  }

  const source = statistics.modelId ? tableViewerStorageService.get<IDatabaseDataModel<QueryDataSource>>(statistics.modelId)?.source : undefined;

  return (
    <div className={s(styles, { statistics: true })}>
      {translate('sql_editor_sql_execution_executed_queries')} {statistics.executedQueries} / {statistics.queries}
      <br />
      {translate('data_viewer_statistics_duration')} {statistics.executeTime} {translate('ui_ms')}
      <br />
      {translate('data_viewer_statistics_updated_rows')} {statistics.updatedRows}
      <br />
      {source && (
        <>
          <Loader message="sql_editor_sql_execution_executing" cancelDisabled={!source.canCancel} inline onCancel={() => source.cancel()} />
          <pre className={s(styles, { query: true })}>{source.options?.query}</pre>
        </>
      )}
    </div>
  );
});
