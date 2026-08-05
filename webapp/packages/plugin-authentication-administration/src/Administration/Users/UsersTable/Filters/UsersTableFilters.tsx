/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { ExportButton, Filter, Group, IconOrImage, type IExportFilterEntry, Loader, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { GlobalConstants, objectToFormFields, submitForm } from '@cloudbeaver/core-utils';

import styles from './UsersTableFilters.module.css';
import { UsersTableFiltersDetails } from './UsersTableFiltersDetails.js';
import { type IUserFilters, USER_ROLE_ALL, USER_STATUSES } from './useUsersTableFilters.js';

interface Props {
  filters: IUserFilters;
}

export const UsersTableFilters = observer<Props>(function UsersTableFilters({ filters }) {
  const translate = useTranslate();
  const style = useS(styles);

  const [open, setOpen] = useState(false);

  const exportFilters: IExportFilterEntry[] = [];
  const search = filters.search.trim();
  if (search) {
    exportFilters.push({ key: 'search', label: 'authentication_administration_users_export_filter_search', value: search });
  }
  if (filters.status !== 'all') {
    const status = USER_STATUSES.find(item => item.value === filters.status);
    exportFilters.push({ key: 'status', label: 'authentication_user_status', value: status ? translate(status.label) : filters.status });
  }
  if (filters.role !== USER_ROLE_ALL) {
    exportFilters.push({ key: 'role', label: 'authentication_user_role', value: filters.role });
  }

  function exportUsers() {
    const options: Record<string, unknown> = {};
    const userIdMask = filters.search.trim();

    if (userIdMask) {
      options['userIdMask'] = userIdMask;
    }
    if (filters.status !== 'all') {
      options['status'] = filters.status === 'true';
    }
    if (filters.role !== USER_ROLE_ALL) {
      options['authRole'] = filters.role;
    }

    submitForm(GlobalConstants.absoluteServiceUrl('admin', 'export-users-csv'), objectToFormFields(options));
  }

  return (
    <Group parent compact gap>
      <div className={s(style, { filterContainer: true })}>
        <Filter
          className={s(style, { filter: true })}
          placeholder={translate('authentication_administration_users_filters_search_placeholder')}
          value={filters.search}
          onChange={filters.setSearch}
        />
        <div className={s(style, { actions: true })}>
          <div className={s(style, { buttonBox: true })}>
            <div className={s(style, { button: true, buttonActive: open })} onClick={() => setOpen(!open)}>
              <IconOrImage className={s(style, { iconOrImage: true })} icon="filter" />
            </div>
          </div>
          <div className={s(style, { buttonBox: true })}>
            <ExportButton
              filters={exportFilters}
              title="authentication_administration_users_export_title"
              confirmTitle="authentication_administration_users_export_confirm_title"
              descriptionWithFilters="authentication_administration_users_export_confirm_with_filters"
              descriptionDefault="authentication_administration_users_export_confirm_default"
              exportHandler={exportUsers}
            />
          </div>
        </div>
      </div>

      {open && (
        <Loader suspense inline>
          <UsersTableFiltersDetails filters={filters} />
        </Loader>
      )}
    </Group>
  );
});
