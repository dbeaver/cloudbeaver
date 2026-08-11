/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useContext } from 'react';

import { IconOrImage, useTranslate } from '@cloudbeaver/core-blocks';

import type { IUsersActionButtonProps } from '../../UsersAdministrationService.js';
import { FiltersActionButton } from './FiltersActionButton.js';
import { UsersTableFiltersOpenContext } from './UsersTableFiltersOpenContext.js';

export const UsersTableFilterButton = observer<IUsersActionButtonProps>(function UsersTableFilterButton() {
  const translate = useTranslate();
  const openContext = useContext(UsersTableFiltersOpenContext);

  if (!openContext) {
    throw new Error('UsersTableFilterButton must be rendered within UsersTableFiltersOpenContext');
  }

  const label = translate('authentication_administration_users_filters_filter_label');

  return (
    <FiltersActionButton active={openContext.open} aria-label={label} title={label} onClick={openContext.onToggle}>
      <IconOrImage className="tw:w-full tw:h-full" icon="filter" />
    </FiltersActionButton>
  );
});
