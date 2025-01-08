/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TeamInfoMetaParametersResource, TeamsResource } from '@cloudbeaver/core-authentication';
import { ColoredContainer, GroupBack, GroupTitle, Text, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TeamForm } from '../TeamForm.js';
import { useTeamFormState } from '../useTeamFormState.js';
import { TeamsTableOptionsPanelService } from './TeamsTableOptionsPanelService.js';

interface Props {
  item: string;
  onClose: () => void;
}

export const TeamEdit = observer<Props>(function TeamEdit({ item }) {
  const translate = useTranslate();
  const resource = useService(TeamsResource);
  const teamInfoMetaParametersResource = useService(TeamInfoMetaParametersResource);
  const teamsTableOptionsPanelService = useService(TeamsTableOptionsPanelService);

  const data = useTeamFormState(resource, teamInfoMetaParametersResource, state => state.setOptions('edit'));

  data.config.teamId = item;

  return (
    <ColoredContainer aria-label={translate('plugin_authentication_administration_team_form_edit_label')} parent vertical noWrap surface gap compact>
      <GroupTitle header>
        <GroupBack onClick={teamsTableOptionsPanelService.close}>
          <Text truncate>
            {translate('ui_edit')}
            {data.config.teamName ? ` "${data.config.teamName}"` : ''}
          </Text>
        </GroupBack>
      </GroupTitle>
      <TeamForm state={data} onCancel={teamsTableOptionsPanelService.close} />
    </ColoredContainer>
  );
});
