/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { AuthRolesResource } from '@cloudbeaver/core-authentication';
import { ColoredContainer, Container, Group, Placeholder, useAutoLoad, useResource, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService';
import { CreateUser } from './CreateUser';
import { CreateUserService } from './CreateUserService';
import { UsersTableFilters } from './Filters/UsersTableFilters';
import { useUsersTableFilters } from './Filters/useUsersTableFilters';
import { UsersAdministrationToolsPanel } from './UsersAdministrationToolsPanel';
import { UsersTable } from './UsersTable';
import { useUsersTable } from './useUsersTable';

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
  const userManagementDisabled = administrationUsersManagementService.externalUserProviderEnabled;

  return (
    <ColoredContainer vertical wrap gap parent>
      <Group box keepSize>
        <UsersAdministrationToolsPanel onUpdate={table.update} />
      </Group>

      <Container overflow gap>
        {create && createUserService.state && !userManagementDisabled && (
          <Group box>
            <CreateUser state={createUserService.state} onCancel={createUserService.cancelCreate} />
          </Group>
        )}

        <Placeholder container={createUserService.toolsContainer} param={param} />

        <Group box>
          <UsersTableFilters filters={filters} />
        </Group>

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
    </ColoredContainer>
  );
});
