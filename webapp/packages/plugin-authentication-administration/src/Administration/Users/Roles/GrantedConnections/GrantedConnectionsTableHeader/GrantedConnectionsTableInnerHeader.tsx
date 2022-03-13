/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { TableColumnHeader, TableHeader, TableSelect } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles } from '@cloudbeaver/core-theming';

interface Props {
  disabled?: boolean;
  className?: string;
}

const styles = css`
    TableHeader {
      composes: theme-background-surface from global;
      position: sticky;
      top: 0;
      z-index: 1;
    }
  `;

export const GrantedConnectionsTableInnerHeader = observer<Props>(function GrantedConnectionsTableInnerHeader({ disabled, className }) {
  const translate = useTranslate();
  return styled(useStyles(styles))(
    <TableHeader className={className}>
      <TableColumnHeader min flex centerContent>
        <TableSelect id='selectConnections' disabled={disabled} />
      </TableColumnHeader>
      <TableColumnHeader min />
      <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
      <TableColumnHeader>{translate('connections_connection_address')}</TableColumnHeader>
    </TableHeader>
  );
});
