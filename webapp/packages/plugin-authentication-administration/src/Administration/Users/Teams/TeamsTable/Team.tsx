/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { Loader, Placeholder, s, TableColumnValue, TableItem, TableItemExpand, TableItemSelect, useS } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TeamsAdministrationService } from '../TeamsAdministrationService';
import style from './Team.m.css';
import { TeamEdit } from './TeamEdit';

interface Props {
  team: TeamInfo;
}

export const Team = observer<Props>(function Team({ team }) {
  const styles = useS(style);
  const service = useService(TeamsAdministrationService);

  return (
    <TableItem item={team.teamId} expandElement={TeamEdit}>
      <TableColumnValue centerContent flex>
        <TableItemSelect />
      </TableColumnValue>
      <TableColumnValue className={s(styles, { expand: true })} centerContent flex expand>
        <TableItemExpand />
      </TableColumnValue>
      <TableColumnValue className={s(styles, { expand: true })} title={team.teamId} ellipsis expand>
        {team.teamId}
      </TableColumnValue>
      <TableColumnValue title={team.teamName} ellipsis>
        {team.teamName || ''}
      </TableColumnValue>
      <TableColumnValue title={team.description} ellipsis>
        {team.description || ''}
      </TableColumnValue>
      <TableColumnValue className={s(styles, { gap: true })} flex>
        <Loader suspense small inline hideMessage>
          <Placeholder container={service.teamDetailsInfoPlaceholder} team={team} />
        </Loader>
      </TableColumnValue>
    </TableItem>
  );
});
