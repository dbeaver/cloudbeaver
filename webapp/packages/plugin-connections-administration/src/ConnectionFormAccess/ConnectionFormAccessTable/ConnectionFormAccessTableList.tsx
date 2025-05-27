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
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

import styles from './ConnectionFormAccessTableList.module.css';
import { getFilteredTeams, getFilteredUsers } from '../getFilteredSubjects.js';
import { ConnectionFormAccessTableHeader, type IFilterState } from './ConnectionFormAccessTableHeader/ConnectionFormAccessTableHeader.js';
import { ConnectionFormAccessTableInnerHeader } from './ConnectionFormAccessTableHeader/ConnectionFormAccessTableInnerHeader.js';
import { ConnectionFormAccessTableItem } from './ConnectionFormAccessTableItem.js';

interface Props {
  userList: AdminUserInfoFragment[];
  teamList: TeamInfo[];
  grantedSubjects: string[];
  onGrant: (subjectIds: string[]) => void;
  disabled: boolean;
}

export const ConnectionFormAccessTableList = observer<Props>(function ConnectionFormAccessTableList({
  userList,
  teamList,
  grantedSubjects,
  onGrant,
  disabled,
}) {
  const props = useObjectRef({ onGrant });
  const translate = useTranslate();
  const style = useS(styles);
  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const teams = getFilteredTeams(teamList, filterState.filterValue);
  const users = getFilteredUsers(userList, filterState.filterValue);
  const keys = teamList.map(team => team.teamId).concat(userList.map(user => user.userId));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const grant = useCallback(() => {
    props.onGrant(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  return (
    <Group className={s(style, { group: true })} box medium overflow>
      <div className={s(style, { container: true })}>
        <ConnectionFormAccessTableHeader className={s(style, { connectionAccessTableHeader: true })} filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} onClick={grant}>
            {translate('ui_add')}
          </Button>
        </ConnectionFormAccessTableHeader>
        <div className={s(style, { tableContainer: true })}>
          <Table
            className={s(style, { table: true })}
            keys={keys}
            selectedItems={selectedSubjects}
            isItemSelectable={item => !grantedSubjects.includes(item)}
          >
            <ConnectionFormAccessTableInnerHeader disabled={disabled} />
            <TableBody>
              {!keys.length && filterState.filterValue && (
                <TableItem item="tableInfo" selectDisabled>
                  <TableColumnValue colSpan={5}>{translate('ui_search_no_result_placeholder')}</TableColumnValue>
                </TableItem>
              )}
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
