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
    Split {
      height: 100%;
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
  const sqlExecutionPlanService = useService(SqlExecutionPlanService);
  const data = sqlExecutionPlanService.results.get(executionPlanTab.tabId);
  const process = sqlExecutionPlanService.processes.get(executionPlanTab.tabId);

  const executionPlanState = useExecutionPlanTreeState(data?.executionPlan.nodes || [], data?.executionPlan.query || '');
  const loading = process?.isInProgress || !data;
  const canCancel = process ? process?.getState() === EDeferredState.PENDING : false;

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
      <Split mode={executionPlanState.metadataPanel ? undefined : 'maximize'}>
        <Pane main>
          <ExecutionPlanTreeBlock />
        </Pane>
        {executionPlanState.metadataPanel && executionPlanState.selectedNode && (
          <>
            <ResizerControls />
            <Pane>
              <PropertiesPanel properties={executionPlanState.selectedNode.properties} />
            </Pane>
          </>
        )}
      </Split>
    </ExecutionPlanTreeContext.Provider>
  );
});
