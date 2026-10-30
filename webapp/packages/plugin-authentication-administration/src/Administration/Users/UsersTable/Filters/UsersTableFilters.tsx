/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { Filter, Placeholder, s, ToolbarActions, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';

import { UsersAdministrationService } from '../../UsersAdministrationService.js';
import styles from './UsersTableFilters.module.css';
import { UsersTableFiltersDialog } from './UsersTableFiltersDialog.js';
import { UsersTableFiltersOpenContext } from './UsersTableFiltersOpenContext.js';
import { type IUserFilters } from './useUsersTableFilters.js';
import { UsersTableFilterButton } from './UsersTableFilterButton.js';

interface Props {
  filters: IUserFilters;
  actionsSlot?: ReactNode;
}

export const UsersTableFilters = observer<Props>(function UsersTableFilters({ filters, actionsSlot }) {
  const translate = useTranslate();
  const style = useS(styles);
  const usersAdministrationService = useService(UsersAdministrationService);
  const commonDialogService = useService(CommonDialogService);

  const [open, setOpen] = useState(false);
  const onToggle = useCallback(async () => {
    setOpen(true);
    try {
      await commonDialogService.open(UsersTableFiltersDialog, filters);
    } finally {
      setOpen(false);
    }
  }, [commonDialogService, filters]);
  const openContext = useMemo(() => ({ open, onToggle }), [open, onToggle]);

  return (
    <div className={s(style, { filters: true })}>
      <div className={s(style, { filterContainer: true })}>
        <Filter
          className={s(style, { filter: true })}
          placeholder={translate('authentication_administration_users_filters_search_placeholder')}
          value={filters.search}
          onChange={filters.setSearch}
        />
        <UsersTableFiltersOpenContext.Provider value={openContext}>
          <UsersTableFilterButton filters={filters} />
          <ToolbarActions className="tw:ml-auto">
            {actionsSlot}
            <Placeholder container={usersAdministrationService.actionButtonsPlaceholder} filters={filters} />
          </ToolbarActions>
        </UsersTableFiltersOpenContext.Provider>
      </div>
    </div>
  );
});
