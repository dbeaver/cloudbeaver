/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import {
  Button,
  Container,
  getComputed,
  getSelectedItems,
  Group,
  s,
  Table,
  TableBody,
  TableColumnValue,
  TableItem,
  useObjectRef,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { type ConnectionInfoCustomOptions, type ConnectionInfoOrigin, DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';

import styles from './ConnectionList.module.css';
import { getFilteredConnections } from './getFilteredConnections.js';
import { GrantedConnectionsTableHeader, type IFilterState } from './GrantedConnectionsTableHeader/GrantedConnectionsTableHeader.js';
import { GrantedConnectionsTableInnerHeader } from './GrantedConnectionsTableHeader/GrantedConnectionsTableInnerHeader.js';
import { GrantedConnectionsTableItem } from './GrantedConnectionsTableItem.js';

interface Props {
  connectionList: ConnectionInfoCustomOptions[];
  connectionsOrigins: ConnectionInfoOrigin[];
  grantedSubjects: string[];
  disabled: boolean;
  onGrant: (subjectIds: string[]) => void;
}

export const ConnectionList = observer<Props>(function ConnectionList({ connectionList, connectionsOrigins, grantedSubjects, disabled, onGrant }) {
  const props = useObjectRef({ onGrant });
  const style = useS(styles);
  const translate = useTranslate();

  const driversResource = useService(DBDriverResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const grant = useCallback(() => {
    props.onGrant(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  const connections = getFilteredConnections(connectionList, connectionsOrigins, filterState.filterValue);
  const keys = connectionList.map(connection => connection.id);

  return (
    <Group className={s(style, { group: true })} box border medium overflow vertical>
      <GrantedConnectionsTableHeader filterState={filterState} disabled={disabled}>
        <Container keepSize>
          <Button disabled={disabled || !selected} onClick={grant}>
            {translate('ui_add')}
          </Button>
        </Container>
      </GrantedConnectionsTableHeader>
      <Container overflow>
        <Table keys={keys} selectedItems={selectedSubjects} isItemSelectable={item => !grantedSubjects.includes(item)}>
          <GrantedConnectionsTableInnerHeader className={s(style, { header: true })} disabled={disabled} />
          <TableBody>
            {!connections.length && filterState.filterValue && (
              <TableItem item="tableInfo" selectDisabled>
                <TableColumnValue colSpan={5}>{translate('ui_search_no_result_placeholder')}</TableColumnValue>
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
      </Container>
    </Group>
  );
});
