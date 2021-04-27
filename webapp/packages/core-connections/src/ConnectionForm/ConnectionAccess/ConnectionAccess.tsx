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
  useMapResource,
  BASE_CONTAINERS_STYLES,
  ColoredContainer,
  Group
} from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { useStyles, composes } from '@cloudbeaver/core-theming';

import type { IConnectionFormProps } from '../IConnectionFormProps';
import { useConnectionAccessState } from './useConnectionAccessState';

const styles = composes(
  css`
    Table {
      composes: theme-background-surface theme-text-on-surface from global;
    }
  `,
  css`
    ColoredContainer {
      flex: 1;
      overflow: auto;
    }
    Group {
      max-height: 100%;
      position: relative;
      overflow: auto !important;
    }
    Table {
      flex: 1;
    }
  `
);

export const ConnectionAccess: TabContainerPanelComponent<IConnectionFormProps> = observer(function ConnectionAccess({
  tabId,
  state: formState,
}) {
  const { state, load, select } = useConnectionAccessState(formState);
  const style = useStyles(styles, BASE_CONTAINERS_STYLES);
  const translate = useTranslate();

  const users = useMapResource(UsersResource, null, {
    onLoad: resource => resource.loadAll(),
  });

  const roles = useMapResource(RolesResource, null, {
    onLoad: resource => resource.loadAll(),
  });

  const { selected } = useTab(tabId, load);
  const loading = users.isLoading() || roles.isLoading() || state.loading;
  const disabled = loading || !state.loaded || formState.disabled;

  if (!selected) {
    return null;
  }

  if (users.resource.values.length === 0 && roles.resource.values.length) {
    return styled(style)(
      <ColoredContainer parent>
        <Group keepSize large>
          <TextPlaceholder>{translate('connections_administration_connection_access_empty')}</TextPlaceholder>
        </Group>
      </ColoredContainer>
    );
  }

  return styled(style)(
    <ColoredContainer parent>
      <Group box keepSize large>
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
        <Loader key="overlay" loading={loading} overlay />
      </Group>
    </ColoredContainer>
  );
});
