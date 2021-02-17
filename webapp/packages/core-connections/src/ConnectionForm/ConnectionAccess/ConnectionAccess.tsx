/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { RolesResource, UsersResource } from '@cloudbeaver/core-authentication';
import {
  Table,
  TableHeader,
  TableColumnHeader,
  TableBody,
  TableItem,
  TableColumnValue,
  TableItemSelect,
  TextPlaceholder,
  Loader,
  useTab,
  TabContainerPanelComponent,
  useMapResource
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import type { IConnectionFormTabProps } from '../ConnectionFormService';
import { useConnectionAccessState } from './useConnectionAccessState';

const styles = composes(
  css`
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    box {
      position: relative;
      display: flex;
      flex: 1;
    }
    Table {
      flex: 1;
    }
    TableColumnHeader {
      border-top: solid 1px;
    }
  `
);

export const ConnectionAccess: TabContainerPanelComponent<IConnectionFormTabProps> = observer(function ConnectionAccess({
  tabId,
  data,
}) {
  const { state, load, select } = useConnectionAccessState(data);
  const style = useStyles(styles);
  const translate = useTranslate();

  const users = useMapResource(UsersResource, null, {
    onLoad: resource => resource.loadAll(),
  });

  const roles = useMapResource(RolesResource, null, {
    onLoad: resource => resource.loadAll(),
  });

  const { selected } = useTab(tabId, load);
  const disabled = users.isLoading() || roles.isLoading() || state.loading;

  if (!selected) {
    return null;
  }

  if (disabled) {
    return styled(style)(
      <box as='div'>
        <Loader key="static" />
      </box>
    );
  }

  if (users.resource.values.length === 0 && roles.resource.values.length) {
    return styled(style)(
      <box as='div'>
        <TextPlaceholder>{translate('connections_administration_connection_access_empty')}</TextPlaceholder>
      </box>
    );
  }

  return styled(style)(
    <box as='div'>
      <Table selectedItems={state.selectedSubjects} onSelect={select}>
        <TableHeader>
          <TableColumnHeader min />
          <TableColumnHeader>{translate('connections_connection_name')}</TableColumnHeader>
          <TableColumnHeader />
        </TableHeader>
        <TableBody>
          {roles.resource.values.map(role => (
            <TableItem key={role.roleId} item={role.roleId} selectDisabled={disabled}>
              <TableColumnValue centerContent flex>
                <TableItemSelect disabled={disabled} />
              </TableColumnValue>
              <TableColumnValue>{role.roleName}</TableColumnValue>
              <TableColumnValue />
            </TableItem>
          ))}
          {users.resource.values.map(user => (
            <TableItem key={user.userId} item={user.userId} selectDisabled={disabled}>
              <TableColumnValue centerContent flex>
                <TableItemSelect disabled={disabled} />
              </TableColumnValue>
              <TableColumnValue>{user.userId}</TableColumnValue>
              <TableColumnValue />
            </TableItem>
          ))}
        </TableBody>
      </Table>
      <Loader key="overlay" loading={disabled} overlay />
    </box>
  );
});
