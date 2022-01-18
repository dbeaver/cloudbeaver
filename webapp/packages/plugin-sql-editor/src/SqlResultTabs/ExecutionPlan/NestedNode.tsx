/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import { TableItem, TableColumnValue, EventTableItemSelectionFlag } from '@cloudbeaver/core-blocks';
import { EventContext } from '@cloudbeaver/core-events';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import type { IExecutionPlanNode } from './ExecutionPlanTreeContext';
import { Expand } from './Expand';
import { getPropertyValue } from './getPropertyValue';

const styles = css`
  TableColumnValue {
    white-space: pre;
    cursor: pointer;
  }
  expand-container {
    width: 24px;
    height: 24px;
    margin-right: 4px;
    display: flex;
  }
  control {
    display: flex;
    align-items: center;
  }
`;

interface Props {
  columns: ObjectPropertyInfo[];
  node: IExecutionPlanNode;
  depth: number;
  className?: string;
}

export const NestedNode: React.FC<Props> = function NestedNode({ columns, node, depth, className }) {
  const style = useStyles(styles);
  const [expanded, setExpanded] = useState(true);

  const expand = useCallback((event: React.MouseEvent<any, MouseEvent>) => {
    EventContext.set(event, EventTableItemSelectionFlag);
    setExpanded(prev => !prev);
  }, []);

  const hasChildren = node.children.length > 0;

  return styled(style)(
    <>
      <TableItem key={`${node.id}_${depth}`} className={className} item={node.id} selectOnItem>
        {columns.map((column, idx) => {
          const property = node.properties.find(property => property.id === column.id);
          const value = property ? getPropertyValue(property) : '';
          return (
            <TableColumnValue key={`${property?.id}_${depth}`} title={value || undefined}>
              <control>
                {idx === 0 && (
                  <>
                    <span>{`${'\t'.repeat(depth)}`}</span>
                    <expand-container>
                      {hasChildren && (
                        <Expand expanded={expanded} onClick={expand} />
                      )}
                    </expand-container>
                  </>
                )}
                {value}
              </control>
            </TableColumnValue>
          );
        })}
      </TableItem>
      {expanded && node.children.map(child => (
        <NestedNode
          key={child.id}
          columns={columns}
          node={child}
          depth={depth + 1}
        />
      ))}
    </>
  );
};
