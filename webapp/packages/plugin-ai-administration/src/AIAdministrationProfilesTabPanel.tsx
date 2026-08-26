/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { useService } from '@cloudbeaver/core-di';

import { AIProfilesPanel } from './AIProfiles/AIProfilesPanel.js';
import { AISettingsService } from './AISettingsService.js';

export const AIAdministrationProfilesTabPanel = observer(function AIAdministrationProfilesTabPanel() {
  const aiSettingsService = useService(AISettingsService);

  if (!aiSettingsService.formState) {
    return null;
  }

  return <AIProfilesPanel formState={aiSettingsService.formState} />;
});
