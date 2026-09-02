/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { ColoredContainer, Container, Group, TextPlaceholder, ToolsAction, ToolsPanel, useResource, useTranslate } from '@cloudbeaver/core-blocks';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AiEnginesResource } from '@cloudbeaver/plugin-ai';
import { AIProfilesResource } from '@cloudbeaver/plugin-ai-profiles';

import { AIProfilesTable, type IAIProfile } from './AIProfilesTable.js';

export const AIProfilesPanel = observer(function AIProfilesPanel() {
  const translate = useTranslate();
  const notificationService = useService(NotificationService);
  const profilesLoader = useResource(AIProfilesPanel, AIProfilesResource, CachedMapAllKey);
  const enginesLoader = useResource(AIProfilesPanel, AiEnginesResource, undefined);
  const profiles = profilesLoader.data.filter((profile): profile is IAIProfile => profile !== undefined);

  async function refresh(): Promise<void> {
    try {
      await Promise.all([profilesLoader.reload(), enginesLoader.reload()]);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_user_profile_refresh_failed');
    }
  }

  return (
    <ColoredContainer wrap gap parent vertical maximum>
      <Group box keepSize>
        <ToolsPanel rounded>
          <ToolsAction
            title={translate('plugin_ai_user_profile_refresh_tooltip')}
            icon="refresh"
            viewBox="0 0 24 24"
            disabled={profilesLoader.isLoading() || enginesLoader.isLoading()}
            onClick={refresh}
          >
            {translate('ui_refresh')}
          </ToolsAction>
        </ToolsPanel>
      </Group>
      <Container overflow gap maximum>
        {profiles.length ? (
          <AIProfilesTable profiles={profiles} engines={enginesLoader.data} />
        ) : (
          <TextPlaceholder>{translate('plugin_ai_user_profile_empty')}</TextPlaceholder>
        )}
      </Container>
    </ColoredContainer>
  );
});
