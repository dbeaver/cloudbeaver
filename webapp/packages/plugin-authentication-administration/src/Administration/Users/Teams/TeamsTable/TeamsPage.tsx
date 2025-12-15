/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, Group, ToolsAction, ToolsPanel, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { TableSelectionContext, useTableSelection } from '@cloudbeaver/plugin-data-grid';
import { compareTeams, TeamsResource } from '@cloudbeaver/core-authentication';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { isDefined } from '@dbeaver/js-helpers';
import { useService } from '@cloudbeaver/core-di';

import { CreateTeam } from './CreateTeam.js';
import { CreateTeamService } from './CreateTeamService.js';
import { useTeamsTable } from './useTeamsTable.js';
import { TeamsTable } from './TeamsTable.js';

interface Props {
  param?: string | null;
}

export const TeamsPage = observer<Props>(function TeamsPage({ param }) {
  const translate = useTranslate();
  const service = useService(CreateTeamService);

  const teamsLoader = useResource(TeamsPage, TeamsResource, CachedMapAllKey);
  const teams = teamsLoader.data.filter(isDefined).sort(compareTeams);

  const selection = useTableSelection(teams.map(t => t.teamId));
  const table = useTeamsTable(selection);

  const create = param === 'create';

  return (
    <ColoredContainer vertical wrap gap parent maximum>
      <Group box keepSize>
        <ToolsPanel rounded>
          <ToolsAction
            title={translate('administration_teams_add_tooltip')}
            icon="add"
            viewBox="0 0 24 24"
            disabled={create || table.processing}
            onClick={service.create}
          >
            {translate('ui_create')}
          </ToolsAction>
          <ToolsAction
            title={translate('administration_teams_refresh_tooltip')}
            icon="refresh"
            viewBox="0 0 24 24"
            disabled={table.processing}
            onClick={table.update}
          >
            {translate('ui_refresh')}
          </ToolsAction>
          <ToolsAction
            title={translate('administration_teams_delete_tooltip')}
            icon="trash"
            viewBox="0 0 24 24"
            disabled={!selection.list.length || table.processing}
            onClick={table.delete}
          >
            {translate('ui_delete')}
          </ToolsAction>
        </ToolsPanel>
      </Group>

      <Container overflow gap maximum>
        {create && (
          <Group box>
            <CreateTeam />
          </Group>
        )}
        <TableSelectionContext value={selection}>
          <TeamsTable teams={teams} />
        </TableSelectionContext>
      </Container>
    </ColoredContainer>
  );
});
