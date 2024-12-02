/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { useState } from 'react';

import { TableColumnValue, TableItem } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import { Expand } from '../Expand.js';
import { getPropertyValue } from '../getPropertyValue.js';
import classes from './PropertiesPanelItemsGroup.module.css';

interface Props {
  properties: ObjectPropertyInfo[];
  name: string;
}

export const PropertiesPanelItemsGroup: React.FC<Props> = function PropertiesPanelItemsGroup({ properties, name }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <TableItem item={`${name}_root`} selectDisabled>
        <TableColumnValue className={classes['tableColumnValue']} title={name}>
          <div className={classes['control']}>
            <div className={classes['expandContainer']}>
              <Expand expanded={expanded} onClick={() => setExpanded(!expanded)} />
            </div>
            {name}
          </div>
        </TableColumnValue>
        <TableColumnValue className={classes['tableColumnValue']} />
      </TableItem>
      {expanded &&
        properties.map(property => {
          const name = property.displayName;
          const tooltip = `${name} ${property.description ? '(' + property.description + ')' : ''}`;
          const value = getPropertyValue(property);
          return (
            <TableItem key={property.id} item={property.id} selectDisabled>
              <TableColumnValue className={classes['tableColumnValue']} title={tooltip}>
                {'\t\t' + name}
              </TableColumnValue>
              <TableColumnValue className={classes['tableColumnValue']} title={value}>
                {value}
              </TableColumnValue>
            </TableItem>
          );
        })}
    </>
  );
};
