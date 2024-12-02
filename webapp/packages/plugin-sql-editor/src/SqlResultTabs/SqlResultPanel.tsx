/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { importLazyComponent } from '@cloudbeaver/core-blocks';

import type { ISqlEditorTabState } from '../ISqlEditorTabState.js';
import classes from './SqlResultPanel.module.css';

const SqlExecutionPlanPanel = importLazyComponent(() =>
  import('./ExecutionPlan/SqlExecutionPlanPanel.js').then(module => module.SqlExecutionPlanPanel),
);
const OutputLogsPanel = importLazyComponent(() => import('./OutputLogs/OutputLogsPanel.js').then(module => module.OutputLogsPanel));
const SqlResultSetPanel = importLazyComponent(() => import('./SqlResultSetPanel.js').then(module => module.SqlResultSetPanel));
const SqlScriptStatisticsPanel = importLazyComponent(() => import('./SqlScriptStatisticsPanel.js').then(module => module.SqlScriptStatisticsPanel));

interface Props {
  state: ISqlEditorTabState;
  id: string;
}

export const SqlResultPanel = observer<Props>(function SqlResultPanel({ state, id }) {
  const resultTab = state.resultTabs.find(tab => tab.tabId === id);

  if (resultTab) {
    return (
      <div className={classes['resultPanel']}>
        <SqlResultSetPanel resultTab={resultTab} state={state} />
      </div>
    );
  }

  const executionPlanTab = state.executionPlanTabs.find(tab => tab.tabId === id);

  if (executionPlanTab) {
    return (
      <div className={classes['resultPanel']}>
        <SqlExecutionPlanPanel executionPlanTab={executionPlanTab} />
      </div>
    );
  }

  const statisticsTab = state.statisticsTabs.find(tab => tab.tabId === id);

  if (statisticsTab) {
    return (
      <div className={classes['resultPanel']}>
        <SqlScriptStatisticsPanel tab={statisticsTab} />
      </div>
    );
  }

  if (state.outputLogsTab) {
    return (
      <div className={classes['resultPanel']}>
        <OutputLogsPanel sqlEditorTabState={state} />
      </div>
    );
  }

  return null;
});
