/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useRef } from 'react';
import styled, { css } from 'reshadow';

import { PermissionsResource } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, ColoredContainer, FieldCheckbox, Group, GroupTitle, InputField, SubmittingForm, Textarea, useMapResource } from '@cloudbeaver/core-blocks';
import { useTranslate } from '@cloudbeaver/core-localization';
import { CachedMapAllKey } from '@cloudbeaver/core-sdk';
import { useStyles } from '@cloudbeaver/core-theming';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { IRoleFormProps } from '../IRoleFormProps';

const styles = css`
  SubmittingForm {
    flex: 1;
    overflow: auto;
  }
  caption {
    composes: theme-text-text-hint-on-light theme-typography--caption from global;
  }
`;

export const RoleOptions: TabContainerPanelComponent<IRoleFormProps> = observer(function RoleOptions({
  state,
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const translate = useTranslate();
  const permissionsResource = useMapResource(RoleOptions, PermissionsResource, CachedMapAllKey);
  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const edit = state.mode === 'edit';

  return styled(style)(
    <SubmittingForm ref={formRef}>
      <ColoredContainer parent gap overflow>
        <Group small gap>
          <InputField
            name='roleId'
            state={state.config}
            readOnly={state.readonly || edit}
            disabled={state.disabled}
            required
            tiny
            fill
          >
            {translate('administration_roles_role_id')}
          </InputField>
          <InputField
            name='roleName'
            state={state.config}
            readOnly={state.readonly}
            disabled={state.disabled}
            tiny
            fill
          >
            {translate('administration_roles_role_name')}
          </InputField>
          <Textarea
            name='description'
            state={state.config}
            readOnly={state.readonly}
            disabled={state.disabled}
            tiny
            fill
          >
            {translate('administration_roles_role_description')}
          </Textarea>
        </Group>
        <Group small gap>
          <GroupTitle>{translate('administration_roles_role_permissions')}</GroupTitle>
          {permissionsResource.resource.values.map(permission => {
            let label = permission.id;
            let caption: string | undefined;

            if (permission.label) {
              label = `${permission.label}`;
              caption = permission.id;
            }

            const tooltip = `${label}${permission.description ? '\n' + permission.description : ''}`;
            return (
              <FieldCheckbox
                key={permission.id}
                id={permission.id}
                value={permission.id}
                title={tooltip}
                name='rolePermissions'
                state={state.config}
                readOnly={state.readonly}
                disabled={state.disabled}
              >
                {label} {caption && <caption>({caption})</caption>}
              </FieldCheckbox>
            );
          })}
        </Group>
      </ColoredContainer>
    </SubmittingForm>
  );
});
