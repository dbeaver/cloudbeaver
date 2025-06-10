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
import type { TLocalizationToken } from '@cloudbeaver/core-localization';

import { getFilteredConnections } from './getFilteredConnections.js';
import style from './GrantedConnectionsList.module.css';
import { GrantedConnectionsTableHeader, type IFilterState } from './GrantedConnectionsTableHeader/GrantedConnectionsTableHeader.js';
import { GrantedConnectionsTableInnerHeader } from './GrantedConnectionsTableHeader/GrantedConnectionsTableInnerHeader.js';
import { GrantedConnectionsTableItem } from './GrantedConnectionsTableItem.js';

interface Props {
  grantedConnections: ConnectionInfoCustomOptions[];
  connectionsOrigins: ConnectionInfoOrigin[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onEdit: () => void;
}

export const GrantedConnectionList = observer<Props>(function GrantedConnectionList({
  connectionsOrigins,
  grantedConnections,
  disabled,
  onRevoke,
  onEdit,
}) {
  const props = useObjectRef({ onRevoke, onEdit });
  const styles = useS(style);
  const translate = useTranslate();

  const driversResource = useService(DBDriverResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const connections = getFilteredConnections(grantedConnections, connectionsOrigins, filterState.filterValue);
  const keys = grantedConnections.map(connection => connection.id);

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const revoke = useCallback(() => {
    props.onRevoke(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  let tableInfoText: TLocalizationToken | null = null;
  if (!connections.length) {
    if (filterState.filterValue) {
      tableInfoText = 'ui_search_no_result_placeholder';
    } else {
      tableInfoText = 'ui_no_items_placeholder';
    }
  }

  return (
    <Group className={s(styles, { group: true })} box border medium overflow vertical>
      <GrantedConnectionsTableHeader className={s(styles, { header: true })} filterState={filterState} disabled={disabled}>
        <Container keepSize>
          <Button disabled={disabled || !selected} variant="secondary" onClick={revoke}>
            {translate('ui_delete')}
          </Button>
        </Container>
        <Container keepSize>
          <Button disabled={disabled} onClick={props.onEdit}>
            {translate('ui_edit')}
          </Button>
        </Container>
      </GrantedConnectionsTableHeader>
      <Container overflow>
        <Table keys={keys} selectedItems={selectedSubjects}>
          <GrantedConnectionsTableInnerHeader disabled={disabled} />
          <TableBody>
            {tableInfoText && (
              <TableItem item="tableInfo" selectDisabled>
                <TableColumnValue colSpan={5}>{translate(tableInfoText)}</TableColumnValue>
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
                  host={`${connection.host || ''}${connection.port ? ':' + connection.port : ''}`}
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
