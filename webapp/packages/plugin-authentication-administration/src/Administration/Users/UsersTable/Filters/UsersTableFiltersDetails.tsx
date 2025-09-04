/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { AuthRolesResource } from '@cloudbeaver/core-authentication';
import { Select, useResource, useTranslate } from '@cloudbeaver/core-blocks';

import { type IUserFilters, USER_ROLE_ALL, USER_STATUSES } from './useUsersTableFilters.js';

interface Props {
  filters: IUserFilters;
}

export const UsersTableFiltersDetails = observer<Props>(function UsersTableFiltersDetails({ filters }) {
  const translate = useTranslate();
  const authRolesResource = useResource(UsersTableFiltersDetails, AuthRolesResource, undefined);

  return (
    <div className="tw:flex tw:gap-4">
      <Select
        value={filters.status}
        items={USER_STATUSES}
        valueSelector={value => translate(value.label)}
        keySelector={value => value.value}
        className="tw:min-w-[172px]"
        onSelect={filters.setStatus}
      >
        {translate('authentication_user_status')}
      </Select>
      {!!authRolesResource.data.length && (
        <Select items={[...authRolesResource.data, USER_ROLE_ALL]} value={filters.role} className="tw:min-w-[172px]" onSelect={filters.setRole}>
          {translate('authentication_user_role')}
        </Select>
      )}
    </div>
  );
});
