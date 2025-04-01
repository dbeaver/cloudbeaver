/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { StaticImage, TableColumnValue, TableItem, TableItemSelect, useTranslate } from '@cloudbeaver/core-blocks';
import { type Connection, DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { AdminSubjectType } from '@cloudbeaver/core-sdk';
import { useTabState } from '@cloudbeaver/core-ui';

import type { UserFormConnectionAccessPart } from './UserFormConnectionAccessPart.js';

import style from './UserFormConnectionTableItem.module.css';

interface Props {
  connection: Connection;
  disabled?: boolean;
}

export const UserFormConnectionTableItem = observer<Props>(function UserFormConnectionTableItem({ connection, disabled }) {
  const translate = useTranslate();
  const tabState = useTabState<UserFormConnectionAccessPart>();
  const driversResource = useService(DBDriverResource);

  const connectionPermission = tabState.initialState.find(connectionPermission => connectionPermission.dataSourceId === connection.id);
  const driver = driversResource.get(connection.driverId);
  const isTeamProvided = connectionPermission?.subjectType === AdminSubjectType.Team;

  let grantedBy = '';
  if (isTeamProvided) {
    grantedBy = `${translate('authentication_administration_user_connections_access_granted_team')} ${connectionPermission.subjectId}`;
  } else if (connectionPermission) {
    grantedBy = translate('authentication_administration_user_connections_access_granted_directly');
  }

  disabled ||= isTeamProvided;
  const selected = isTeamProvided || tabState.has(connection.id);

  return (
    <TableItem key={connection.id} item={connection.id} selectDisabled={disabled}>
      <TableColumnValue centerContent flex>
        <TableItemSelect disabled={disabled} checked={selected} />
      </TableColumnValue>
      <TableColumnValue centerContent>
        <StaticImage className={style['staticImage']} icon={driver?.icon} block />
      </TableColumnValue>
      <TableColumnValue title={connection.name} ellipsis>
        {connection.name}
      </TableColumnValue>
      <TableColumnValue title={grantedBy}>{grantedBy}</TableColumnValue>
    </TableItem>
  );
});
