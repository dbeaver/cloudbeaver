/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import {
  Button,
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
import { Connection, DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';

import { getFilteredConnections } from './getFilteredConnections';
import { GrantedConnectionsTableHeader, IFilterState } from './GrantedConnectionsTableHeader/GrantedConnectionsTableHeader';
import { GrantedConnectionsTableInnerHeader } from './GrantedConnectionsTableHeader/GrantedConnectionsTableInnerHeader';
import { GrantedConnectionsTableItem } from './GrantedConnectionsTableItem';
import styles from './ConnectionList.m.css';

interface Props {
  connectionList: Connection[];
  grantedSubjects: string[];
  disabled: boolean;
  onGrant: (subjectIds: string[]) => void;
}

export const ConnectionList = observer<Props>(function ConnectionList({ connectionList, grantedSubjects, disabled, onGrant }) {
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

  const connections = getFilteredConnections(connectionList, filterState.filterValue);
  const keys = connections.map(connection => connection.id);

  return (
    <Group className={s(style, { group: true })} box medium overflow>
      <div className={s(style, { container: true })}>
        <GrantedConnectionsTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['unelevated']} onClick={grant}>
            {translate('ui_add')}
          </Button>
        </GrantedConnectionsTableHeader>
        <div className={s(style, { tableContainer: true })}>
          <Table className={s(style, { table: true })} keys={keys} selectedItems={selectedSubjects} isItemSelectable={item => !grantedSubjects.includes(item)} size="big">
            <GrantedConnectionsTableInnerHeader className={s(style, { grantedConnectionsTableHeader: true })} disabled={disabled} />
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
        </div>
      </div>
    </Group>
  );
});
