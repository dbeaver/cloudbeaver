/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, Group, ToolsAction, ToolsPanel, s, useS, useStyles, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { CreateTeam } from './CreateTeam';
import { CreateTeamService } from './CreateTeamService';
import { TeamsTable } from './TeamsTable/TeamsTable';
import { useTeamsTable } from './TeamsTable/useTeamsTable';

import style from './TeamsPage.m.css';

interface Props {
  param?: string | null;
}

export const TeamsPage = observer<Props>(function TeamsPage({ param }) {
  const translate = useTranslate();
  const styles = useS(style);
  const service = useService(CreateTeamService);

  const table = useTeamsTable();
  const create = param === 'create';

  return (
    <ColoredContainer vertical wrap gap parent>
      <Group box keepSize>
        <ToolsPanel className={s(styles, { toolsPanel: true })}>
          <ToolsAction
            title={translate('administration_teams_add_tooltip')}
            icon="add"
            viewBox="0 0 24 24"
            disabled={create || table.processing}
            onClick={service.create}
          >
            {translate('ui_add')}
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
            disabled={!table.tableState.itemsSelected || table.processing}
            onClick={table.delete}
          >
            {translate('ui_delete')}
          </ToolsAction>
        </ToolsPanel>
      </Group>

      <Container overflow gap>
        {create && (
          <Group box>
            <CreateTeam />
          </Group>
        )}
        <Group boxNoOverflow>
          <TeamsTable teams={table.teams} state={table.state} selectedItems={table.tableState.selected} expandedItems={table.tableState.expanded} />
        </Group>
      </Container>
    </ColoredContainer>
  );
});
