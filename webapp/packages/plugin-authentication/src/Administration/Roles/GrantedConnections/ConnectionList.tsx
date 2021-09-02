/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

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
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import type { DatabaseConnectionFragment } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import { getFilteredConnections } from './getFilteredConnections';
import { GrantedConnectionsTableHeader, IFilterState } from './GrantedConnectionsTableHeader/GrantedConnectionsTableHeader';
import { GrantedConnectionsTableInnerHeader } from './GrantedConnectionsTableHeader/GrantedConnectionsTableInnerHeader';
import { GrantedConnectionsTableItem } from './GrantedConnectionsTableItem';

const styles = composes(
  css`
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
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
  `
);

interface Props {
  connectionList: DatabaseConnectionFragment[];
  grantedSubjects: string[];
  onGrant: (subjectIds: string[]) => void;
  disabled: boolean;
}

export const ConnectionList = observer<Props>(function ConnectionList({
  connectionList,
  grantedSubjects,
  onGrant,
  disabled,
}) {
  const props = useObjectRef({ onGrant });
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  const driversResource = useService(DBDriverResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const grant = useCallback(() => {
    const selectedList = Array.from(selectedSubjects.entries()).filter(([key, value]) => value).map(([key]) => key);
    props.onGrant(selectedList);
    selectedSubjects.clear();
  }, []);

  const connections = getFilteredConnections(connectionList, filterState.filterValue);

  return styled(style)(
    <Group box medium overflow>
      <container>
        <GrantedConnectionsTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['unelevated']} onClick={grant}>{translate('ui_grant')}</Button>
        </GrantedConnectionsTableHeader>
        <table-container>
          <Table selectedItems={selectedSubjects}>
            <GrantedConnectionsTableInnerHeader />
            <TableBody>
              {!connections.length && filterState.filterValue && (
                <TableItem item='tableInfo' selectDisabled>
                  <TableColumnValue colSpan={5}>
                    {translate('connections_connection_access_filter_no_result')}
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
                    host={`${connection.host || ''}${connection.host && connection.port ? ':' + connection.port : ''}`}
                    icon={driver?.icon}
                    disabled={disabled || grantedSubjects.includes(connection.id)}
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
