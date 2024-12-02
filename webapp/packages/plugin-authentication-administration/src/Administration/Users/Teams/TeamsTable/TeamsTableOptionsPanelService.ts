/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { BaseOptionsPanelService, OptionsPanelService } from '@cloudbeaver/core-ui';

const TeamsTableOptionsPanel = importLazyComponent(() => import('./TeamsTableOptionsPanel.js').then(m => m.TeamsTableOptionsPanel));
const panelGetter = () => TeamsTableOptionsPanel;

@injectable()
export class TeamsTableOptionsPanelService extends BaseOptionsPanelService<string> {
  constructor(optionsPanelService: OptionsPanelService) {
    super(optionsPanelService, panelGetter);
  }
}
