/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css } from 'reshadow';

import { DBObject, NavTreeResource } from '@cloudbeaver/core-app';
import { TableHeader, TableBody, Table, useTable, useControlledScroll, IScrollState, TableItem, TableColumnValue } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { Translate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';
import { useTabLocalState } from '@cloudbeaver/core-ui';

import { Header } from './Header';
import { Item } from './Item';
import { ObjectPropertyTableFooter } from './ObjectPropertyTableFooter';

const style = css`
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
      composes: theme-background-surface from global;
      position: sticky;
      top: 0;
      z-index: 1;
    }
    ObjectPropertyTableFooter {
      composes: theme-background-secondary theme-text-on-secondary theme-border-color-background from global;
      border-top: 1px solid;
    }
    TableColumnValue {
      composes: theme-text-text-hint-on-light theme-typography--caption from global;
    }
  `;

interface Props {
  objects: DBObject[];
  truncated?: boolean;
}

export const ObjectChildrenPropertyTable = observer<Props>(function ObjectPropertyTable({
  objects,
  truncated,
}) {
  const navTreeResource = useService(NavTreeResource);
  const [scrollBox, setScrollBox] = useState<HTMLDivElement | null>(null);
  const styles = useStyles(style);
  const table = useTable();
  const state = useTabLocalState<IScrollState>(() => ({ scrollTop: 0, scrollLeft: 0 }));
  useControlledScroll(scrollBox, state);

  if (objects.length === 0) {
    return null;
  }

  const baseObject = objects
    .slice()
    .sort((a, b) => (a.object?.properties?.length || 0) - (b.object?.properties?.length || 0));

  const nodeIds = objects.map(object => object.id);
  const properties = baseObject[0].object?.properties || [];

  return styled(styles)(
    <wrapper>
      <table-container ref={setScrollBox}>
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
            {truncated && (
              <TableItem item="limited">
                <TableColumnValue colSpan={properties.length + 2}>
                  <Translate token='app_navigationTree_limited' limit={navTreeResource.childrenLimit} />
                </TableColumnValue>
              </TableItem>
            )}
          </TableBody>
        </Table>
      </table-container>
      <ObjectPropertyTableFooter nodeIds={nodeIds} tableState={table} />
    </wrapper>
  );
});
