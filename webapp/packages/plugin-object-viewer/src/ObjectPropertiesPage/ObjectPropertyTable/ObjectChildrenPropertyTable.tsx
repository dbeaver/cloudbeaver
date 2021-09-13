/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { DBObject } from '@cloudbeaver/core-app';
import { TableHeader, TableBody, Table, useTable, getComputed } from '@cloudbeaver/core-blocks';
import { composes, useStyles } from '@cloudbeaver/core-theming';

import { Header } from './Header';
import { Item } from './Item';
import { ObjectPropertyTableFooter } from './ObjectPropertyTableFooter';

const style = composes(
  css`
    TableHeader {
      composes: theme-background-surface from global;
    }
    ObjectPropertyTableFooter {
      composes: theme-background-secondary theme-text-on-secondary theme-border-color-background from global;
    }
  `,
  css`
    wrapper {
      overflow: auto;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    }
    table-container {
      flex: 1;
      overflow: auto;
    }
    TableHeader {
      position: sticky;
      top: 0;
      z-index: 1;
    }
    ObjectPropertyTableFooter {
      border-top: 1px solid;
    }
  `,
);

interface Props {
  objects: DBObject[];
}

export const ObjectChildrenPropertyTable = observer<Props>(function ObjectPropertyTable({
  objects,
}) {
  const styles = useStyles(style);
  const table = useTable();

  if (objects.length === 0) {
    return null;
  }

  const baseObject = getComputed(() => (
    objects
      .slice()
      .sort((a, b) => (a.object?.properties?.length || 0) - (b.object?.properties?.length || 0))
  ));

  const nodeIds = getComputed(() => objects.map(object => object.id));
  const properties = baseObject[0].object?.properties || [];

  return styled(styles)(
    <wrapper>
      <table-container>
        <Table selectedItems={table.selected}>
          <TableHeader>
            <Header properties={properties} />
          </TableHeader>
          <TableBody>
            {objects.map(object => (
              <Item
                key={object.id}
                dbObject={object}
                columns={properties.length}
              />
            ))}
          </TableBody>
        </Table>
      </table-container>
      <ObjectPropertyTableFooter nodeIds={nodeIds} tableState={table} />
    </wrapper>
  );
});
