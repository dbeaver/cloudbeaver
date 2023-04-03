/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { PermissionsResource } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, FieldCheckbox, Group, GroupTitle, useResource, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';

import type { ITeamFormProps } from '../ITeamFormProps';

const styles = css`
  caption {
    composes: theme-text-text-hint-on-light theme-typography--caption from global;
  }
`;

export const Permissions = observer<ITeamFormProps>(function Permissions({ state }) {
  const translate = useTranslate();
  const permissionsResource = useResource(Permissions, PermissionsResource, CachedMapAllKey);

  const style = useStyles(BASE_CONTAINERS_STYLES, styles);

  return styled(style)(
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
            name='teamPermissions'
            state={state.config}
            readOnly={state.readonly}
            disabled={state.disabled}
          >
            {label}
            {caption ? <caption>{caption}</caption> : null}
          </FieldCheckbox>
        );
      })}
    </Group>
  );
});