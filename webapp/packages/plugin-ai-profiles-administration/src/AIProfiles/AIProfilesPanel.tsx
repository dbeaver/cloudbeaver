/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { AdministrationPageContent, AdministrationPageHeader, AdministrationPageTitle } from '@cloudbeaver/core-administration';
import { Button, Filter, IconOrImage, ToolbarAction, ToolbarActions, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { WEBSITE_LINKS } from '@cloudbeaver/core-links';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { AISettingsResource } from '@cloudbeaver/plugin-ai';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';
import { TableSelectionContext, useTableSelection } from '@cloudbeaver/plugin-data-grid';
import { isDefined } from '@dbeaver/js-helpers';

import { AIProfileFormService } from './AIProfileForm/AIProfileFormService.js';
import { AIProfilesAdministrationTable } from './AIProfilesAdministrationTable.js';
import { useAIProfilesTable } from './useAIProfilesTable.js';
import { useAIProfilesTableFilters } from './useAIProfilesTableFilters.js';

export const AIProfilesPanel = observer(function AIProfilesPanel() {
  const translate = useTranslate();
  const aiProfileFormService = useService(AIProfileFormService);
  const aiSettingsResource = useService(AISettingsResource);

  useResource(AIProfilesPanel, AISettingsResource, undefined);
  const profilesLoader = useResource(AIProfilesPanel, AIProfilesResource, CachedMapAllKey);
  const profiles = profilesLoader.data.filter(isDefined);
  const filters = useAIProfilesTableFilters(profiles);
  const settingsLoaded = aiSettingsResource.isLoaded();
  const defaultProfileId = aiSettingsResource.data?.defaultConfiguration;

  const selection = useTableSelection(
    filters.filteredProfiles.filter(profile => settingsLoaded && profile.id !== defaultProfileId).map(profile => profile.id),
  );
  const table = useAIProfilesTable(selection);

  return (
    <>
      <AdministrationPageHeader
        actionsSlot={
          <>
            <Button
              variant="secondary"
              title={translate('plugin_ai_administration_profile_delete_tooltip')}
              icon="trash"
              iconPlacement="start"
              viewBox="0 0 24 24"
              disabled={!selection.selected.length || table.processing}
              onClick={() => table.delete()}
            >
              {translate('ui_delete')}
            </Button>
            <Button
              variant="primary"
              title={translate('plugin_ai_administration_profile_add_tooltip')}
              disabled={table.processing}
              onClick={() => aiProfileFormService.open(null)}
            >
              {translate('plugin_ai_administration_create_profile')}
            </Button>
          </>
        }
      >
        <AdministrationPageTitle docLink={WEBSITE_LINKS.AI_PROFILES_DOCUMENTATION_PAGE}>
          {translate('plugin_ai_administration_profiles_title')}
        </AdministrationPageTitle>
      </AdministrationPageHeader>
      <AdministrationPageContent>
        <div className="tw:flex tw:flex-wrap tw:shrink-0 tw:items-center tw:justify-between tw:gap-3">
          <Filter
            className="tw:w-full tw:max-w-sm"
            placeholder={translate('plugin_ai_administration_profiles_search_placeholder')}
            value={filters.search}
            onChange={filters.setSearch}
          />
          <ToolbarActions className="tw:ml-auto">
            <ToolbarAction
              aria-label={translate('plugin_ai_administration_profile_refresh_tooltip')}
              title={translate('plugin_ai_administration_profile_refresh_tooltip')}
              disabled={table.processing}
              onClick={() => table.refresh()}
            >
              <IconOrImage className="tw:size-full" icon="refresh" viewBox="0 0 24 24" />
            </ToolbarAction>
          </ToolbarActions>
        </div>
        <div className="tw:flex-1 tw:min-w-0 tw:min-h-0">
          <TableSelectionContext value={selection}>
            <AIProfilesAdministrationTable
              profiles={filters.filteredProfiles}
              deletionDisabled={!settingsLoaded}
              processing={table.processing}
              isDefaultProfile={profileId => profileId === defaultProfileId}
              onClone={table.clone}
              onDelete={table.delete}
            />
          </TableSelectionContext>
        </div>
      </AdministrationPageContent>
    </>
  );
});
