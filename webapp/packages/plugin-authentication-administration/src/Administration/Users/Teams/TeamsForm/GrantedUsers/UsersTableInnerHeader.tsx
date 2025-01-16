/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
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

export const UsersTableInnerHeader = observer<Props>(function UsersTableInnerHeader({ disabled, className }) {
  const translate = useTranslate();

  return (
    <TableHeader className={className} fixed>
      <TableColumnHeader min>
        <TableSelect id="selectUsers" disabled={disabled} />
      </TableColumnHeader>
      <TableColumnHeader min />
      <TableColumnHeader>{translate('administration_teams_team_granted_users_user_id')}</TableColumnHeader>
    </TableHeader>
  );
});
