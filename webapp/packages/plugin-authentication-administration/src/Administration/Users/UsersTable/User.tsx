/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import { AdminUser, UsersResource } from '@cloudbeaver/core-authentication';
import {
  TableItem, TableColumnValue, TableItemSelect, TableItemExpand, Placeholder, Checkbox, useTranslate, Loader
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';

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
  displayAuthRole: boolean;
  selectable?: boolean;
}

export const User = observer<Props>(function User({ user, displayAuthRole, selectable }) {
  const usersAdministrationService = useService(UsersAdministrationService);
  const teams = user.grantedTeams.join(', ');
  const usersService = useService(UsersResource);
  const notificationService = useService(NotificationService);
  const translate = useTranslate();

  async function handleEnabledCheckboxChange(enabled: boolean) {
    try {
      await usersService.enableUser(user.userId, enabled);
    } catch (error: any) {
      notificationService.logException(error);
    }
  }

  const enabledCheckboxTitle = usersService.isActiveUser(user.userId)
    ? translate('administration_teams_team_granted_users_permission_denied') : undefined;

  return styled(styles)(
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
      {displayAuthRole && (
        <TableColumnValue title={user.authRole} expand ellipsis>{user.authRole}</TableColumnValue>
      )}
      <TableColumnValue title={teams} ellipsis>{teams}</TableColumnValue>
      <TableColumnValue>
        <Checkbox
          checked={user.enabled}
          disabled={usersService.isActiveUser(user.userId)}
          title={enabledCheckboxTitle}
          onChange={handleEnabledCheckboxChange}
        />
      </TableColumnValue>
      <TableColumnValue flex {...use({ gap: true })}>
        <Loader suspense small inline hideMessage>
          <Placeholder container={usersAdministrationService.userDetailsInfoPlaceholder} user={user} />
        </Loader>
      </TableColumnValue>
    </TableItem>
  );
});
