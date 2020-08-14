/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react';
import styled, { use, css } from 'reshadow';

import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand, StaticImage
} from '@cloudbeaver/core-blocks';
import { DBDriverResource } from '@cloudbeaver/core-connections';
import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-localization';
import { ConnectionInfo } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';

import { ConnectionsResource } from '../../ConnectionsResource';
import { ConnectionEdit } from './ConnectionEdit';

type Props = {
  connection: ConnectionInfo;
}

const styles = css`
  StaticImage {
    display: flex;
    width: 24px;
  }
`;

export const Connection = observer(function Connection({ connection }: Props) {
  const translate = useTranslate();
  const connectionInfoResource = useService(ConnectionsResource);
  const driversResource = useService(DBDriverResource);
  const driver = driversResource.get(connection.driverId);
  const isNew = connectionInfoResource.isNew(connection.id);

  return styled(useStyles(styles))(
    <TableItem item={connection.id} expandElement={ConnectionEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue><StaticImage icon={driver?.icon} /></TableColumnValue>
      <TableColumnValue>{connection.name}</TableColumnValue>
      <TableColumnValue>{connection.host}{connection.host && connection.port && `:${connection.port}`}</TableColumnValue>
      <TableColumnValue><input type="checkbox" checked={connection.template} disabled/></TableColumnValue>
      <TableColumnValue align='right'>{isNew && <tag as='div' {...use({ mod: 'positive' })}>{translate('ui_tag_new')}</tag>}</TableColumnValue>
    </TableItem>
  );
});
