/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useState } from 'react';

import { EventTableItemSelectionFlag, s, TableColumnValue, TableItem } from '@cloudbeaver/core-blocks';
import { EventContext } from '@cloudbeaver/core-events';
import type { IObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { CompositeItem } from '@dbeaver/ui-kit';

import type { IExecutionPlanNode } from './ExecutionPlanTreeContext.js';
import { Expand } from './Expand.js';
import { getPropertyValue } from './getPropertyValue.js';
import classes from './NestedNode.module.css';
import { useTreeGridKeyboardNavigation } from './useTreeGridKeyboardNavigation.js';

interface Props {
  columns: IObjectPropertyInfo[];
  node: IExecutionPlanNode;
  depth: number;
  className?: string;
}

function getNodeItemId(nodeId: string): string {
  return `execution-plan-node-${nodeId}`;
}

export const NestedNode: React.FC<Props> = function NestedNode({ columns, node, depth, className }) {
  const [expanded, setExpanded] = useState(true);

  const expand = useCallback((event: React.MouseEvent<any>) => {
    EventContext.set(event, EventTableItemSelectionFlag);
    setExpanded(prev => !prev);
  }, []);

  const hasChildren = node.children.length > 0;
  const handleKeyDown = useTreeGridKeyboardNavigation({
    expanded: hasChildren ? expanded : undefined,
    parentItemId: node.parentId ? getNodeItemId(node.parentId) : undefined,
    setExpanded,
  });

  return (
    <>
      <CompositeItem
        id={getNodeItemId(node.id)}
        aria-expanded={hasChildren ? expanded : undefined}
        aria-level={depth + 1}
        render={<TableItem item={node.id} className={s(classes, { row: true }, className)} selectOnItem />}
        onKeyDown={handleKeyDown}
      >
        {columns.map((column, idx) => {
          const property = node.properties.find(property => property.id === column.id);
          const value = property ? getPropertyValue(property) : '';
          return (
            <TableColumnValue key={`${property?.id}_${depth}`} title={value || undefined} className={classes['tableColumnValue']}>
              <div className={classes['control']}>
                {idx === 0 && (
                  <>
                    <span>{`${'\t'.repeat(depth)}`}</span>
                    <div className={classes['expandContainer']}>{hasChildren && <Expand expanded={expanded} onClick={expand} />}</div>
                  </>
                )}
                {value}
              </div>
            </TableColumnValue>
          );
        })}
      </CompositeItem>
      {expanded && node.children.map(child => <NestedNode key={child.id} columns={columns} node={child} depth={depth + 1} />)}
    </>
  );
};
