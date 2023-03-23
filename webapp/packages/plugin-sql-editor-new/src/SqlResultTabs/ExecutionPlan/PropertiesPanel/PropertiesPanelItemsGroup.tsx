/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useState } from 'react';
import styled, { css } from 'reshadow';

import { TableItem, TableColumnValue } from '@cloudbeaver/core-blocks';
import type { ObjectPropertyInfo } from '@cloudbeaver/core-sdk';

import { Expand } from '../Expand';
import { getPropertyValue } from '../getPropertyValue';

const styles = css`
  TableColumnValue {
    white-space: pre;
  }
  control {
    display: flex;
    align-items: center;
  }
  expand-container {
    width: 24px;
    height: 24px;
    margin-right: 4px;
    cursor: pointer;
    display: flex;
  }
`;

interface Props {
  properties: ObjectPropertyInfo[];
  name: string;
}

export const PropertiesPanelItemsGroup: React.FC<Props> = function PropertiesPanelItemsGroup({ properties, name }) {
  const [expanded, setExpanded] = useState(true);

  return styled(styles)(
    <>
      <TableItem item={`${name}_root`} selectDisabled>
        <TableColumnValue title={name}>
          <control>
            <expand-container>
              <Expand expanded={expanded} onClick={() => setExpanded(!expanded)} />
            </expand-container>
            {name}
          </control>
        </TableColumnValue>
        <TableColumnValue />
      </TableItem>
      {expanded && properties.map(property => {
        const name = property.displayName;
        const tooltip = `${name} ${property.description ? '(' + property.description + ')' : ''}`;
        const value = getPropertyValue(property);
        return (
          <TableItem key={property.id} item={property.id} selectDisabled>
            <TableColumnValue title={tooltip}>
              {'\t\t' + name}
            </TableColumnValue>
            <TableColumnValue title={value}>
              {value}
            </TableColumnValue>
          </TableItem>
        );
      })}
    </>
  );
};
