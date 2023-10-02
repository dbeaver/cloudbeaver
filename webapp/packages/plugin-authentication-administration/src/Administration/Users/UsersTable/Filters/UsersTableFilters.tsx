/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { useState } from 'react';

import { AuthRolesResource } from '@cloudbeaver/core-authentication';
import { Combobox, Filter, Group, IconOrImage, s, useResource, useS, useStyles, useTranslate } from '@cloudbeaver/core-blocks';

import style from './UsersTableFilters.m.css';
import { IUserFilters, USER_ROLE_ALL, USER_STATUSES } from './useUsersTableFilters';
interface Props {
  filters: IUserFilters;
}

export const UsersTableFilters = observer<Props>(function UsersTableFilters({ filters }) {
  const styles = useS(style);
  const translate = useTranslate();
  const authRolesResource = useResource(UsersTableFilters, AuthRolesResource, undefined);

  const [open, setOpen] = useState(false);

  return (
    <Group parent compact gap>
      <div className={s(styles, { filterContainer: true })}>
        <Filter
          placeholder={translate('authentication_administration_users_filters_search_placeholder')}
          value={filters.search}
          className={s(styles, { filter: true })}
          max
          onFilter={filters.setSearch}
        />
        <div className={s(styles, { actions: true })}>
          <button className={s(styles, { button: true, active: open })} onClick={() => setOpen(!open)}>
            <IconOrImage className={s(styles, { iconOrImage: true })} icon="filter" />
          </button>
        </div>
      </div>

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
            <Combobox items={[...authRolesResource.data, USER_ROLE_ALL]} value={filters.role} keepSize onSelect={filters.setRole}>
              {translate('authentication_user_role')}
            </Combobox>
          )}
        </Group>
      )}
    </Group>
  );
});
