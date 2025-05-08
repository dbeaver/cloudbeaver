/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AuthRolesResource } from '@cloudbeaver/core-authentication';
import { ColoredContainer, Container, Group, Placeholder, useAutoLoad, useResource } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { CreateUser } from './CreateUser.js';
import { CreateUserService } from './CreateUserService.js';
import { UsersTableFilters } from './Filters/UsersTableFilters.js';
import { useUsersTableFilters } from './Filters/useUsersTableFilters.js';
import { UsersAdministrationToolsPanel } from './UsersAdministrationToolsPanel.js';
import { UsersTable } from './UsersTable.js';
import { useUsersTable } from './useUsersTable.js';

interface Props {
  param?: string | null;
}

export const UsersPage = observer<Props>(function UsersPage({ param }) {
  const createUserService = useService(CreateUserService);
  const authRolesResource = useResource(UsersPage, AuthRolesResource, undefined);
  const administrationUsersManagementService = useService(AdministrationUsersManagementService);

  useAutoLoad(UsersPage, administrationUsersManagementService.loaders);
  const filters = useUsersTableFilters();
  const table = useUsersTable(filters);

  const create = param === 'create';
  const displayAuthRole = authRolesResource.data.length > 0;
  const loading = authRolesResource.isLoading() || table.loadableState.isLoading();
  const isManageable = !administrationUsersManagementService.externalUserProviderEnabled;

  return (
    <ColoredContainer vertical wrap gap parent maximum>
      <Group keepSize box>
        <UsersAdministrationToolsPanel onUpdate={table.update} />
      </Group>

      <Group keepSize box maximum>
        <UsersTableFilters filters={filters} />
      </Group>

      <Container overflow gap maximum>
        {create && createUserService.state && isManageable && (
          <CreateUser state={createUserService.state} onCancel={createUserService.cancelCreate} />
        )}

        <Placeholder container={createUserService.toolsContainer} param={param} />

        <Group boxNoOverflow>
          <UsersTable
            users={table.users}
            selectedItems={table.state.selected}
            expandedItems={table.state.expanded}
            displayAuthRole={displayAuthRole}
            loading={loading}
            hasMore={table.hasMore}
            isManageable={isManageable}
            onLoadMore={table.loadMore}
          />
        </Group>
      </Container>
    </ColoredContainer>
  );
});
