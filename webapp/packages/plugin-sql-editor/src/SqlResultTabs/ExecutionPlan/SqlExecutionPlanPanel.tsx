/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';

import { Loader, Pane, ResizerControls, s, Split, useS, useSplitUserState, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { type ITabData, Tab, TabList, TabsState, TabTitle } from '@cloudbeaver/core-ui';
import { ExecutionPlanDiagram } from '@dbeaver/react-execution-plan-diagram';

import type { IExecutionPlanTab } from '../../ISqlEditorTabState.js';
import { adaptExecutionPlanData } from './adaptExecutionPlanData.js';
import { ExecutionPlanTreeBlock } from './ExecutionPlanTreeBlock.js';
import { PlanDiagramToolbar } from './PlanDiagramToolbar.js';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel.js';
import style from './SqlExecutionPlanPanel.module.css';

import { SqlExecutionPlanService } from './SqlExecutionPlanService.js';

type ViewMode = 'table' | 'diagram';

const VIEW_TAB_ID_TABLE: ViewMode = 'table';
const VIEW_TAB_ID_DIAGRAM: ViewMode = 'diagram';
const DIAGRAM_OPTIONS = { highlightHeavyRoute: true, enableCollapse: true };

interface Props {
  executionPlanTab: IExecutionPlanTab;
}

export const SqlExecutionPlanPanel = observer<Props>(function SqlExecutionPlanPanel({ executionPlanTab }) {
  const styles = useS(style);
  const translate = useTranslate();
  const sqlExecutionPlanService = useService(SqlExecutionPlanService);
  const data = sqlExecutionPlanService.data.get(executionPlanTab.tabId);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(VIEW_TAB_ID_TABLE);
  const splitState = useSplitUserState('execution-plan');

  const diagramData = useMemo(() => (data?.executionPlan ? adaptExecutionPlanData(data.executionPlan.nodes) : null), [data?.executionPlan]);

  const handleTabChange = useCallback((tab: ITabData) => {
    setViewMode(tab.tabId as ViewMode);
  }, []);

  if (data?.task.executing || !data?.executionPlan) {
    return <Loader cancelDisabled={!data?.task.cancellable} onCancel={() => data?.task.cancel()} />;
  }

  return (
    <Split {...splitState} mode={selectedNode ? splitState.mode : 'minimize'} disable={!selectedNode} sticky={30}>
      <Pane className={s(styles, { pane: true })}>
        <TabsState currentTabId={viewMode} onChange={handleTabChange}>
          <TabList aria-label={translate('sql_execution_plan_view_label')}>
            <Tab tabId={VIEW_TAB_ID_TABLE}>
              <TabTitle>{translate('sql_execution_plan_view_table')}</TabTitle>
            </Tab>
            <Tab tabId={VIEW_TAB_ID_DIAGRAM}>
              <TabTitle>{translate('sql_execution_plan_view_diagram')}</TabTitle>
            </Tab>
          </TabList>
        </TabsState>
        {viewMode === VIEW_TAB_ID_TABLE ? (
          <ExecutionPlanTreeBlock nodeList={data.executionPlan.nodes} query={data.executionPlan.query} onNodeSelect={setSelectedNode} />
        ) : (
          diagramData && (
            <ExecutionPlanDiagram data={diagramData} selectedNodeId={selectedNode} options={DIAGRAM_OPTIONS} onNodeSelect={setSelectedNode}>
              <PlanDiagramToolbar />
            </ExecutionPlanDiagram>
          )
        )}
      </Pane>
      <ResizerControls />
      <Pane className={s(styles, { pane: true })} basis="30%" main>
        {selectedNode && <PropertiesPanel selectedNode={selectedNode} nodeList={data.executionPlan.nodes} />}
      </Pane>
    </Split>
  );
});
