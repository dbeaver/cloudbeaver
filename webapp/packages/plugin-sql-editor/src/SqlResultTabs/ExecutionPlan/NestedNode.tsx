/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useCallback, useState } from 'react';

import { EventTableItemSelectionFlag, TableColumnValue, TableItem } from '@cloudbeaver/core-blocks';
import { EventContext } from '@cloudbeaver/core-events';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import type { IExecutionPlanNode } from './ExecutionPlanTreeContext.js';
import { Expand } from './Expand.js';
import { getPropertyValue } from './getPropertyValue.js';
import classes from './NestedNode.module.css';

interface Props {
  columns: ObjectPropertyInfo[];
  node: IExecutionPlanNode;
  depth: number;
  className?: string;
}

export const NestedNode: React.FC<Props> = function NestedNode({ columns, node, depth, className }) {
  const [expanded, setExpanded] = useState(true);

  const expand = useCallback((event: React.MouseEvent<any>) => {
    EventContext.set(event, EventTableItemSelectionFlag);
    setExpanded(prev => !prev);
  }, []);

  const hasChildren = node.children.length > 0;

  return (
    <>
      <TableItem key={`${node.id}_${depth}`} className={className} item={node.id} selectOnItem>
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
      </TableItem>
      {expanded && node.children.map(child => <NestedNode key={child.id} columns={columns} node={child} depth={depth + 1} />)}
    </>
  );
};
