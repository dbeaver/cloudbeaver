/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Button, CommonDialogBody, CommonDialogFooter, CommonDialogHeader, CommonDialogWrapper, useTranslate } from '@cloudbeaver/core-blocks';
import type { DialogComponent } from '@cloudbeaver/core-dialogs';

import { UsersTableFiltersDetails } from './UsersTableFiltersDetails.js';
import type { IUserFilters } from './useUsersTableFilters.js';

export const UsersTableFiltersDialog: DialogComponent<IUserFilters> = function UsersTableFiltersDialog({ payload: filters, rejectDialog }) {
  const translate = useTranslate();

  return (
    <CommonDialogWrapper size="medium" aria-label={translate('authentication_administration_users_filters_filter_label')} fixedWidth freeHeight>
      <CommonDialogHeader title="authentication_administration_users_filters_filter_label" onReject={rejectDialog} />
      <CommonDialogBody>
        <UsersTableFiltersDetails filters={filters} />
      </CommonDialogBody>
      <CommonDialogFooter>
        <Button type="button" variant="secondary" onClick={() => rejectDialog()}>
          {translate('ui_close')}
        </Button>
      </CommonDialogFooter>
    </CommonDialogWrapper>
  );
};
