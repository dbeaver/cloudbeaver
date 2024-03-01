/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AdminUser, UsersResource } from '@cloudbeaver/core-authentication';
import {
  Checkbox,
  Loader,
  Placeholder,
  TableColumnValue,
  TableItem,
  TableItemExpand,
  TableItemSelect,
  useAutoLoad,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { clsx } from '@cloudbeaver/core-utils';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService';
import { UsersAdministrationService } from '../UsersAdministrationService';
import style from './User.m.css';
import { UserEdit } from './UserEdit';

interface Props {
  user: AdminUser;
  displayAuthRole: boolean;
  selectable?: boolean;
}

export const User = observer<Props>(function User({ user, displayAuthRole, selectable }) {
  const usersAdministrationService = useService(UsersAdministrationService);
  const usersService = useService(UsersResource);
  const notificationService = useService(NotificationService);
  const administrationUsersManagementService = useService(AdministrationUsersManagementService);
  const translate = useTranslate();

  useAutoLoad(User, administrationUsersManagementService.loaders);

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

  const userManagementDisabled = administrationUsersManagementService.externalUserProviderEnabled;
  const teams = user.grantedTeams.join(', ');

  return (
    <TableItem item={user.userId} expandElement={UserEdit} selectDisabled={!selectable}>
      {selectable && (
        <TableColumnValue centerContent flex>
          <TableItemSelect />
        </TableColumnValue>
      )}
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue className={style.expand} title={user.userId} expand ellipsis>
        {user.userId}
      </TableColumnValue>
      {displayAuthRole && (
        <TableColumnValue className={style.expand} title={user.authRole} expand ellipsis>
          {user.authRole}
        </TableColumnValue>
      )}
      <TableColumnValue title={teams} ellipsis>
        {teams}
      </TableColumnValue>
      <TableColumnValue>
        <Checkbox
          checked={user.enabled}
          disabled={usersService.isActiveUser(user.userId) || userManagementDisabled}
          title={enabledCheckboxTitle}
          onChange={handleEnabledCheckboxChange}
        />
      </TableColumnValue>
      <TableColumnValue className={clsx(style.gap, style.overflow)} flex ellipsis>
        <Loader suspense small inline hideMessage>
          <Placeholder container={usersAdministrationService.userDetailsInfoPlaceholder} user={user} />
        </Loader>
      </TableColumnValue>
    </TableItem>
  );
});
