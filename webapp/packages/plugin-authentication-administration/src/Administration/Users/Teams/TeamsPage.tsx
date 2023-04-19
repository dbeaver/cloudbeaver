/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import { ADMINISTRATION_TOOLS_PANEL_STYLES, IAdministrationItemSubItem } from '@cloudbeaver/core-administration';
import { BASE_CONTAINERS_STYLES, ToolsAction, ToolsPanel, useTranslate, useStyles, ColoredContainer, Group, Container } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';



import { CreateTeam } from './CreateTeam';
import { CreateTeamService } from './CreateTeamService';
import { TeamsTable } from './TeamsTable/TeamsTable';
import { useTeamsTable } from './TeamsTable/useTeamsTable';

const styles = css` 
    ToolsPanel {
      border-bottom: none;
    }
`;

interface Props {
  sub?: IAdministrationItemSubItem;
  param?: string | null;
}

export const TeamsPage = observer<Props>(function TeamsPage({
  sub,
  param,
}) {
  const translate = useTranslate();
  const style = useStyles(BASE_CONTAINERS_STYLES, styles, ADMINISTRATION_TOOLS_PANEL_STYLES);
  const service = useService(CreateTeamService);

  const table = useTeamsTable();
  const create = param === 'create';

  return styled(style)(
    <ColoredContainer vertical wrap gap parent>
      <Group box keepSize>
        <ToolsPanel>
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
        <Group box='no-overflow'>
          <TeamsTable
            teams={table.teams}
            state={table.state}
            selectedItems={table.tableState.selected}
            expandedItems={table.tableState.expanded}
          />
        </Group>
      </Container>
    </ColoredContainer>
  );
});
