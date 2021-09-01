/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useMemo, useState } from 'react';
import styled, { css } from 'reshadow';

import {
  Table,
  TableBody,
  TableItem,
  TableColumnValue,
  BASE_CONTAINERS_STYLES,
  Group,
  Button,
  useObjectRef
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
import type { DatabaseConnectionFragment } from '@cloudbeaver/core-sdk';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import type { IFilterState } from '../GrantedUsers/GrantedUsersTableHeader/GrantedUsersTableHeader';
import { getFilteredConnections } from './getFilteredConnections';
import { GrantedConnectionsTableHeader } from './GrantedConnectionsTableHeader/GrantedConnectionsTableHeader';
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
    GrantedConnectionsTableHeader {
      flex: 0 0 auto;
    }
    table-container {
      overflow: auto;
    }
  `
);

interface Props {
  grantedConnections: DatabaseConnectionFragment[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onEdit: () => void;
}

export const GrantedConnectionList = observer<Props>(function GrantedConnectionList({
  grantedConnections,
  disabled,
  onRevoke,
  onEdit,
}) {
  const props = useObjectRef({ onRevoke, onEdit });
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  const driversResource = useService(DBDriverResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));
  const selectedList = useMemo(() => computed(
    () => Array.from(selectedSubjects.entries()).filter(([key, value]) => value).map(([key]) => key)
  ), [selectedSubjects]);

  const revoke = useCallback(() => {
    props.onRevoke(selectedList.get());
    selectedSubjects.clear();
  }, []);

  const connections = useMemo(() => computed(() => getFilteredConnections(
    grantedConnections, filterState.filterValue
  )), [filterState, grantedConnections]);

  let tableInfoText: TLocalizationToken | null = null;
  if (!connections.get().length) {
    if (filterState.filterValue) {
      tableInfoText = 'connections_connection_access_filter_no_result';
    } else {
      tableInfoText = 'connections_connection_access_empty_table_placeholder';
    }
  }

  return styled(style)(
    <Group box medium overflow>
      <container>
        <GrantedConnectionsTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selectedList.get().length} mod={['outlined']} onClick={revoke}>{translate('ui_revoke')}</Button>
          <Button disabled={disabled} mod={['unelevated']} onClick={props.onEdit}>{translate('ui_edit')}</Button>
        </GrantedConnectionsTableHeader>
        <table-container>
          <Table selectedItems={selectedSubjects}>
            <GrantedConnectionsTableInnerHeader />
            <TableBody>
              <TableItem item='tableInfo' selectDisabled>
                {tableInfoText && (
                  <TableColumnValue colSpan={5}>
                    {translate(tableInfoText)}
                  </TableColumnValue>
                )}
              </TableItem>
              {connections.get().map(connection => {
                const driver = driversResource.get(connection.driverId);
                return (
                  <GrantedConnectionsTableItem
                    key={connection.id}
                    id={connection.id}
                    name={connection.name}
                    host={`${connection.host || ''}${connection.port ? ':' + connection.port : ''}`}
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
