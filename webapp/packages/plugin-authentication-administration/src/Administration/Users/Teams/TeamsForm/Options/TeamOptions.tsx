/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { Container, Group, InputField, Textarea, useAutoLoad, useCustomInputValidation, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { type TabContainerPanelComponent, useTab, useTabState } from '@cloudbeaver/core-ui';

import type { TeamFormProps } from '../TeamsAdministrationFormService.js';
import { Permissions } from './Permissions.js';
import { TeamMetaParameters } from './TeamMetaParameters.js';
import type { TeamOptionsFormPart } from './TeamOptionsFormPart.js';
import { ENTITY_ID_VALIDATION } from '../../../shared/ENTITY_ID_VALIDATION.js';

export const TeamOptions: TabContainerPanelComponent<TeamFormProps> = observer(function TeamOptions({ formState, tabId }) {
  const serverConfigResource = useResource(TeamOptions, ServerConfigResource, undefined);
  const tabState = useTabState<TeamOptionsFormPart>();
  const translate = useTranslate();
  const edit = formState.mode === 'edit';
  const tab = useTab(tabId);
  const loaded = tabState.isLoaded();

  useAutoLoad(TeamOptions, tabState, tab.selected && !loaded);

  const idValidationRef = useCustomInputValidation<string>(value => {
    const v = value.trim();

    if (!v) {
      return translate('ui_field_is_required');
    }

    if (!v.match(ENTITY_ID_VALIDATION)) {
      return translate('plugin_authentication_administration_team_id_validation_error');
    }

    return null;
  });

  return (
    <Container overflow>
      <Group small gap>
        <InputField ref={idValidationRef} name="teamId" state={tabState.state} readOnly={edit || formState.isDisabled} required tiny fill>
          {translate('administration_teams_team_id')}
        </InputField>
        <InputField name="teamName" state={tabState.state} readOnly={formState.isDisabled} required tiny fill>
          {translate('administration_teams_team_name')}
        </InputField>
        <Textarea name="description" state={tabState.state} readOnly={formState.isDisabled} tiny fill>
          {translate('administration_teams_team_description')}
        </Textarea>
      </Group>
      {!serverConfigResource.resource.distributed && <Permissions state={tabState.state} disabled={formState.isDisabled} />}
      <TeamMetaParameters state={tabState.state} disabled={formState.isDisabled} />
    </Container>
  );
});
