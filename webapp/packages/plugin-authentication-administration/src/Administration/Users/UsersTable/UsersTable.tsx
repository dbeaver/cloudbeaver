/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { useCallback, useMemo } from 'react';
import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

import { Checkbox, Link, Placeholder, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { AdminUserInfoFragment } from '@cloudbeaver/core-sdk';
import { UsersResource } from '@cloudbeaver/core-authentication';
import { NotificationService } from '@cloudbeaver/core-events';
import { ADMINISTRATION_TABLE_DEFAULT_ROW_HEIGHT, AdministrationTableStyles } from '@cloudbeaver/core-administration';
import { DataGrid, useCreateGridReactiveValue } from '@cloudbeaver/plugin-data-grid';

import { UsersTableOptionsPanelService } from './UsersTableOptionsPanelService.js';
import { UsersAdministrationService } from '../UsersAdministrationService.js';
import { Command } from '@dbeaver/ui-kit';

interface Props {
  users: AdminUserInfoFragment[];
  isManageable: boolean;
  displayAuthRole: boolean;
  onLoadMore?: () => void;
}

const ID_COLUMN = { key: 'id', label: 'authentication_user_name' };
const ROLE_COLUMN = { key: 'role', label: 'authentication_user_role' };
const TEAM_COLUMN = { key: 'team', label: 'authentication_user_team' };
const ENABLED_COLUMN = { key: 'enabled', label: 'authentication_user_enabled' };
const AUTH_COLUMN = { key: 'auth', label: 'authentication_administration_user_auth_methods' };
const LAST_LOGIN_COLUMN = { key: 'lastLogin', label: 'plugin_authentication_administration_user_last_login' };

const COLUMNS = [ID_COLUMN, TEAM_COLUMN, ENABLED_COLUMN, AUTH_COLUMN, LAST_LOGIN_COLUMN];

export const UsersTable = observer<Props>(function UsersTable({ users, isManageable, displayAuthRole, onLoadMore }) {
  const translate = useTranslate();
  const styles = useS(AdministrationTableStyles);
  const notificationService = useService(NotificationService);
  const usersTableOptionsPanelService = useService(UsersTableOptionsPanelService);
  const usersAdministrationService = useService(UsersAdministrationService);
  const usersResource = useService(UsersResource);

  const columns = useMemo(() => {
    if (displayAuthRole) {
      const result = [...COLUMNS];
      const teamIndex = COLUMNS.findIndex(column => column.key === TEAM_COLUMN.key);

      result.splice(teamIndex + 1, 0, ROLE_COLUMN);
      return result;
    }

    return COLUMNS;
  }, [displayAuthRole]);

  const enableUser = useCallback(
    async (userId: AdminUserInfoFragment['userId'], enabled: boolean) => {
      try {
        await usersResource.enableUser(userId, enabled);
      } catch (error: any) {
        notificationService.logException(error);
      }
    },
    [usersResource, notificationService],
  );

  const columnsCount = useCreateGridReactiveValue(() => columns.length, null, [columns]);
  const rowsCount = useCreateGridReactiveValue(
    () => users.length,
    onValueChange => reaction(() => users.length, onValueChange),
    [users],
  );

  function getCell(rowIdx: number, colIdx: number) {
    const row = users[rowIdx];
    const column = columns[colIdx];

    if (!row || !column) {
      return null;
    }

    if (column.key === ID_COLUMN.key) {
      return (
        <Command
          render={<div />}
          tabIndex={0}
          title={row.userId}
          className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2 tw:outline-none"
          onClick={() => usersTableOptionsPanelService.open(row.userId)}
        >
          <Link truncate>{row.userId}</Link>
        </Command>
      );
    }

    if (column.key === ROLE_COLUMN.key) {
      const role = row.authRole ?? '';
      return <span title={role}>{role}</span>;
    }

    if (column.key === TEAM_COLUMN.key) {
      const teams = row.grantedTeams.join(', ');
      return <span title={teams}>{teams}</span>;
    }

    if (column.key === ENABLED_COLUMN.key) {
      const isActive = usersResource.isActiveUser(row.userId);
      const disabled = isActive || !isManageable;
      const title = isActive ? translate('administration_teams_team_granted_users_permission_denied') : undefined;

      return (
        <Checkbox
          className="tw:flex tw:w-full tw:h-full tw:items-center tw:justify-center"
          aria-label={translate('authentication_user_enabled')}
          tabIndex={0}
          title={title}
          checked={row.enabled}
          disabled={disabled}
          onChange={() => enableUser(row.userId, !row.enabled)}
        />
      );
    }

    if (column.key === AUTH_COLUMN.key) {
      return (
        <div className="tw:flex tw:gap-2 tw:items-center">
          <Placeholder container={usersAdministrationService.userDetailsInfoPlaceholder} user={row} />
        </div>
      );
    }

    if (column.key === LAST_LOGIN_COLUMN.key) {
      const lastLoginFullTime = row.lastLoginTime ? new Date(row.lastLoginTime).toLocaleString() : '-';
      const lastLoginDate = row.lastLoginTime ? new Date(row.lastLoginTime).toLocaleDateString() : '-';
      return <span title={lastLoginFullTime}>{lastLoginDate}</span>;
    }

    return null;
  }

  const cell = useCreateGridReactiveValue(getCell, (onValueChange, rowIdx, colIdx) => reaction(() => getCell(rowIdx, colIdx), onValueChange), [
    columns,
    users,
    usersResource,
    usersTableOptionsPanelService,
    usersAdministrationService,
    enableUser,
  ]);

  function getHeaderText(colIdx: number) {
    return translate(columns[colIdx]?.label) ?? '';
  }

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    columns,
    translate,
  ]);

  return (
    <div className="tw:overflow-auto tw:h-full tw:max-w-full theme-text-on-surface">
      <DataGrid
        columnCount={columnsCount}
        rowCount={rowsCount}
        getHeaderResizable={colIdx => colIdx > 0}
        getRowHeight={() => ADMINISTRATION_TABLE_DEFAULT_ROW_HEIGHT}
        getHeaderPinned={colIdx => colIdx <= 0}
        headerText={headerText}
        cell={cell}
        className={s(styles, { table: true })}
        onScrollToBottom={onLoadMore}
      />
    </div>
  );
});
