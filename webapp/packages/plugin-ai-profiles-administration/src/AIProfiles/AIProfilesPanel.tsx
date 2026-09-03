/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import {
  ColoredContainer,
  Container,
  Group,
  SContext,
  type StyleRegistry,
  ToolsAction,
  ToolsActionStyles,
  ToolsPanel,
  ToolsPanelStyles,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { AISettingsResource } from '@cloudbeaver/plugin-ai';
import { AISettingsService } from '@cloudbeaver/plugin-ai-administration';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';
import { TableSelectionContext, useTableSelection } from '@cloudbeaver/plugin-data-grid';
import { isDefined } from '@dbeaver/js-helpers';

import { AIProfileFormService } from './AIProfileForm/AIProfileFormService.js';
import AIProfilesToolsPanelStyles from './AIProfilesToolsPanel.module.css';
import { AIProfilesAdministrationTable } from './AIProfilesAdministrationTable.js';
import { useAIProfilesTable } from './useAIProfilesTable.js';

const toolsPanelRegistry: StyleRegistry = [
  [ToolsPanelStyles, { mode: 'append', styles: [AIProfilesToolsPanelStyles] }],
  [ToolsActionStyles, { mode: 'append', styles: [AIProfilesToolsPanelStyles] }],
];

export const AIProfilesPanel = observer(function AIProfilesPanel() {
  const translate = useTranslate();
  const aiProfileFormService = useService(AIProfileFormService);
  const aiSettingsService = useService(AISettingsService);
  const aiSettingsResource = useService(AISettingsResource);

  useResource(AIProfilesPanel, AISettingsResource, undefined);
  const profilesLoader = useResource(AIProfilesPanel, AIProfilesResource, CachedMapAllKey);
  const profiles = profilesLoader.data.filter(isDefined);
  const settingsLoaded = aiSettingsResource.isLoaded();

  const selection = useTableSelection(
    profiles.filter(profile => settingsLoaded && !aiSettingsService.isEffectiveDefaultProfile(profile.id)).map(profile => profile.id),
  );
  const table = useAIProfilesTable(selection);

  return (
    <ColoredContainer wrap gap parent vertical maximum>
      <Group box keepSize>
        <SContext registry={toolsPanelRegistry}>
          <ToolsPanel rounded>
            <ToolsAction
              title={translate('plugin_ai_administration_profile_add_tooltip')}
              icon="add"
              viewBox="0 0 24 24"
              disabled={table.processing}
              onClick={() => aiProfileFormService.open(null)}
            >
              {translate('ui_create')}
            </ToolsAction>
            <ToolsAction
              title={translate('plugin_ai_administration_profile_refresh_tooltip')}
              icon="refresh"
              viewBox="0 0 24 24"
              disabled={table.processing}
              onClick={() => table.refresh()}
            >
              {translate('ui_refresh')}
            </ToolsAction>
            <ToolsAction
              title={translate('plugin_ai_administration_profile_delete_tooltip')}
              icon="trash"
              viewBox="0 0 24 24"
              disabled={!selection.list.length || table.processing}
              onClick={() => table.delete()}
            >
              {translate('ui_delete')}
            </ToolsAction>
          </ToolsPanel>
        </SContext>
      </Group>
      <Container overflow gap maximum>
        <TableSelectionContext value={selection}>
          <AIProfilesAdministrationTable
            profiles={profiles}
            deletionDisabled={!settingsLoaded}
            isDefaultProfile={profileId => aiSettingsService.isEffectiveDefaultProfile(profileId)}
          />
        </TableSelectionContext>
      </Container>
    </ColoredContainer>
  );
});
