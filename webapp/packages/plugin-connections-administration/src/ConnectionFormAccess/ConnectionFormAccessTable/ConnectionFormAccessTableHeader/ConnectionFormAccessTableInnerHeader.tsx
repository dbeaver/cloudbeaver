/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TableColumnHeader, TableHeader, TableSelect, useTranslate } from '@cloudbeaver/core-blocks';

interface Props {
  disabled?: boolean;
  className?: string;
}

export const ConnectionFormAccessTableInnerHeader = observer<Props>(function ConnectionFormAccessTableInnerHeader({ disabled, className }) {
  const translate = useTranslate();
  return (
    <TableHeader className={className} fixed>
      <TableColumnHeader min>
        <TableSelect id="selectUsersAndTeams" disabled={disabled} />
      </TableColumnHeader>
      <TableColumnHeader min />
      <TableColumnHeader>{translate('connections_connection_access_user_or_team_name')}</TableColumnHeader>
      <TableColumnHeader>{translate('connections_connection_description')}</TableColumnHeader>
    </TableHeader>
  );
});
