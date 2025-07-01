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

import type { TeamInfo } from '@cloudbeaver/core-authentication';
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
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

import styles from './ConnectionFormAccessTableGrantedList.module.css';
import { getFilteredUsers, getFilteredTeams } from '../getFilteredSubjects.js';
import { ConnectionFormAccessTableHeader, type IFilterState } from './ConnectionFormAccessTableHeader/ConnectionFormAccessTableHeader.js';
import { ConnectionFormAccessTableInnerHeader } from './ConnectionFormAccessTableHeader/ConnectionFormAccessTableInnerHeader.js';
import { ConnectionFormAccessTableItem } from './ConnectionFormAccessTableItem.js';

interface Props {
  grantedUsers: AdminUserInfoFragment[];
  grantedTeams: TeamInfo[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onEdit: () => void;
}

export const ConnectionFormAccessTableGrantedList = observer<Props>(function ConnectionFormAccessTableGrantedList({
  grantedUsers,
  grantedTeams,
  disabled,
  onRevoke,
  onEdit,
}) {
  const props = useObjectRef({ onRevoke, onEdit });
  const translate = useTranslate();
  const style = useS(styles);
  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const revoke = useCallback(() => {
    props.onRevoke(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  const teams = getFilteredTeams(grantedTeams, filterState.filterValue);
  const users = getFilteredUsers(grantedUsers, filterState.filterValue);
  const keys = grantedTeams.map(team => team.teamId).concat(grantedUsers.map(user => user.userId));

  let tableInfoText: TLocalizationToken = 'connections_connection_access_admin_info';
  if (!keys.length) {
    if (filterState.filterValue) {
      tableInfoText = 'ui_search_no_result_placeholder';
    } else {
      tableInfoText = 'ui_no_items_placeholder';
    }
  }

  return (
    <Group className={s(style, { group: true })} box medium overflow>
      <div className={s(style, { container: true })}>
        <ConnectionFormAccessTableHeader className={s(style, { connectionAccessTableHeader: true })} filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} variant="secondary" onClick={revoke}>
            {translate('ui_delete')}
          </Button>
          <Button disabled={disabled} onClick={props.onEdit}>
            {translate('ui_edit')}
          </Button>
        </ConnectionFormAccessTableHeader>
        <div className={s(style, { tableContainer: true })}>
          <Table className={s(style, { table: true })} keys={keys} selectedItems={selectedSubjects}>
            <ConnectionFormAccessTableInnerHeader disabled={disabled} />
            <TableBody>
              <TableItem item="tableInfo" selectDisabled>
                <TableColumnValue colSpan={5}>{translate(tableInfoText)}</TableColumnValue>
              </TableItem>
              {teams.map(team => (
                <ConnectionFormAccessTableItem
                  key={team.teamId}
                  id={team.teamId}
                  name={team.teamName || team.teamId}
                  tooltip={team.teamId}
                  description={team.description}
                  icon="/icons/team.svg"
                  iconTooltip={translate('authentication_team_icon_tooltip')}
                  disabled={disabled}
                />
              ))}
              {users.map(user => (
                <ConnectionFormAccessTableItem
                  key={user.userId}
                  id={user.userId}
                  name={user.userId}
                  tooltip={user.userId}
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
