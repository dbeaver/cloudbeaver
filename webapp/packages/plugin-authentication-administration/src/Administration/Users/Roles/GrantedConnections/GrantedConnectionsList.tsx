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
  getSelectedItems,
  getComputed
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { TLocalizationToken, useTranslate } from '@cloudbeaver/core-localization';
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
    GrantedConnectionsTableHeader {
      flex: 0 0 auto;
    }
    table-container {
      overflow: auto;
    }
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
      width: 100%;
    }
  `;

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

  const connections = getFilteredConnections(grantedConnections, filterState.filterValue);
  const keys = connections.map(connection => connection.id);

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

  return styled(style)(
    <Group box medium overflow>
      <container>
        <GrantedConnectionsTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['outlined']} onClick={revoke}>{translate('ui_delete')}</Button>
          <Button disabled={disabled} mod={['unelevated']} onClick={props.onEdit}>{translate('ui_edit')}</Button>
        </GrantedConnectionsTableHeader>
        <table-container>
          <Table keys={keys} selectedItems={selectedSubjects} size='big'>
            <GrantedConnectionsTableInnerHeader disabled={disabled} />
            <TableBody>
              <TableItem item='tableInfo' selectDisabled>
                {tableInfoText && (
                  <TableColumnValue colSpan={5}>
                    {translate(tableInfoText)}
                  </TableColumnValue>
                )}
              </TableItem>
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
        </table-container>
      </container>
    </Group>
  );
});
