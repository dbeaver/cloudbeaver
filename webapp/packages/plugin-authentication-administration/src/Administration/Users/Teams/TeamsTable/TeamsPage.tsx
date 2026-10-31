/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { compareTeams, TeamsResource } from '@cloudbeaver/core-authentication';
import { AdministrationPageHeader, AdministrationPageContent, AdministrationPageTitle } from '@cloudbeaver/core-administration';
import { Filter, IconOrImage, Placeholder, s, ToolbarAction, ToolbarActions, useResource, useS, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { TableSelectionContext, useTableSelection } from '@cloudbeaver/plugin-data-grid';
import { isDefined } from '@dbeaver/js-helpers';

import { TeamsTable } from './TeamsTable.js';
import style from '../../shared/UsersAdministration.module.css';
import { TeamsAdministrationService } from '../TeamsAdministrationService.js';
import { useTeamsTableFilters } from './Filters/useTeamsTableFilters.js';
import { TeamsTableContext } from './TeamsTableContext.js';
import { useTeamsTable } from './useTeamsTable.js';

export const TeamsPage = observer(function TeamsPage() {
  const translate = useTranslate();
  const styles = useS(style);
  const teamsAdministrationService = useService(TeamsAdministrationService);
  const teamsLoader = useResource(TeamsPage, TeamsResource, CachedMapAllKey);
  const teams = teamsLoader.data.filter(isDefined).sort(compareTeams);
  const filters = useTeamsTableFilters(teams);
  const selection = useTableSelection(filters.filteredTeams.map(team => team.teamId));
  const table = useTeamsTable(selection);

  return (
    <TeamsTableContext value={{ selection, table }}>
      <AdministrationPageHeader actionsSlot={<Placeholder container={teamsAdministrationService.actions} />}>
        <AdministrationPageTitle docLink={WEBSITE_LINKS.TEAMS_DOCUMENTATION_PAGE}>
          {translate('administration_teams_tab_title')}
        </AdministrationPageTitle>
      </AdministrationPageHeader>
      <AdministrationPageContent>
        <div className={s(styles, { toolbar: true })}>
          <Filter
            className="tw:w-full tw:max-w-sm"
            placeholder={translate('administration_teams_search_placeholder')}
            value={filters.search}
            onChange={filters.setSearch}
          />
          <ToolbarActions className="tw:ml-auto">
            <ToolbarAction
              aria-label={translate('administration_teams_refresh_tooltip')}
              title={translate('administration_teams_refresh_tooltip')}
              disabled={table.processing}
              onClick={table.update}
            >
              <IconOrImage className="tw:w-full tw:h-full" icon="refresh" viewBox="0 0 24 24" />
            </ToolbarAction>
          </ToolbarActions>
        </div>

        <div className={s(styles, { tableContainer: true })}>
          <TableSelectionContext value={selection}>
            <TeamsTable teams={filters.filteredTeams} />
          </TableSelectionContext>
        </div>
      </AdministrationPageContent>
    </TeamsTableContext>
  );
});
