/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useCallback } from 'react';
import styled, { css } from 'reshadow';

import { Split, Pane, ResizerControls, splitStyles, TextPlaceholder } from '@cloudbeaver/core-blocks';
import { Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { composes, useStyles } from '@cloudbeaver/core-theming';
import { EDeferredState } from '@cloudbeaver/core-utils';

import type { IExecutionPlanTab } from '../../ISqlEditorTabState';
import { ExecutionPlanTreeBlock } from './ExecutionPlanTreeBlock';
import { ExecutionPlanTreeContext } from './ExecutionPlanTreeContext';
import { PropertiesPanel } from './PropertiesPanel';
import { SqlExecutionPlanService } from './SqlExecutionPlanService';
import { useExecutionPlanTreeState } from './useExecutionPlanTreeState';

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

export const SqlExecutionPlanPanel: React.FC<Props> = observer(function SqlExecutionPlanPanel({
  executionPlanTab,
}) {
  const style = useStyles(styles, splitStyles);
  const translate = useTranslate();
  const tabId = executionPlanTab.tabId;
  const sqlExecutionPlanService = useService(SqlExecutionPlanService);
  const executionPlan = sqlExecutionPlanService.results.get(tabId);
  const process = sqlExecutionPlanService.processes.get(tabId);

  const executionPlanState = useExecutionPlanTreeState(executionPlan?.nodes || []);
  const loading = process?.isInProgress || !executionPlan;
  const canCancel = process?.getState() === EDeferredState.PENDING ?? false;

  const cancelTask = useCallback(() => {
    if (process) {
      process.cancel();
    }
  }, [process]);

  if (loading) {
    return (
      <Loader
        cancelDisabled={!canCancel}
        onCancel={cancelTask}
      />
    );
  }

  if (!executionPlanState.nodes.length || !executionPlanState.columns.length) {
    return <TextPlaceholder>{translate('sql_execution_plan_placeholder')}</TextPlaceholder>;
  }

  return styled(style)(
    <ExecutionPlanTreeContext.Provider value={executionPlanState}>
      <Split mode={executionPlanState.selectedNode ? undefined : 'minimize'} sticky={30}>
        <Pane>
          <ExecutionPlanTreeBlock query={executionPlanTab.query} />
        </Pane>
        {executionPlanState.selectedNode && (
          <>
            <ResizerControls />
            <Pane main>
              <PropertiesPanel properties={executionPlanState.selectedNode.properties} />
            </Pane>
          </>
        )}
      </Split>
    </ExecutionPlanTreeContext.Provider>
  );
});
