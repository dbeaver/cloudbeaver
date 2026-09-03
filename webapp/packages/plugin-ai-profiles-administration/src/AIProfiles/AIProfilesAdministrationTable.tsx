/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';
import { useTranslate } from '@cloudbeaver/core-blocks';
import { AIProfilesTable, type AIProfile } from '@cloudbeaver/plugin-ai-profiles';

import { AIProfileFormService } from './AIProfileForm/AIProfileFormService.js';

interface Props {
  profiles: AIProfile[];
  deletionDisabled: boolean;
  isDefaultProfile: (profileId: string) => boolean;
}

export const AIProfilesAdministrationTable = observer<Props>(function AIProfilesAdministrationTable({
  profiles,
  deletionDisabled,
  isDefaultProfile,
}) {
  const translate = useTranslate();
  const aiProfileFormService = useService(AIProfileFormService);

  return (
    <AIProfilesTable
      profiles={profiles}
      nameLabel="plugin_ai_administration_profile_column_name"
      engineLabel="plugin_ai_administration_profile_column_engine"
      emptyPlaceholder="plugin_ai_administration_profiles_table_empty_placeholder"
      selectionDisabled={deletionDisabled}
      isProfileSelectable={profile => !isDefaultProfile(profile.id)}
      getSelectionTitle={profile =>
        isDefaultProfile(profile.id) ? translate('plugin_ai_administration_profile_default_delete_info') : undefined
      }
      getProfileBadge={profile =>
        isDefaultProfile(profile.id) ? (
          <span className="tw:text-xs tw:opacity-60 tw:whitespace-nowrap">{translate('plugin_ai_administration_profile_default_badge')}</span>
        ) : null
      }
      onProfileClick={profile => aiProfileFormService.open(profile.id, profile.name)}
    />
  );
});
