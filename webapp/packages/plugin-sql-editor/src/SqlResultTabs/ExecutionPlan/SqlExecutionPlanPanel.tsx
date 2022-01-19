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

import { Split, Pane, ResizerControls, splitStyles } from '@cloudbeaver/core-blocks';
import { Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import type { IExecutionPlanTab } from '../../ISqlEditorTabState';
import { ExecutionPlanTreeBlock } from './ExecutionPlanTreeBlock';
import { PropertiesPanel } from './PropertiesPanel/PropertiesPanel';
import { SqlExecutionPlanService } from './SqlExecutionPlanService';

const styles = composes(
  css`
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    Pane:first-child {
      overflow: hidden;
    }
    Pane:last-child {
      flex: 0 1 450px;
    }
 `
);

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

  if (data?.task.executing || !data?.executionPlan) {
    return (
      <Loader
        cancelDisabled={!data?.task.cancellable}
        onCancel={() => data?.task.cancel()}
      />
    );
  }

  return styled(style)(
    <Split mode={selectedNode ? undefined : 'minimize'} sticky={30}>
      <Pane>
        <ExecutionPlanTreeBlock
          nodeList={data.executionPlan.nodes}
          query={data.executionPlan.query}
          onNodeSelect={setSelectedNode}
        />
      </Pane>
      {selectedNode && (
        <>
          <ResizerControls />
          <Pane main>
            <PropertiesPanel selectedNode={selectedNode} nodeList={data.executionPlan.nodes} />
          </Pane>
        </>
      )}
    </Split>
  );
});
