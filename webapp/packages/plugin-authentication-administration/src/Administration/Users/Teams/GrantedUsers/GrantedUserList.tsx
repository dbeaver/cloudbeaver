/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';

import { UsersResource } from '@cloudbeaver/core-authentication';
import {
  Button,
  getComputed,
  getSelectedItems,
  Group,
  s,
  Table,
  TableBody,
  TableColumnValue,
  TableItem,
  useObjectRef,
  useS,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

import { getFilteredUsers } from './getFilteredUsers';
import style from './GrantedUserList.m.css';
import { GrantedUsersTableHeader, IFilterState } from './GrantedUsersTableHeader/GrantedUsersTableHeader';
import { GrantedUsersTableInnerHeader } from './GrantedUsersTableHeader/GrantedUsersTableInnerHeader';
import { GrantedUsersTableItem } from './GrantedUsersTableItem';

interface Props {
  grantedUsers: AdminUserInfoFragment[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onEdit: () => void;
}

export const GrantedUserList = observer<Props>(function GrantedUserList({ grantedUsers, disabled, onRevoke, onEdit }) {
  const styles = useS(style);
  const props = useObjectRef({ onRevoke, onEdit });
  const translate = useTranslate();

  const usersResource = useService(UsersResource);
  const serverConfigResource = useService(ServerConfigResource);

  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const users = getFilteredUsers(grantedUsers, filterState.filterValue);
  const keys = users.map(user => user.userId);

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
    <Group className={s(styles, { box: true })} box medium overflow>
      <div className={s(styles, { innerBox: true })}>
        <GrantedUsersTableHeader className={s(styles, { header: true })} filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['outlined']} onClick={revoke}>
            {translate('ui_delete')}
          </Button>
          <Button disabled={disabled} mod={['unelevated']} onClick={props.onEdit}>
            {translate('ui_edit')}
          </Button>
        </GrantedUsersTableHeader>
        <div className={s(styles, { tableBox: true })}>
          <Table className={s(styles, { table: true })} keys={keys} selectedItems={selectedSubjects} isItemSelectable={item => isEditable(item)}>
            <GrantedUsersTableInnerHeader disabled={disabled} />
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
                  disabled={disabled}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Group>
  );
});
