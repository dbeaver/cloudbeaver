/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import React from 'react';
import styled, { css } from 'reshadow';

import { importLazyComponent } from '@cloudbeaver/core-blocks';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';

const SqlExecutionPlanPanel = importLazyComponent(() => import('./ExecutionPlan/SqlExecutionPlanPanel').then(module => module.SqlExecutionPlanPanel));
const OutputLogsPanel = importLazyComponent(() => import('./OutputLogs/OutputLogsPanel').then(module => module.OutputLogsPanel));
const SqlResultSetPanel = importLazyComponent(() => import('./SqlResultSetPanel').then(module => module.SqlResultSetPanel));
const SqlScriptStatisticsPanel = importLazyComponent(() => import('./SqlScriptStatisticsPanel').then(module => module.SqlScriptStatisticsPanel));

const style = css`
  result-panel {
    display: flex;
    flex: 1;
    overflow: auto;
  }
`;

interface Props {
  state: ISqlEditorTabState;
  id: string;
}

export const SqlResultPanel = observer<Props>(function SqlResultPanel({ state, id }) {
  const resultTab = state.resultTabs.find(tab => tab.tabId === id);

  if (resultTab) {
    const group = state.resultGroups.find(group => group.groupId === resultTab.groupId)!;

    return styled(style)(
      <result-panel>
        <SqlResultSetPanel resultTab={resultTab} group={group} />
      </result-panel>,
    );
  }

  const executionPlanTab = state.executionPlanTabs.find(tab => tab.tabId === id);

  if (executionPlanTab) {
    return styled(style)(
      <result-panel>
        <SqlExecutionPlanPanel executionPlanTab={executionPlanTab} />
      </result-panel>,
    );
  }

  const statisticsTab = state.statisticsTabs.find(tab => tab.tabId === id);

  if (statisticsTab) {
    return styled(style)(
      <result-panel>
        <SqlScriptStatisticsPanel tab={statisticsTab} />
      </result-panel>,
    );
  }

  if (state.outputLogsTab) {
    return styled(style)(
      <result-panel>
        <OutputLogsPanel sqlEditorTabState={state} />
      </result-panel>,
    );
  }

  return null;
});
