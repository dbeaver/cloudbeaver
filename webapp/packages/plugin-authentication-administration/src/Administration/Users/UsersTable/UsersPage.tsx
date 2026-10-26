/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AuthRolesResource } from '@cloudbeaver/core-authentication';
import { Group, Loader, Placeholder, s, useAutoLoad, useResource, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { MenuBar } from '@cloudbeaver/core-ui';
import { useMenu } from '@cloudbeaver/core-view';
import { Spinner } from '@dbeaver/ui-kit';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { CreateUserService } from './CreateUserService.js';
import { UsersTableFilters } from './Filters/UsersTableFilters.js';
import { useUsersTableFilters } from './Filters/useUsersTableFilters.js';
import { UsersAdministrationToolsPanel } from './UsersAdministrationToolsPanel.js';
import { useUsersTable } from './useUsersTable.js';
import { UsersTable } from './UsersTable.js';
import { UsersAdministrationService } from '../UsersAdministrationService.js';
import style from '../shared/UsersAdministration.module.css';
import toolsPanelStyles from './UsersAdministrationToolsPanel.module.css';
import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION.js';
import { UsersAdministrationHeaderActions } from '../UsersAdministrationHeaderActions.js';

interface Props {
  param?: string | null;
}

export const UsersPage = observer<Props>(function UsersPage({ param }) {
  const createUserService = useService(CreateUserService);
  const authRolesResource = useResource(UsersPage, AuthRolesResource, undefined);
  const administrationUsersManagementService = useService(AdministrationUsersManagementService);
  const usersAdministrationService = useService(UsersAdministrationService);
  const styles = useS(style, toolsPanelStyles);
  const menu = useMenu({ menu: MENU_USERS_ADMINISTRATION });

  useAutoLoad(UsersPage, administrationUsersManagementService.loaders);
  const filters = useUsersTableFilters();
  const table = useUsersTable(filters);

  const displayAuthRole = authRolesResource.data.length > 0;
  const loading = table.loadableState.isLoading();
  const isManageable = !administrationUsersManagementService.externalUserProviderEnabled;

  return (
    <div className={s(styles, { page: true })}>
      <UsersAdministrationHeaderActions>
        <div className={s(styles, { headerActions: true })}>
          <Loader suspense inline>
            <Placeholder container={usersAdministrationService.statisticsPlaceholder} />
          </Loader>
          <MenuBar menu={menu} className={s(styles, { menuBar: true })} compact={false} />
        </div>
      </UsersAdministrationHeaderActions>
      {usersAdministrationService.informationPlaceholder.getDisplayed({}).length > 0 && (
        <Group keepSize box maximum>
          <Placeholder container={usersAdministrationService.informationPlaceholder} />
        </Group>
      )}

      <UsersTableFilters filters={filters} actionsSlot={<UsersAdministrationToolsPanel onUpdate={table.update} />} />

      <Placeholder container={createUserService.toolsContainer} param={param} />

      <div className={s(styles, { tableContainer: true })}>
        <UsersTable users={table.users} isManageable={isManageable} displayAuthRole={displayAuthRole} onLoadMore={table.loadMore} />
        <Spinner className="tw:absolute tw:bottom-4 tw:right-8" active={loading} />
      </div>
    </div>
  );
});
