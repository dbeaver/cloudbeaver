/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import styled, { css } from 'reshadow';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { Table, TableHeader, TableColumnHeader, TableBody, TableSelect, Loader, ILoadableState, useTranslate, useStyles } from '@cloudbeaver/core-blocks';



import { Team } from './Team';

const styles = css`
  Table {
    width: 100%;
  }
`;

const loaderStyle = css`
  ExceptionMessage {
    padding: 24px;
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

  return styled(useStyles(styles))(
    <Loader state={state} style={loaderStyle} overlay>
      <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size='big'>
        <TableHeader>
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
