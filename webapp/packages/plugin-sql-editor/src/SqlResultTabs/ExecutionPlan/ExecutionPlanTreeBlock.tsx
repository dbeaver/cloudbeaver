/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import {
  Pane,
  ResizerControls,
  s,
  Split,
  Table,
  TableBody,
  TableColumnHeader,
  TableHeader,
  Textarea,
  TextPlaceholder,
  useS,
  useSplitUserState,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { SqlExecutionPlanNode } from '@cloudbeaver/core-sdk';

import style from './ExecutionPlanTreeBlock.module.css';
import { NestedNode } from './NestedNode.js';
import { useExecutionPlanTreeState } from './useExecutionPlanTreeState.js';

interface Props {
  nodeList: SqlExecutionPlanNode[];
  query: string;
  onNodeSelect: (nodeId: string) => void;
  className?: string;
}

export const ExecutionPlanTreeBlock = observer<Props>(function ExecutionPlanTreeBlock({ nodeList, query, onNodeSelect, className }) {
  const styles = useS(style);
  const translate = useTranslate();
  const splitState = useSplitUserState('execution-plan-block');
  const state = useExecutionPlanTreeState(nodeList, onNodeSelect);

  return (
    <Split className={s(styles, { split: true }, className)} {...splitState} sticky={30} split="horizontal" keepRatio>
      <Pane className={styles['pane']}>
        {state.nodes.length && state.columns.length ? (
          <Table selectedItems={state['selectedNodes']} onSelect={state.selectNode}>
            <TableHeader fixed>
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
                <NestedNode key={node.id} columns={state.columns} node={node} depth={0} />
              ))}
            </TableBody>
          </Table>
        ) : (
          <TextPlaceholder>{translate('sql_execution_plan_placeholder')}</TextPlaceholder>
        )}
      </Pane>
      <ResizerControls className={styles['resizerControls']} />
      <Pane className={styles['pane']} basis="30%" main>
        <Textarea className={s(styles, { textarea: true }, className)} name="value" rows={3} value={query} readOnly embedded />
      </Pane>
    </Split>
  );
});
