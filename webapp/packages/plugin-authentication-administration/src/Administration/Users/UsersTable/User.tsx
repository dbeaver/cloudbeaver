/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import type { AdminUser } from '@cloudbeaver/core-authentication';
import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand, Placeholder, Checkbox
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { useStyles } from '@cloudbeaver/core-theming';

import { UsersAdministrationService } from '../UsersAdministrationService';
import { UserEdit } from './UserEdit';

const styles = css`
  TableColumnValue[expand] {
    cursor: pointer;
  }
  TableColumnValue[|gap] {
    gap: 16px;
  }
`;

interface Props {
  user: AdminUser;
  selectable?: boolean;
}

export const User = observer<Props>(function User({ user, selectable }) {
  const usersAdministrationService = useService(UsersAdministrationService);
  const roles = user.grantedRoles.join(', ');

  return styled(useStyles(styles))(
    <TableItem item={user.userId} expandElement={UserEdit} selectDisabled={!selectable}>
      {selectable && (
        <TableColumnValue centerContent flex>
          <TableItemSelect />
        </TableColumnValue>
      )}
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue title={user.userId} expand ellipsis>{user.userId}</TableColumnValue>
      <TableColumnValue title={roles} ellipsis>{roles}</TableColumnValue>
      <TableColumnValue>
        <Checkbox checked={user.enabled} disabled />
      </TableColumnValue>
      <TableColumnValue flex {...use({ gap: true })}>
        <Placeholder container={usersAdministrationService.userDetailsInfoPlaceholder} user={user} />
      </TableColumnValue>
    </TableItem>
  );
});
