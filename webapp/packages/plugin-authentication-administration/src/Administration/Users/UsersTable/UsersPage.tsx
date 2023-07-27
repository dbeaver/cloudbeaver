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
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource, AuthRolesResource } from '@cloudbeaver/core-authentication';
import { ColoredContainer, Container, Group, ToolsAction, ToolsPanel, useResource, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import { CreateUser } from './CreateUser';
import { CreateUserService } from './CreateUserService';
import { UsersTableFilters } from './Filters/UsersTableFilters';
import { useUsersTableFilters } from './Filters/useUsersTableFilters';
import { UsersTable } from './UsersTable';
import { useUsersTable } from './useUsersTable';

const styles = css`
  ToolsPanel {
    border-bottom: none;
    border-radius: inherit;
  }
`;

interface Props {
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}

export const UsersPage = observer<Props>(function UsersPage({ sub, param }) {
  const translate = useTranslate();
  const style = useStyles(styles, ADMINISTRATION_TOOLS_PANEL_STYLES);

  const createUserService = useService(CreateUserService);

  const authProvidersResource = useResource(UsersPage, AuthProvidersResource, CachedMapAllKey);
  const authRolesResource = useResource(UsersPage, AuthRolesResource, undefined);

  const filters = useUsersTableFilters();
  const table = useUsersTable(filters);

  const isLocalProviderAvailable = authProvidersResource.resource.has(AUTH_PROVIDER_LOCAL_ID);
  const create = param === 'create';
  const displayAuthRole = authRolesResource.data.length > 0;
  const loading = authRolesResource.isLoading() || table.loadableState.isLoading();

  return styled(style)(
    <ColoredContainer vertical wrap gap parent>
      <Group box keepSize>
        <ToolsPanel>
          {isLocalProviderAvailable && (
            <ToolsAction
              title={translate('authentication_administration_tools_add_tooltip')}
              icon="add"
              viewBox="0 0 24 24"
              disabled={create && !!createUserService.user}
              onClick={createUserService.create}
            >
              {translate('ui_add')}
            </ToolsAction>
          )}
          <ToolsAction
            title={translate('authentication_administration_tools_refresh_tooltip')}
            icon="refresh"
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
          <Group box>
            <CreateUser user={createUserService.user} onCancel={createUserService.cancelCreate} />
          </Group>
        )}

        <Group boxNoOverflow>
          <UsersTable
            users={table.users}
            selectedItems={table.state.selected}
            expandedItems={table.state.expanded}
            displayAuthRole={displayAuthRole}
            loading={loading}
            hasMore={table.hasMore}
            onLoadMore={table.loadMore}
          />
        </Group>
      </Container>
    </ColoredContainer>,
  );
});
