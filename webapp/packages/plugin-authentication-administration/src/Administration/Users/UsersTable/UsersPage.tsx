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
import { ColoredContainer, Container, Group, Placeholder, useResource, useStyles } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

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

  const filters = useUsersTableFilters();
  const table = useUsersTable(filters);

  const create = param === 'create';
  const displayAuthRole = authRolesResource.data.length > 0;
  const loading = authRolesResource.isLoading() || table.loadableState.isLoading();

  return styled(style)(
    <ColoredContainer vertical wrap gap parent>
      <Group box keepSize>
        <UsersAdministrationToolsPanel onUpdate={table.update} />
      </Group>

      <Container overflow gap>
        {create && createUserService.state && (
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
    </ColoredContainer>,
  );
});
