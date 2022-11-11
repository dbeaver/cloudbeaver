/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useState } from 'react';
import styled, { css, use } from 'reshadow';

import { AuthRolesResource } from '@cloudbeaver/core-authentication';
import { BASE_CONTAINERS_STYLES, Combobox, Filter, Group, IconOrImage, useDataResource, useStyles, useTranslate } from '@cloudbeaver/core-blocks';

import { IUserFilters, USER_ROLE_ALL, USER_STATUSES } from './useUsersTableFilters';

const styles = css`
  filter-container {
    display: flex;
    gap: 12px;
  }

  Filter {
    flex: 1;
  }

  actions {
    composes: theme-form-element-radius theme-background-surface theme-text-on-surface theme theme-border-color-background from global;
    box-sizing: border-box;
    border: 2px solid;
    height: 32px;
  }

  button {
    position: relative;
    box-sizing: border-box;
    background: inherit;
    cursor: pointer;
    width: 28px;
    height: 100%;
    padding: 4px;

    &:hover {
      opacity: 0.8;
    }

    &[|active] {
      background: var(--theme-secondary);
    }
  }

  IconOrImage {
    width: 100%;
    height: 100%;
  }
`;

interface Props {
  filters: IUserFilters;
}

export const UsersTableFilters = observer<Props>(function UsersTableFilters({ filters }) {
  const translate = useTranslate();
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const authRolesResource = useDataResource(UsersTableFilters, AuthRolesResource, undefined);

  const [open, setOpen] = useState(false);

  return styled(style)(
    <Group parent compact gap>
      <filter-container>
        <Filter
          placeholder={translate('authentication_administration_users_filters_search_placeholder')}
          value={filters.search}
          max
          onFilter={filters.setSearch}
        />
        <actions>
          <button
            {...use({ active: open })}
            onClick={() => setOpen(!open)}
          >
            <IconOrImage icon='filter' />
          </button>
        </actions>
      </filter-container>

      {open && (
        <Group box gap>
          <Combobox
            value={filters.status}
            items={USER_STATUSES}
            valueSelector={value => translate(value.label)}
            keySelector={value => value.value}
            keepSize
            onSelect={filters.setStatus}
          >
            {translate('authentication_user_status')}
          </Combobox>
          {!!authRolesResource.data.length && (
            <Combobox
              items={[...authRolesResource.data, USER_ROLE_ALL]}
              value={filters.role}
              keepSize
              onSelect={filters.setRole}
            >
              {translate('authentication_user_role')}
            </Combobox>
          )}
        </Group>
      )}
    </Group>
  );
});