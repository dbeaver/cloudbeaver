/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { Filter, Group, IconOrImage, Loader, Placeholder, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { UsersAdministrationService } from '../../UsersAdministrationService.js';
import styles from './UsersTableFilters.module.css';
import { UsersTableFiltersDetails } from './UsersTableFiltersDetails.js';
import { type IUserFilters } from './useUsersTableFilters.js';
import { IconButton } from '@dbeaver/ui-kit';

interface Props {
  filters: IUserFilters;
}

export const UsersTableFilters = observer<Props>(function UsersTableFilters({ filters }) {
  const translate = useTranslate();
  const style = useS(styles);
  const usersAdministrationService = useService(UsersAdministrationService);

  const [open, setOpen] = useState(false);

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
            <IconButton
              className={s(style, { button: true, buttonActive: open })}
              size="small"
              aria-label={translate('authentication_administration_users_filters_filter_label')}
              onClick={() => setOpen(!open)}
            >
              <IconOrImage className={s(style, { iconOrImage: true })} icon="filter" />
            </IconButton>
          </div>
          {usersAdministrationService.exportPlaceholder.getDisplayed({ filters }).length > 0 && (
            <div className={s(style, { buttonBox: true })}>
              <Placeholder container={usersAdministrationService.exportPlaceholder} filters={filters} />
            </div>
          )}
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
