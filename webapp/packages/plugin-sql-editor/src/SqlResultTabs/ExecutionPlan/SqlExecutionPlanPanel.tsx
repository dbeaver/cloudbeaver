/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Loader, Pane, ResizerControls, s, Split, useS, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useDataContextLink } from '@cloudbeaver/core-data-context';
import { useService } from '@cloudbeaver/core-di';
import { TabPanelList, TabsState } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';

import type { IExecutionPlanTab } from '../../ISqlEditorTabState.js';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel.js';
import { DATA_CONTEXT_SQL_EXECUTION_PLAN_TAB } from './DATA_CONTEXT_SQL_EXECUTION_PLAN_TAB.js';
import { SQL_EXECUTION_PLAN_ACTIONS_MENU } from './SQL_EXECUTION_PLAN_ACTIONS_MENU.js';
import { SqlExecutionPlanActionsMenu } from './SqlExecutionPlanActionsMenu.js';
import { SqlExecutionPlanService } from './SqlExecutionPlanService.js';
import { SqlExecutionPlanViewBar } from './SqlExecutionPlanViewBar.js';
import { SqlExecutionPlanViewService } from './SqlExecutionPlanViewService.js';
import style from './SqlExecutionPlanPanel.module.css';

interface Props {
  executionPlanTab: IExecutionPlanTab;
}

export const SqlExecutionPlanPanel = observer<Props>(function SqlExecutionPlanPanel({ executionPlanTab }) {
  const styles = useS(style);
  const sqlExecutionPlanService = useService(SqlExecutionPlanService);
  const sqlExecutionPlanViewService = useService(SqlExecutionPlanViewService);
  const data = sqlExecutionPlanService.data.get(executionPlanTab.tabId);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const splitState = useSplitUserState('execution-plan');
  const menu = useMenu({ menu: SQL_EXECUTION_PLAN_ACTIONS_MENU });

  useDataContextLink(menu.context, (context, id) => {
    context.set(DATA_CONTEXT_SQL_EXECUTION_PLAN_TAB, executionPlanTab, id);
  });

  if (data?.task.executing || !data?.executionPlan) {
    return <Loader cancelDisabled={!data?.task.cancellable} onCancel={() => data?.task.cancel()} />;
  }

  return (
    <Split {...splitState} mode={selectedNode ? splitState.mode : 'minimize'} disable={!selectedNode} sticky={30}>
      <Pane className={s(styles, { pane: true })}>
        <TabsState
          container={sqlExecutionPlanViewService.tabs}
          nodes={data.executionPlan.nodes}
          query={data.executionPlan.query}
          hasCost={data.executionPlan.hasCost}
          hasRows={data.executionPlan.hasRows}
          hasDuration={data.executionPlan.hasDuration}
          durationMeasure={data.executionPlan.durationMeasure}
          selectedNode={selectedNode}
          lazy
          onNodeSelect={setSelectedNode}
        >
          <div className={s(styles, { tabsLayout: true })}>
            <div className={s(styles, { actionsBar: true })}>
              <SqlExecutionPlanActionsMenu context={menu.context} />
            </div>
            <TabPanelList className={s(styles, { tabPanelList: true })} />
            <SqlExecutionPlanViewBar />
          </div>
        </TabsState>
      </Pane>
      <ResizerControls />
      <Pane className={s(styles, { pane: true })} basis="30%" main>
        {selectedNode && <PropertiesPanel selectedNode={selectedNode} nodeList={data.executionPlan.nodes} />}
      </Pane>
    </Split>
  );
});
