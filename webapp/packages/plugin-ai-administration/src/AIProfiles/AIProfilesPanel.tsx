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
  useAutoLoad,
  useResource,
  useTranslate,
} from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { TableSelectionContext, useTableSelection } from '@cloudbeaver/plugin-data-grid';
import { isDefined } from '@dbeaver/js-helpers';

import type { AdministrationAISettingsFormState } from '../AISettingsForm/AdministrationAISettingsFormState.js';
import { getAdministrationAISettingsFormInfoPart } from '../AISettingsForm/getAdministrationAISettingsFormInfoPart.js';
import { AIProfileFormService } from './AIProfileForm/AIProfileFormService.js';
import { AIProfilesResource } from './AIProfilesResource.js';
import AIProfilesToolsPanelStyles from './AIProfilesToolsPanel.module.css';
import { AIProfilesTable } from './AIProfilesTable.js';
import { useAIProfilesTable } from './useAIProfilesTable.js';

interface Props {
  formState: AdministrationAISettingsFormState;
}

const toolsPanelRegistry: StyleRegistry = [
  [ToolsPanelStyles, { mode: 'append', styles: [AIProfilesToolsPanelStyles] }],
  [ToolsActionStyles, { mode: 'append', styles: [AIProfilesToolsPanelStyles] }],
];

export const AIProfilesPanel = observer<Props>(function AIProfilesPanel({ formState }) {
  const translate = useTranslate();
  const aiProfileFormService = useService(AIProfileFormService);

  const settingsInfoPart = getAdministrationAISettingsFormInfoPart(formState);
  useAutoLoad(AIProfilesPanel, settingsInfoPart);

  const profilesLoader = useResource(AIProfilesPanel, AIProfilesResource, CachedMapAllKey);
  const profiles = profilesLoader.data.filter(isDefined);
  const defaultProfileId = settingsInfoPart.initialState.defaultConfiguration;

  const selection = useTableSelection(profiles.filter(p => p.id !== defaultProfileId).map(p => p.id));
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
          <AIProfilesTable profiles={profiles} defaultProfileId={defaultProfileId} />
        </TableSelectionContext>
      </Container>
    </ColoredContainer>
  );
});
