/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { useTranslate } from '@cloudbeaver/core-blocks';
import {
  AIProfileCredentialsService,
  AIProfilesTable,
  type AIProfile,
  type IAIProfilesTableColumn,
} from '@cloudbeaver/plugin-ai-profiles';

interface Props {
  profiles: AIProfile[];
}

export const AIUserProfilesTable = observer<Props>(function AIUserProfilesTable({ profiles }) {
  const translate = useTranslate();
  const credentialsService = useService(AIProfileCredentialsService);
  const notificationService = useService(NotificationService);

  async function editCredentials(profileId: string): Promise<void> {
    try {
      await credentialsService.open(profileId);
    } catch (exception: any) {
      notificationService.logException(exception, 'plugin_ai_user_profile_credentials_edit_failed');
    }
  }

  const columns: IAIProfilesTableColumn[] = [
    {
      key: 'credentialSource',
      label: 'plugin_ai_user_profile_column_credential_source',
      width: 180,
      render: profile =>
        translate(profile.global ? 'plugin_ai_user_profile_credential_source_administrator' : 'plugin_ai_user_profile_credential_source_user'),
    },
    {
      key: 'status',
      label: 'plugin_ai_user_profile_column_status',
      width: 280,
      render: profile => {
        if (profile.global) {
          return translate('plugin_ai_user_profile_status_managed');
        }
        return translate(profile.credentialsSaved ? 'plugin_ai_user_profile_status_configured' : 'plugin_ai_user_profile_status_not_configured');
      },
    },
  ];

  return (
    <AIProfilesTable
      profiles={profiles}
      nameLabel="plugin_ai_user_profile_column_profile"
      engineLabel="plugin_ai_user_profile_column_engine"
      emptyPlaceholder="plugin_ai_user_profile_empty"
      additionalColumns={columns}
      isProfileClickable={profile => !profile.global}
      onProfileClick={profile => editCredentials(profile.id)}
    />
  );
});
