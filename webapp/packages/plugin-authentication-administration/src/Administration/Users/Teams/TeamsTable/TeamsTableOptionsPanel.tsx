/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observer } from 'mobx-react-lite';

import { TextPlaceholder, useTranslate } from '@cloudbeaver/core-blocks';
import { useService } from '@cloudbeaver/core-di';

import { TeamEdit } from './TeamEdit.js';
import { TeamsTableOptionsPanelService } from './TeamsTableOptionsPanelService.js';

export const TeamsTableOptionsPanel = observer(function TeamsTableOptionsPanel() {
  const translate = useTranslate();
  const teamsTableOptionsPanelService = useService(TeamsTableOptionsPanelService);

  if (!teamsTableOptionsPanelService.itemId) {
    return <TextPlaceholder>{translate('ui_not_found')}</TextPlaceholder>;
  }

  return <TeamEdit item={teamsTableOptionsPanelService.itemId} onClose={teamsTableOptionsPanelService.close} />;
});
