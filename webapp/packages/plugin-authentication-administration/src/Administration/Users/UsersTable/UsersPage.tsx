/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import styled from 'reshadow';

import { ADMINISTRATION_TOOLS_PANEL_STYLES, IAdministrationItemSubItem } from '@cloudbeaver/core-administration';
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
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}

export const UsersPage = observer<Props>(function UsersPage({ sub, param }) {
  const style = useStyles(ADMINISTRATION_TOOLS_PANEL_STYLES);
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

  return styled(style)(
    <ColoredContainer vertical wrap gap parent maximum>
      <Group keepSize box maximum>
        <UsersAdministrationToolsPanel onUpdate={table.update} />
      </Group>

      <Group keepSize box maximum>
        <UsersTableFilters filters={filters} />
      </Group>

      <Container overflow gap maximum>
        {create && createUserService.state && !userManagementDisabled && (
          <Group box>
            <CreateUser state={createUserService.state} onCancel={createUserService.cancelCreate} />
          </Group>
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
            onLoadMore={table.loadMore}
          />
        </Group>
      </Container>
    </ColoredContainer>,
  );
});
