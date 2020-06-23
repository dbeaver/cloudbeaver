/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';

import { useDatabaseObjectInfo } from '@cloudbeaver/core-app';
import { TableHeader, TableBody, Table } from '@cloudbeaver/core-blocks';

import { Header } from './Header';
import { Item } from './Item';

type ObjectChildrenPropertyTableProps = {
  nodeIds: string[];
}

export const ObjectChildrenPropertyTable = observer(function ObjectPropertyTable({
  nodeIds,
}: ObjectChildrenPropertyTableProps) {

  const firstChild = nodeIds[0] || '';
  const properties = useDatabaseObjectInfo(firstChild).dbObject?.properties;

  return (
    <Table>
      <TableHeader>
        <Header properties={properties || []} />
      </TableHeader>
      <TableBody>
        {nodeIds.map(id => (
          <Item
            key={id}
            objectId={id}
            columns={properties?.length || 0}
          />
        ))}
      </TableBody>
    </Table>
  );
});
