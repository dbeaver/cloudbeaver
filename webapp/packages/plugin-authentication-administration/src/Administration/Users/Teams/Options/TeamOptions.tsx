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

import { BASE_CONTAINERS_STYLES, ColoredContainer, Group, InputField, SubmittingForm, Textarea, useTranslate, useStyles, useDataResource } from '@cloudbeaver/core-blocks';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import type { TabContainerPanelComponent } from '@cloudbeaver/core-ui';

import type { ITeamFormProps } from '../ITeamFormProps';
import { Permissions } from './Permissions';

const styles = css`
  SubmittingForm {
    flex: 1;
    overflow: auto;
  }
`;

export const TeamOptions: TabContainerPanelComponent<ITeamFormProps> = observer(function TeamOptions({
  state,
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const translate = useTranslate();
  const serverConfigResource = useDataResource(TeamOptions, ServerConfigResource, undefined);

  const style = useStyles(BASE_CONTAINERS_STYLES, styles);
  const edit = state.mode === 'edit';

  return styled(style)(
    <SubmittingForm ref={formRef}>
      <ColoredContainer parent gap overflow>
        <Group small gap>
          <InputField
            name='teamId'
            state={state.config}
            readOnly={state.readonly || edit}
            disabled={state.disabled}
            required
            tiny
            fill
          >
            {translate('administration_teams_team_id')}
          </InputField>
          <InputField
            name='teamName'
            state={state.config}
            readOnly={state.readonly}
            disabled={state.disabled}
            tiny
            fill
          >
            {translate('administration_teams_team_name')}
          </InputField>
          <Textarea
            name='description'
            state={state.config}
            readOnly={state.readonly}
            disabled={state.disabled}
            tiny
            fill
          >
            {translate('administration_teams_team_description')}
          </Textarea>
        </Group>
        {!serverConfigResource.data?.distributed && <Permissions state={state} />}
      </ColoredContainer>
    </SubmittingForm>
  );
});
