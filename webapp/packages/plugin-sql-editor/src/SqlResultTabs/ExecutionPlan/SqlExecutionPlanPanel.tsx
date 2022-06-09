/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { Split, Pane, ResizerControls, splitStyles, Loader, useSplitUserState } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IExecutionPlanTab } from '../../ISqlEditorTabState';
import { ExecutionPlanTreeBlock } from './ExecutionPlanTreeBlock';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import { SqlExecutionPlanService } from './SqlExecutionPlanService';

const styles = css`
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
    Pane:first-child {
      overflow: hidden;
    }
 `;

interface Props {
  executionPlanTab: IExecutionPlanTab;
}

export const SqlExecutionPlanPanel = observer<Props>(function SqlExecutionPlanPanel({
  executionPlanTab,
}) {
  const style = useStyles(styles, splitStyles);
  const sqlExecutionPlanService = useService(SqlExecutionPlanService);
  const data = sqlExecutionPlanService.data.get(executionPlanTab.tabId);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const splitState = useSplitUserState('execution-plan');

  if (data?.task.executing || !data?.executionPlan) {
    return (
      <Loader
        cancelDisabled={!data?.task.cancellable}
        onCancel={() => data?.task.cancel()}
      />
    );
  }

  return styled(style)(
    <Split
      {...splitState}
      mode={selectedNode ? splitState.mode : 'minimize'}
      disable={!selectedNode}
      sticky={30}
    >
      <Pane>
        <ExecutionPlanTreeBlock
          nodeList={data.executionPlan.nodes}
          query={data.executionPlan.query}
          onNodeSelect={setSelectedNode}
        />
      </Pane>
      <ResizerControls />
      <Pane basis='30%' main>
        {selectedNode && <PropertiesPanel selectedNode={selectedNode} nodeList={data.executionPlan.nodes} />}
      </Pane>
    </Split>
  );
});
