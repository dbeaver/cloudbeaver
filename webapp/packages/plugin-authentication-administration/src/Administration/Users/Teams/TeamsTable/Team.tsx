/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css, use } from 'reshadow';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { TableItem, TableColumnValue, TableItemSelect, TableItemExpand, Placeholder, useStyles, Loader } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';


import { TeamsAdministrationService } from '../TeamsAdministrationService';
import { TeamEdit } from './TeamEdit';

const styles = css`
  StaticImage {
    display: flex;
    width: 24px;

    &:not(:last-child) {
      margin-right: 16px;
    }
  }
  TableColumnValue[expand] {
    cursor: pointer;
  }
  TableColumnValue[|gap] {
    gap: 16px;
  }
`;

interface Props {
  team: TeamInfo;
}

export const Team = observer<Props>(function Team({ team }) {
  const service = useService(TeamsAdministrationService);

  return styled(useStyles(styles))(
    <TableItem item={team.teamId} expandElement={TeamEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue title={team.teamId} ellipsis expand>{team.teamId}</TableColumnValue>
      <TableColumnValue title={team.teamName} ellipsis>{team.teamName || ''}</TableColumnValue>
      <TableColumnValue title={team.description} ellipsis>{team.description || ''}</TableColumnValue>
      <TableColumnValue flex {...use({ gap: true })}>
        <Loader suspense small inline hideMessage>
          <Placeholder container={service.teamDetailsInfoPlaceholder} team={team} />
        </Loader>
      </TableColumnValue>
    </TableItem>
  );
});
