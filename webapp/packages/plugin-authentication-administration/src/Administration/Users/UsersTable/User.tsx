/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { type AdminUser, UsersResource } from '@cloudbeaver/core-authentication';
import { Checkbox, Link, Loader, Placeholder, TableColumnValue, TableItem, TableItemSelect, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { clsx } from '@dbeaver/ui-kit';

import { UsersAdministrationService } from '../UsersAdministrationService.js';
import style from './User.module.css';
import { UsersTableOptionsPanelService } from './UsersTableOptionsPanelService.js';

interface Props {
  user: AdminUser;
  displayAuthRole: boolean;
  isManageable: boolean;
  selectable?: boolean;
}

export const User = observer<Props>(function User({ user, displayAuthRole, isManageable, selectable }) {
  const usersAdministrationService = useService(UsersAdministrationService);
  const usersService = useService(UsersResource);
  const notificationService = useService(NotificationService);
  const usersTableOptionsPanelService = useService(UsersTableOptionsPanelService);
  const translate = useTranslate();

  async function handleEnabledCheckboxChange(enabled: boolean) {
    try {
      await usersService.enableUser(user.userId, enabled);
    } catch (error: any) {
      notificationService.logException(error);
    }
  }

  const enabledCheckboxTitle = usersService.isActiveUser(user.userId)
    ? translate('administration_teams_team_granted_users_permission_denied')
    : undefined;

  const teams = user.grantedTeams.join(', ');

  return (
    <TableItem item={user.userId} selectDisabled={!selectable}>
      {selectable && (
        <TableColumnValue centerContent flex>
          <TableItemSelect />
        </TableColumnValue>
      )}
      <TableColumnValue title={user.userId} ellipsis onClick={() => usersTableOptionsPanelService.open(user.userId)}>
        <Link truncate>{user.userId}</Link>
      </TableColumnValue>
      {displayAuthRole && (
        <TableColumnValue title={user.authRole} ellipsis>
          {user.authRole}
        </TableColumnValue>
      )}
      <TableColumnValue title={teams} ellipsis>
        {teams}
      </TableColumnValue>
      <TableColumnValue>
        <Checkbox
          checked={user.enabled}
          disabled={usersService.isActiveUser(user.userId) || !isManageable}
          title={enabledCheckboxTitle}
          onChange={handleEnabledCheckboxChange}
        />
      </TableColumnValue>
      <TableColumnValue className={clsx(style['gap'], style['overflow'])} flex ellipsis>
        <Loader suspense small inline hideMessage>
          <Placeholder container={usersAdministrationService.userDetailsInfoPlaceholder} user={user} />
        </Loader>
      </TableColumnValue>
    </TableItem>
  );
});
