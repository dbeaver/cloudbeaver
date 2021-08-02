/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { ITab } from '@cloudbeaver/core-app';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { SqlExecutionPlanPanel } from './ExecutionPlan/SqlExecutionPlanPanel';
import { SqlResultSetPanel } from './SqlResultSetPanel';

const style = css`
  result-panel {
    display: flex;
    flex: 1;
    overflow: auto;
  }
`;

interface SqlResultPanelProps {
  tab: ITab<ISqlEditorTabState>;
  id: string;
}

export const SqlResultPanel = observer(function SqlResultPanel({ tab, id }: SqlResultPanelProps) {
  const resultTab = tab.handlerState.resultTabs.find(tab => tab.tabId === id);

  if (resultTab) {
    const group = tab.handlerState.resultGroups.find(group => group.groupId === resultTab.groupId)!;

    return styled(style)(
      <result-panel>
        <SqlResultSetPanel resultTab={resultTab} group={group} />
      </result-panel>
    );
  }

  const executionPlanTab = tab.handlerState.executionPlanTabs.find(tab => tab.tabId === id);

  if (executionPlanTab) {
    return styled(style)(
      <result-panel>
        <SqlExecutionPlanPanel executionPlanTab={executionPlanTab} />
      </result-panel>
    );
  }

  return null;
});
