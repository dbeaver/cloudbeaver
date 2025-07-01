/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import { TeamRolesResource, UsersResource } from '@cloudbeaver/core-authentication';
import {
  Button,
  Container,
  getComputed,
  getSelectedItems,
  Group,
  s,
  Table,
  TableBody,
  TableColumnValue,
  TableItem,
  useObjectRef,
  useResource,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import { getFilteredUsers } from './getFilteredUsers.js';
import style from './GrantedUserList.module.css';
import { GrantedUsersTableHeader, type IFilterState } from './GrantedUsersTableHeader/GrantedUsersTableHeader.js';
import { GrantedUsersTableInnerHeader } from './GrantedUsersTableHeader/GrantedUsersTableInnerHeader.js';
import { GrantedUsersTableItem } from './GrantedUsersTableItem.js';
import type { IGrantedUser } from './IGrantedUser.js';

interface Props {
  grantedUsers: IGrantedUser[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onTeamRoleAssign: (subjectId: string, teamRole: string | null) => void;
  onEdit: () => void;
}

export const GrantedUserList = observer<Props>(function GrantedUserList({ grantedUsers, disabled, onRevoke, onTeamRoleAssign, onEdit }) {
  const styles = useS(style);
  const props = useObjectRef({ onRevoke, onEdit });
  const translate = useTranslate();

  const usersResource = useService(UsersResource);
  const serverConfigResource = useService(ServerConfigResource);

  const teamRolesResource = useResource(GrantedUserList, TeamRolesResource, undefined);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const users = getFilteredUsers(grantedUsers, filterState.filterValue) as IGrantedUser[];
  const keys = grantedUsers.map(user => user.userId);

  const revoke = useCallback(() => {
    props.onRevoke(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  let tableInfoText: TLocalizationToken | null = null;
  if (!users.length) {
    if (filterState.filterValue) {
      tableInfoText = 'ui_search_no_result_placeholder';
    } else {
      tableInfoText = 'ui_no_items_placeholder';
    }
  }

  function isEditable(userId: string) {
    if (serverConfigResource.distributed) {
      return true;
    }

    return !usersResource.isActiveUser(userId);
  }

  return (
    <Group className={s(styles, { group: true })} box border medium overflow vertical>
      <GrantedUsersTableHeader className={s(styles, { header: true })} filterState={filterState} disabled={disabled}>
        <Container keepSize>
          <Button disabled={disabled || !selected} variant="secondary" onClick={revoke}>
            {translate('ui_delete')}
          </Button>
        </Container>
        <Container keepSize>
          <Button disabled={disabled} onClick={props.onEdit}>
            {translate('ui_edit')}
          </Button>
        </Container>
      </GrantedUsersTableHeader>
      <Container overflow>
        <Table keys={keys} selectedItems={selectedSubjects} isItemSelectable={item => isEditable(item)}>
          <GrantedUsersTableInnerHeader disabled={disabled} showUserTeamRole={teamRolesResource.data.length > 0} />
          <TableBody>
            {tableInfoText && (
              <TableItem item="tableInfo" selectDisabled>
                <TableColumnValue colSpan={5}>{translate(tableInfoText)}</TableColumnValue>
              </TableItem>
            )}
            {users.map(user => (
              <GrantedUsersTableItem
                key={user.userId}
                id={user.userId}
                name={`${user.userId}${usersResource.isActiveUser(user.userId) ? ` (${translate('ui_you')})` : ''}`}
                tooltip={isEditable(user.userId) ? user.userId : translate('administration_teams_team_granted_users_permission_denied')}
                icon="/icons/user.svg"
                iconTooltip={translate('authentication_user_icon_tooltip')}
                teamRole={user.teamRole}
                teamRoles={teamRolesResource.data}
                disabled={disabled}
                onTeamRoleAssign={onTeamRoleAssign}
              />
            ))}
          </TableBody>
        </Table>
      </Container>
    </Group>
  );
});
