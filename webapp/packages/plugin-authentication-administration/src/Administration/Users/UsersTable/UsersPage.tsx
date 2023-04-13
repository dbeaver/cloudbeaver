/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ADMINISTRATION_TOOLS_PANEL_STYLES, IAdministrationItemSubItem } from '@cloudbeaver/core-administration';
import { AuthProvidersResource, AuthRolesResource, AUTH_PROVIDER_LOCAL_ID, UsersResource } from '@cloudbeaver/core-authentication';
import {
  useResource, ToolsAction,
  ToolsPanel, Loader, useTranslate, useStyles,
  BASE_CONTAINERS_STYLES, ColoredContainer, Container, Group
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { CreateUser } from './CreateUser';
import { CreateUserService } from './CreateUserService';
import { UsersTableFilters } from './Filters/UsersTableFilters';
import { useUsersTableFilters } from './Filters/useUsersTableFilters';
import { UsersTable } from './UsersTable';
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
`;

interface Props {
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}

export const UsersPage = observer<Props>(function UsersPage({ sub, param }) {
  const translate = useTranslate();
  const style = useStyles(BASE_CONTAINERS_STYLES, styles, ADMINISTRATION_TOOLS_PANEL_STYLES);

  const createUserService = useService(CreateUserService);

  const usersResource = useResource(UsersPage, UsersResource, CachedMapAllKey);
  const authProvidersResource = useResource(UsersPage, AuthProvidersResource, CachedMapAllKey);
  const authRolesResource = useResource(UsersPage, AuthRolesResource, undefined);

  const table = useUsersTable(usersResource.resource);
  const filters = useUsersTableFilters(table.users);

  const isLocalProviderAvailable = authProvidersResource.resource.has(AUTH_PROVIDER_LOCAL_ID);
  const create = param === 'create';
  const displayAuthRole = authRolesResource.data.length > 0;
  const keys = filters.filteredUsers.map(user => user.userId);

  return styled(style)(
    <ColoredContainer vertical wrap gap parent>
      <Group box keepSize>
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
      <Group box keepSize>
        <UsersTableFilters filters={filters} />
      </Group>

      <Container overflow gap>
        {create && createUserService.user && (
          <Group>
            <CreateUser user={createUserService.user} onCancel={createUserService.cancelCreate} />
          </Group>
        )}

        <Group box='no-overflow'>
          <Loader style={loaderStyle} state={[usersResource, authRolesResource]} overlay>
            <UsersTable
              keys={keys}
              selectedItems={table.state.selected}
              expandedItems={table.state.expanded}
              users={filters.filteredUsers}
              displayAuthRole={displayAuthRole}
            />
          </Loader>
        </Group>
      </Container>
    </ColoredContainer>
  );
});
