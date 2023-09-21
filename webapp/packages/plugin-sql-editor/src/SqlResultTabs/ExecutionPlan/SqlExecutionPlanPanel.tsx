/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Loader, Pane, ResizerControls, s, Split, useS, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import type { IExecutionPlanTab } from '../../ISqlEditorTabState';
import { ExecutionPlanTreeBlock } from './ExecutionPlanTreeBlock';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import style from './SqlExecutionPlanPanel.m.css';
import { SqlExecutionPlanService } from './SqlExecutionPlanService';

interface Props {
  executionPlanTab: IExecutionPlanTab;
}

export const SqlExecutionPlanPanel = observer<Props>(function SqlExecutionPlanPanel({ executionPlanTab }) {
  const styles = useS(style);
  const sqlExecutionPlanService = useService(SqlExecutionPlanService);
  const data = sqlExecutionPlanService.data.get(executionPlanTab.tabId);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const splitState = useSplitUserState('execution-plan');

  if (data?.task.executing || !data?.executionPlan) {
    return <Loader cancelDisabled={!data?.task.cancellable} onCancel={() => data?.task.cancel()} />;
  }

  return (
    <Split
      className={s(styles, { split: true })}
      {...splitState}
      mode={selectedNode ? splitState.mode : 'minimize'}
      disable={!selectedNode}
      sticky={30}
    >
      <Pane className={s(styles, { pane: true })}>
        <ExecutionPlanTreeBlock nodeList={data.executionPlan.nodes} query={data.executionPlan.query} onNodeSelect={setSelectedNode} />
      </Pane>
      <ResizerControls />
      <Pane className={s(styles, { pane: true })} basis="30%" main>
        {selectedNode && <PropertiesPanel selectedNode={selectedNode} nodeList={data.executionPlan.nodes} />}
      </Pane>
    </Split>
  );
});
