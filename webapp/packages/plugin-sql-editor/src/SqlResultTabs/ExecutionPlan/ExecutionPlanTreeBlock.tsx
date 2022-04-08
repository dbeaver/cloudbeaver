/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import {
  Split, Pane, ResizerControls, splitStyles, TextPlaceholder,
  Table, TableHeader, TableColumnHeader, TableBody, Textarea, useSplitUserState
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { SqlExecutionPlanNode } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { NestedNode } from './NestedNode';
import { useExecutionPlanTreeState } from './useExecutionPlanTreeState';

const styles = css`
    Pane {
      composes: theme-background-surface theme-text-on-surface from global;
    }
    TableHeader {
      composes: theme-background-surface from global;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    Split {
      height: 100%;
      flex-direction: column;
    }
    ResizerControls {
      width: 100%;
      height: 2px;
    }
    Textarea > :global(textarea) {
      border: none !important;
    }
  `;

interface Props {
  nodeList: SqlExecutionPlanNode[];
  query: string;
  onNodeSelect: (nodeId: string) => void;
  className?: string;
}

export const ExecutionPlanTreeBlock = observer<Props>(function ExecutionPlanTreeBlock({
  nodeList, query, onNodeSelect, className,
}) {
  const style = useStyles(styles, splitStyles);
  const translate = useTranslate();
  const splitState = useSplitUserState('execution-plan-block');
  const state = useExecutionPlanTreeState(nodeList, onNodeSelect);

  return styled(style)(
    <Split
      {...splitState}
      className={className}
      sticky={30}
      split='horizontal'
      keepRatio
    >
      <Pane>
        {state.nodes.length && state.columns.length ? (
          <Table selectedItems={state.selectedNodes} onSelect={state.selectNode}>
            <TableHeader>
              {state.columns.map(property => {
                const name = property.displayName;
                const columnTooltip = `${name} ${property.description ? '(' + property.description + ')' : ''}`;
                return (
                  <TableColumnHeader key={property.id || property.order} title={columnTooltip}>
                    {name}
                  </TableColumnHeader>
                );
              })}
            </TableHeader>
            <TableBody>
              {state.nodes.map(node => (
                <NestedNode
                  key={node.id}
                  columns={state.columns}
                  node={node}
                  depth={0}
                />
              ))}
            </TableBody>
          </Table>
        ) : <TextPlaceholder>{translate('sql_execution_plan_placeholder')}</TextPlaceholder>}
      </Pane>
      <ResizerControls />
      <Pane basis='30%' main>
        <Textarea
          className={className}
          name='value'
          rows={3}
          value={query}
          readOnly
          embedded
        />
      </Pane>
    </Split>
  );
});
