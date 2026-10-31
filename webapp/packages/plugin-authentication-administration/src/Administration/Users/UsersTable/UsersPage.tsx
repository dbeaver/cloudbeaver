/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AuthRolesResource } from '@cloudbeaver/core-authentication';
import { AdministrationPageHeader, AdministrationPageContent, AdministrationPageTitle } from '@cloudbeaver/core-administration';
import { Group, Placeholder, s, Translate, useAutoLoad, useResource, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { Spinner } from '@dbeaver/ui-kit';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { CreateUserService } from './CreateUserService.js';
import { UsersTableFilters } from './Filters/UsersTableFilters.js';
import { useUsersTableFilters } from './Filters/useUsersTableFilters.js';
import { RefreshUsersButton } from './RefreshUsersButton.js';
import { useUsersTable } from './useUsersTable.js';
import { UsersTable } from './UsersTable.js';
import { UsersAdministrationService } from '../UsersAdministrationService.js';
import style from '../shared/UsersAdministration.module.css';

interface Props {
  param?: string | null;
}

export const UsersPage = observer<Props>(function UsersPage({ param }) {
  const createUserService = useService(CreateUserService);
  const authRolesResource = useResource(UsersPage, AuthRolesResource, undefined);
  const administrationUsersManagementService = useService(AdministrationUsersManagementService);
  const usersAdministrationService = useService(UsersAdministrationService);
  const styles = useS(style);

  useAutoLoad(UsersPage, administrationUsersManagementService.loaders);
  const filters = useUsersTableFilters();
  const table = useUsersTable(filters);

  const displayAuthRole = authRolesResource.data.length > 0;
  const loading = table.loadableState.isLoading();
  const isManageable = !administrationUsersManagementService.externalUserProviderEnabled;

  return (
    <>
      <AdministrationPageHeader actionsSlot={<Placeholder container={usersAdministrationService.actions} />}>
        <AdministrationPageTitle docLink={WEBSITE_LINKS.USERS_DOCUMENTATION_PAGE}>
          <Translate token="authentication_administration_item_users" />
        </AdministrationPageTitle>
      </AdministrationPageHeader>
      <AdministrationPageContent>
        {usersAdministrationService.informationPlaceholder.getDisplayed({}).length > 0 && (
          <Group keepSize box maximum>
            <Placeholder container={usersAdministrationService.informationPlaceholder} />
          </Group>
        )}

        <UsersTableFilters filters={filters} actionsSlot={<RefreshUsersButton onUpdate={table.update} />} />

        <Placeholder container={createUserService.toolsContainer} param={param} />

        <div className={s(styles, { tableContainer: true })}>
          <UsersTable users={table.users} isManageable={isManageable} displayAuthRole={displayAuthRole} onLoadMore={table.loadMore} />
          <Spinner className="tw:absolute tw:bottom-4 tw:right-8" active={loading} />
        </div>
      </AdministrationPageContent>
    </>
  );
});
