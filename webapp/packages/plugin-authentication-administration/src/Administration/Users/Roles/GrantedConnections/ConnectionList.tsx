/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css, use } from 'reshadow';

import {
  Table,
  TableBody,
  TableItem,
  TableColumnValue,
  BASE_CONTAINERS_STYLES,
  Group,
  Button,
  useObjectRef,
  getComputed,
  getSelectedItems,
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { DatabaseConnectionFragment } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { getFilteredConnections } from './getFilteredConnections';
import { GrantedConnectionsTableHeader, IFilterState } from './GrantedConnectionsTableHeader/GrantedConnectionsTableHeader';
import { GrantedConnectionsTableInnerHeader } from './GrantedConnectionsTableHeader/GrantedConnectionsTableInnerHeader';
import { GrantedConnectionsTableItem } from './GrantedConnectionsTableItem';

const styles = css`
    Group {
      position: relative;
    }
    Group, container, table-container {
      height: 100%;
    }
    container {
      display: flex;
      flex-direction: column;
      width: 100%;
    }
    table-container {
      overflow: auto;
    }
    GrantedConnectionsTableHeader {
      flex: 0 0 auto;
    }
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
      width: 100%;
    }
  `;

interface Props {
  connectionList: DatabaseConnectionFragment[];
  grantedSubjects: string[];
  disabled: boolean;
  onGrant: (subjectIds: string[]) => void;
}

export const ConnectionList = observer<Props>(function ConnectionList({
  connectionList,
  grantedSubjects,
  disabled,
  onGrant,
}) {
  const props = useObjectRef({ onGrant });
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  const driversResource = useService(DBDriverResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const grant = useCallback(() => {
    props.onGrant(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  const connections = getFilteredConnections(connectionList, filterState.filterValue);
  const keys = connections.map(connection => connection.id);

  return styled(style)(
    <Group box medium overflow>
      <container>
        <GrantedConnectionsTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['unelevated']} onClick={grant}>{translate('ui_add')}</Button>
        </GrantedConnectionsTableHeader>
        <table-container>
          <Table
            keys={keys}
            selectedItems={selectedSubjects}
            isItemSelectable={item => !grantedSubjects.includes(item)}
            size='big'
          >
            <GrantedConnectionsTableInnerHeader disabled={disabled} />
            <TableBody>
              {!connections.length && filterState.filterValue && (
                <TableItem item='tableInfo' selectDisabled>
                  <TableColumnValue colSpan={5}>
                    {translate('ui_search_no_result_placeholder')}
                  </TableColumnValue>
                </TableItem>
              )}
              {connections.map(connection => {
                const driver = driversResource.get(connection.driverId);
                return (
                  <GrantedConnectionsTableItem
                    key={connection.id}
                    id={connection.id}
                    name={connection.name}
                    tooltip={connection.name}
                    host={`${connection.host || ''}${connection.host && connection.port ? ':' + connection.port : ''}`}
                    icon={driver?.icon}
                    disabled={disabled}
                  />
                );
              })}
            </TableBody>
          </Table>
        </table-container>
      </container>
    </Group>
  );
});
