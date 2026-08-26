/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useId, useState } from 'react';

import { s, TableColumnValue, TableItem } from '@cloudbeaver/core-blocks';
import type { IObjectPropertyInfo } from '@cloudbeaver/core-sdk';
import { CompositeItem } from '@dbeaver/ui-kit';

import { Expand } from '../Expand.js';
import { getPropertyValue } from '../getPropertyValue.js';
import { useTreeGridKeyboardNavigation } from '../useTreeGridKeyboardNavigation.js';
import classes from './PropertiesPanelItemsGroup.module.css';

interface Props {
  properties: IObjectPropertyInfo[];
  name: string;
}

export const PropertiesPanelItemsGroup: React.FC<Props> = function PropertiesPanelItemsGroup({ properties, name }) {
  const groupItemId = useId();
  const [expanded, setExpanded] = useState(true);

  const handleGroupKeyDown = useTreeGridKeyboardNavigation({ expanded, setExpanded });
  const handlePropertyKeyDown = useTreeGridKeyboardNavigation({ expanded: undefined, parentItemId: groupItemId });

  return (
    <>
      <CompositeItem
        id={groupItemId}
        aria-expanded={expanded}
        aria-level={1}
        render={
          <TableItem item={`${name}_root`} className={s(classes, { row: true })} title={name} selectDisabled onClick={() => setExpanded(!expanded)} />
        }
        onKeyDown={handleGroupKeyDown}
      >
        <TableColumnValue className={classes['tableColumnValue']} title={name}>
          <div className={classes['control']}>
            <div className={classes['expandContainer']}>
              <Expand expanded={expanded} />
            </div>
            {name}
          </div>
        </TableColumnValue>
        <TableColumnValue className={classes['tableColumnValue']} />
      </CompositeItem>
      {expanded &&
        properties.map(property => {
          const name = property.displayName;
          const tooltip = `${name} ${property.description ? '(' + property.description + ')' : ''}`;
          const value = getPropertyValue(property);
          return (
            <CompositeItem
              key={property.id}
              aria-level={2}
              render={<TableItem item={property.id} className={s(classes, { row: true })} selectDisabled />}
              onKeyDown={handlePropertyKeyDown}
            >
              <TableColumnValue className={classes['tableColumnValue']} title={tooltip}>
                {'\t\t' + name}
              </TableColumnValue>
              <TableColumnValue className={classes['tableColumnValue']} title={value}>
                {value}
              </TableColumnValue>
            </CompositeItem>
          );
        })}
    </>
  );
};
