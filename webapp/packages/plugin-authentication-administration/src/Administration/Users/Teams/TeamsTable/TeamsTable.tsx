/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { reaction } from 'mobx';

import { Link, s, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { ADMINISTRATION_TABLE_DEFAULT_ROW_HEIGHT, AdministrationTableStyles } from '@cloudbeaver/core-administration';
import { DataGrid, useCreateGridReactiveValue, TableRowSelect } from '@cloudbeaver/plugin-data-grid';

import { TeamsTableOptionsPanelService } from './TeamsTableOptionsPanelService.js';

interface Props {
  teams: TeamInfo[];
}

const SELECT_COLUMN = { key: 'select', label: '' };
const ID_COLUMN = { key: 'id', label: 'administration_teams_team_id' };
const NAME_COLUMN = { key: 'name', label: 'administration_teams_team_name' };
const DESCRIPTION_COLUMN = { key: 'description', label: 'administration_teams_team_description' };

const COLUMNS = [SELECT_COLUMN, ID_COLUMN, NAME_COLUMN, DESCRIPTION_COLUMN];

export const TeamsTable = observer<Props>(function TeamsTable({ teams }) {
  const translate = useTranslate();
  const styles = useS(AdministrationTableStyles);
  const teamsTableOptionsPanelService = useService(TeamsTableOptionsPanelService);

  const columnsCount = useCreateGridReactiveValue(() => COLUMNS.length, null, [COLUMNS]);
  const rowsCount = useCreateGridReactiveValue(
    () => teams.length,
    onValueChange => reaction(() => teams.length, onValueChange),
    [teams],
  );

  function getCell(rowIdx: number, colIdx: number) {
    const row = teams[rowIdx];
    const column = COLUMNS[colIdx];

    if (!row || !column) {
      return null;
    }

    if (column.key === SELECT_COLUMN.key) {
      return <TableRowSelect id={row.teamId} />;
    }

    if (column.key === ID_COLUMN.key) {
      return (
        <div
          title={row.teamId}
          className="tw:flex tw:cursor-pointer tw:items-center tw:gap-2"
          onClick={() => teamsTableOptionsPanelService.open(row.teamId)}
        >
          <Link truncate>{row.teamId}</Link>
        </div>
      );
    }

    if (column.key === NAME_COLUMN.key) {
      const name = row.teamName ?? '';
      return <span title={name}>{name}</span>;
    }

    if (column.key === DESCRIPTION_COLUMN.key) {
      return <span title={row.description}>{row.description}</span>;
    }

    return null;
  }

  const cell = useCreateGridReactiveValue(getCell, (onValueChange, rowIdx, colIdx) => reaction(() => getCell(rowIdx, colIdx), onValueChange), [
    COLUMNS,
    teams,
    teamsTableOptionsPanelService,
  ]);

  function getHeaderText(colIdx: number) {
    return translate(COLUMNS[colIdx]?.label) ?? '';
  }

  function getHeaderElement(colIdx: number) {
    if (colIdx === 0) {
      return <TableRowSelect isRoot />;
    }

    return getHeaderText(colIdx);
  }

  const headerElement = useCreateGridReactiveValue(
    getHeaderElement,
    (onValueChange, colIdx) => reaction(() => getHeaderElement(colIdx), onValueChange),
    [COLUMNS, translate],
  );

  const headerText = useCreateGridReactiveValue(getHeaderText, (onValueChange, colIdx) => reaction(() => getHeaderText(colIdx), onValueChange), [
    COLUMNS,
    translate,
  ]);

  return (
    <div className="tw:overflow-auto tw:h-full tw:max-w-full theme-text-on-surface">
      <DataGrid
        columnCount={columnsCount}
        rowCount={rowsCount}
        getHeaderResizable={colIdx => colIdx > 0}
        getRowHeight={() => ADMINISTRATION_TABLE_DEFAULT_ROW_HEIGHT}
        getHeaderPinned={colIdx => colIdx <= 0}
        headerText={headerText}
        headerElement={headerElement}
        cell={cell}
        className={s(styles, { table: true })}
      />
    </div>
  );
});
