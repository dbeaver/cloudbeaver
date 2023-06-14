/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';
import { css } from 'reshadow';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { Loader, Table, TableBody, TableColumnHeader, TableHeader, TableSelect, useTranslate } from '@cloudbeaver/core-blocks';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import { Team } from './Team';

const loaderStyle = css`
  ExceptionMessage {
    padding: 16px;
  }
`;

interface Props {
  teams: TeamInfo[];
  state: ILoadableState;
  selectedItems: Map<string, boolean>;
  expandedItems: Map<string, boolean>;
}

export const TeamsTable = observer<Props>(function TeamsTable({ teams, state, selectedItems, expandedItems }) {
  const translate = useTranslate();
  const keys = teams.map(team => team.teamId);

  return (
    <Loader state={state} style={loaderStyle} overlay>
      <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size="big">
        <TableHeader fixed>
          <TableColumnHeader min flex centerContent>
            <TableSelect />
          </TableColumnHeader>
          <TableColumnHeader min />
          <TableColumnHeader>{translate('administration_teams_team_id')}</TableColumnHeader>
          <TableColumnHeader>{translate('administration_teams_team_name')}</TableColumnHeader>
          <TableColumnHeader>{translate('administration_teams_team_description')}</TableColumnHeader>
          <TableColumnHeader />
        </TableHeader>
        <TableBody>
          {teams.map(team => (
            <Team key={team.teamId} team={team} />
          ))}
        </TableBody>
      </Table>
    </Loader>
  );
});
