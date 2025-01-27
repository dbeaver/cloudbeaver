/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { PermissionsResource } from '@cloudbeaver/core-administration';
import { FieldCheckbox, Group, GroupTitle, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';

import type { ITeamOptionsState } from './ITeamOptionsState.js';

interface Props {
  state: ITeamOptionsState;
  disabled: boolean;
}

export const Permissions = observer<Props>(function Permissions({ state, disabled }) {
  const translate = useTranslate();
  const permissionsResource = useResource(Permissions, PermissionsResource, CachedMapAllKey);

  return (
    <Group small gap>
      <GroupTitle>{translate('administration_teams_team_permissions')}</GroupTitle>
      {permissionsResource.resource.values.map(permission => {
        const label = permission.label ?? permission.id;

        let caption = '';

        if (permission.description) {
          caption = permission.description;
        } else if (permission.label) {
          caption = `(${permission.id})`;
        }

        let tooltip = `${permission.id}`;

        if (permission.label) {
          tooltip = permission.label + ` (${permission.id})`;
        }

        return (
          <FieldCheckbox
            key={permission.id}
            id={permission.id}
            value={permission.id}
            title={tooltip}
            label={label}
            name="teamPermissions"
            state={state}
            readOnly={disabled}
            disabled={disabled}
            caption={caption}
          />
        );
      })}
    </Group>
  );
});
