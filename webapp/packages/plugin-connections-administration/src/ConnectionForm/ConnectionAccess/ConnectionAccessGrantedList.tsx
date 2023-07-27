/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';
import { observer } from 'mobx-react-lite';
import { useCallback, useState } from 'react';
import styled, { css } from 'reshadow';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import {
  Button,
  getComputed,
  getSelectedItems,
  Group,
  Table,
  TableBody,
  TableColumnValue,
  TableItem,
  useObjectRef,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { TLocalizationToken } from '@cloudbeaver/core-localization';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';

import { ConnectionAccessTableHeader, IFilterState } from './ConnectionAccessTableHeader/ConnectionAccessTableHeader';
import { ConnectionAccessTableInnerHeader } from './ConnectionAccessTableHeader/ConnectionAccessTableInnerHeader';
import { ConnectionAccessTableItem } from './ConnectionAccessTableItem';
import { getFilteredTeams, getFilteredUsers } from './getFilteredSubjects';

const styles = css`
  Table {
    composes: theme-background-surface theme-text-on-surface from global;
  }
  Group {
    position: relative;
  }
  Group,
  container,
  table-container {
    height: 100%;
  }
  container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }
  ConnectionAccessTableHeader {
    flex: 0 0 auto;
  }
  table-container {
    overflow: auto;
  }
`;

interface Props {
  grantedUsers: AdminUserInfoFragment[];
  grantedTeams: TeamInfo[];
  disabled: boolean;
  onRevoke: (subjectIds: string[]) => void;
  onEdit: () => void;
}

export const ConnectionAccessGrantedList = observer<Props>(function ConnectionAccessGrantedList({
  grantedUsers,
  grantedTeams,
  disabled,
  onRevoke,
  onEdit,
}) {
  const props = useObjectRef({ onRevoke, onEdit });
  const translate = useTranslate();
  const [selectedSubjects] = useState<Map<any, boolean>>(() => observable(new Map()));
  const [filterState] = useState<IFilterState>(() => observable({ filterValue: '' }));

  const selected = getComputed(() => Array.from(selectedSubjects.values()).some(v => v));

  const revoke = useCallback(() => {
    props.onRevoke(getSelectedItems(selectedSubjects));
    selectedSubjects.clear();
  }, []);

  const teams = getFilteredTeams(grantedTeams, filterState.filterValue);
  const users = getFilteredUsers(grantedUsers, filterState.filterValue);
  const keys = teams.map(team => team.teamId).concat(users.map(user => user.userId));

  let tableInfoText: TLocalizationToken = 'connections_connection_access_admin_info';
  if (!keys.length) {
    if (filterState.filterValue) {
      tableInfoText = 'ui_search_no_result_placeholder';
    } else {
      tableInfoText = 'ui_no_items_placeholder';
    }
  }

  return styled(styles)(
    <Group box medium overflow>
      <container>
        <ConnectionAccessTableHeader filterState={filterState} disabled={disabled}>
          <Button disabled={disabled || !selected} mod={['outlined']} onClick={revoke}>
            {translate('ui_delete')}
          </Button>
          <Button disabled={disabled} mod={['unelevated']} onClick={props.onEdit}>
            {translate('ui_edit')}
          </Button>
        </ConnectionAccessTableHeader>
        <table-container>
          <Table keys={keys} selectedItems={selectedSubjects}>
            <ConnectionAccessTableInnerHeader disabled={disabled} />
            <TableBody>
              <TableItem item="tableInfo" selectDisabled>
                <TableColumnValue colSpan={5}>{translate(tableInfoText)}</TableColumnValue>
              </TableItem>
              {teams.map(team => (
                <ConnectionAccessTableItem
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
                <ConnectionAccessTableItem
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
        </table-container>
      </container>
    </Group>,
  );
});
