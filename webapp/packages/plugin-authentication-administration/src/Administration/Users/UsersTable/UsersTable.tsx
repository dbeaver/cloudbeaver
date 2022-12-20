/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ADMINISTRATION_TOOLS_PANEL_STYLES, IAdministrationItemSubItem } from '@cloudbeaver/core-administration';
import { AuthProvidersResource, AuthRolesResource, AUTH_PROVIDER_LOCAL_ID, UsersResource } from '@cloudbeaver/core-authentication';
import {
  Table, TableHeader, TableColumnHeader, TableBody, useResource, ToolsAction,
  ToolsPanel, Loader, useTranslate, useStyles,
  BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { CreateUser } from './CreateUser';
import { CreateUserService } from './CreateUserService';
import { UsersTableFilters } from './Filters/UsersTableFilters';
import { useUsersTableFilters } from './Filters/useUsersTableFilters';
import { User } from './User';
import { useUsersTable } from './useUsersTable';

const loaderStyle = css`
  ExceptionMessage {
    padding: 24px;
  }
`;

const styles = css`
  ToolsPanel {
    border-bottom: none;
    border-radius: inherit;
  }

  content {
    display: flex;
    flex-direction: column;
    overflow: auto;
    gap: 24px;
  }

  Group {
    padding: 0;
  }

  Table {
    width: 100%;
  }

  TableHeader {
    background: var(--theme-surface);
    position: sticky;
    top: 0;
    z-index: 1;
  }
  
  table-container {
    overflow: auto;
    height: 100%;
  }
`;

interface Props {
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}

export const UsersTable = observer<Props>(function UsersTable({ sub, param }) {
  const translate = useTranslate();
  const style = useStyles(styles, ADMINISTRATION_TOOLS_PANEL_STYLES, BASE_CONTAINERS_STYLES);

  const createUserService = useService(CreateUserService);

  const usersResource = useResource(UsersTable, UsersResource, CachedMapAllKey);
  const authProvidersResource = useResource(UsersTable, AuthProvidersResource, CachedMapAllKey);
  const authRolesResource = useResource(UsersTable, AuthRolesResource, undefined);

  const table = useUsersTable(usersResource.resource);
  const filters = useUsersTableFilters(table.users);

  const isLocalProviderAvailable = authProvidersResource.resource.has(AUTH_PROVIDER_LOCAL_ID);
  const create = param === 'create';
  const displayAuthRole = authRolesResource.data.length > 0;
  const keys = filters.filteredUsers.map(user => user.userId);

  return styled(style)(
    <ColoredContainer wrap gap parent overflow vertical>
      <Container gap vertical>
        <Container gap keepSize>
          <Group>
            <ToolsPanel>
              {isLocalProviderAvailable && (
                <ToolsAction
                  title={translate('authentication_administration_tools_add_tooltip')}
                  icon='add'
                  viewBox="0 0 24 24"
                  disabled={create && !!createUserService.user}
                  onClick={createUserService.create}
                >
                  {translate('ui_add')}
                </ToolsAction>
              )}
              <ToolsAction
                title={translate('authentication_administration_tools_refresh_tooltip')}
                icon='refresh'
                viewBox="0 0 24 24"
                onClick={table.update}
              >
                {translate('ui_refresh')}
              </ToolsAction>
              {/* {isLocalProviderAvailable && (
              <ToolsAction
                title={translate('authentication_administration_tools_delete_tooltip')}
                icon="trash"
                viewBox="0 0 24 24"
                disabled={!controller.itemsSelected}
                onClick={controller.delete}
              >
                {translate('ui_delete')}
              </ToolsAction>
            )} */}
            </ToolsPanel>
          </Group>
          <UsersTableFilters filters={filters} />
        </Container>

        <content>
          {create && createUserService.user && (
            <Group>
              <CreateUser user={createUserService.user} onCancel={createUserService.cancelCreate} />
            </Group>
          )}

          <Group>
            <Loader style={loaderStyle} state={[usersResource, authRolesResource]} overlay>
              <Table
                keys={keys}
                selectedItems={table.state.selected}
                expandedItems={table.state.expanded}
                size='big'
              >
                <TableHeader>
                  {/* {isLocalProviderAvailable && (
                  <TableColumnHeader min flex centerContent>
                    <TableSelect />
                  </TableColumnHeader>
                )} */}
                  <TableColumnHeader min />
                  <TableColumnHeader>{translate('authentication_user_name')}</TableColumnHeader>
                  {displayAuthRole && (
                    <TableColumnHeader>{translate('authentication_user_role')}</TableColumnHeader>
                  )}
                  <TableColumnHeader>{translate('authentication_user_team')}</TableColumnHeader>
                  <TableColumnHeader>{translate('authentication_user_enabled')}</TableColumnHeader>
                  <TableColumnHeader />
                </TableHeader>
                <TableBody>
                  {filters.filteredUsers.map(user => (
                    <User
                      key={user.userId}
                      user={user}
                      displayAuthRole={displayAuthRole}
                    // selectable={isLocalProviderAvailable}
                    />
                  ))}
                </TableBody>
              </Table>
            </Loader>
          </Group>
        </content>
      </Container>
    </ColoredContainer>
  );
});
