/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';
import { useDeferredValue, useState } from 'react';

import { Button, Filter, IconOrImage, s, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { TableSelectionContext, useTableSelection } from '@cloudbeaver/plugin-data-grid';
import { compareTeams, TeamsResource } from '@cloudbeaver/core-authentication';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { useService } from '@cloudbeaver/core-di';
import { isDefined } from '@dbeaver/js-helpers';

import { TeamsTable } from './TeamsTable.js';
import style from '../../shared/UsersAdministration.module.css';
import { FiltersActionButton } from '../../UsersTable/Filters/FiltersActionButton.js';
import { CreateTeamService } from './CreateTeamService.js';
import { useTeamsTable } from './useTeamsTable.js';
import { UsersAdministrationHeaderActions } from '../../UsersAdministrationHeaderActions.js';

export const TeamsPage = observer(function TeamsPage() {
  const translate = useTranslate();
  const styles = useS(style);
  const createTeamService = useService(CreateTeamService);
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search).trim().toLowerCase();
  const teamsLoader = useResource(TeamsPage, TeamsResource, CachedMapAllKey);
  const teams = teamsLoader.data
    .filter(isDefined)
    .filter(team => [team.teamId, team.teamName, team.description].some(value => value?.toLowerCase().includes(deferredSearch)))
    .sort(compareTeams);
  const selection = useTableSelection(teams.map(team => team.teamId));
  const table = useTeamsTable(selection);

  return (
    <div className={s(styles, { page: true })}>
      <UsersAdministrationHeaderActions>
        <div className="tw:flex tw:flex-wrap tw:items-center tw:gap-3">
          <Button
            variant="secondary"
            className="tw:normal-case! tw:tracking-normal! tw:font-semibold"
            title={translate('administration_teams_delete_tooltip')}
            icon="trash"
            disabled={!selection.list.length || table.processing}
            onClick={table.delete}
          >
            {translate('ui_delete')}
          </Button>
          <Button
            variant="primary"
            className="tw:normal-case! tw:tracking-normal! tw:font-semibold"
            title={translate('administration_teams_add_tooltip')}
            icon="add"
            disabled={!!createTeamService.formState || table.processing}
            onClick={createTeamService.create}
          >
            {translate('administration_teams_create')}
          </Button>
        </div>
      </UsersAdministrationHeaderActions>
      <div className={s(styles, { toolbar: true })}>
        <Filter
          className="tw:w-full tw:max-w-sm"
          placeholder={translate('administration_teams_search_placeholder')}
          value={search}
          onChange={setSearch}
        />
        <div className="tw:ml-auto">
          <FiltersActionButton
            aria-label={translate('administration_teams_refresh_tooltip')}
            title={translate('administration_teams_refresh_tooltip')}
            disabled={table.processing}
            onClick={table.update}
          >
            <IconOrImage className="tw:w-full tw:h-full" icon="refresh" viewBox="0 0 24 24" />
          </FiltersActionButton>
        </div>
      </div>

      <div className={s(styles, { tableContainer: true })}>
        <TableSelectionContext value={selection}>
          <TeamsTable teams={teams} />
        </TableSelectionContext>
      </div>
    </div>
  );
});
