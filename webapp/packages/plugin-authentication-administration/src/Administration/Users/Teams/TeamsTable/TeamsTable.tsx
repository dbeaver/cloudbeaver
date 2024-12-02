/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import {
  ExceptionMessageStyles,
  Loader,
  SContext,
  type StyleRegistry,
  Table,
  TableBody,
  TableColumnHeader,
  TableHeader,
  TableSelect,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import type { ILoadableState } from '@cloudbeaver/core-utils';

import { Team } from './Team.js';
import teamsTableStyle from './TeamsTable.module.css';

const registry: StyleRegistry = [
  [
    ExceptionMessageStyles,
    {
      mode: 'append',
      styles: [teamsTableStyle],
    },
  ],
];

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
    <SContext registry={registry}>
      <Loader state={state} overlay>
        <Table keys={keys} selectedItems={selectedItems} expandedItems={expandedItems} size="big">
          <TableHeader fixed>
            <TableColumnHeader min flex centerContent>
              <TableSelect />
            </TableColumnHeader>
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
    </SContext>
  );
});
