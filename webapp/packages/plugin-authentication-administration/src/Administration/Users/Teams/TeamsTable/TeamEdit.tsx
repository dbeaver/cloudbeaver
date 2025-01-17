/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TeamsResource } from '@cloudbeaver/core-authentication';
import { ColoredContainer, GroupBack, GroupTitle, Text, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { FormMode } from '@cloudbeaver/core-ui';

import { TeamForm } from '../TeamsForm/TeamForm.js';
import { useTeamsAdministrationFormState } from '../TeamsForm/useTeamsAdministrationFormState.js';
import { TeamsTableOptionsPanelService } from './TeamsTableOptionsPanelService.js';

interface Props {
  item: string;
  onClose: () => void;
}

export const TeamEdit = observer<Props>(function TeamEdit({ item }) {
  const translate = useTranslate();
  const teamsTableOptionsPanelService = useService(TeamsTableOptionsPanelService);
  const team = useResource(TeamEdit, TeamsResource, item);

  const formState = useTeamsAdministrationFormState(item, state => state.setMode(FormMode.Edit))!;

  return (
    <ColoredContainer aria-label={translate('plugin_authentication_administration_team_form_edit_label')} parent vertical noWrap surface gap compact>
      <GroupTitle header>
        <GroupBack onClick={teamsTableOptionsPanelService.close}>
          <Text truncate>
            {translate('ui_edit')}
            {team.data?.teamName ? ` "${team.data.teamName}"` : ''}
          </Text>
        </GroupBack>
      </GroupTitle>
      <TeamForm state={formState} onCancel={teamsTableOptionsPanelService.close} />
    </ColoredContainer>
  );
});
