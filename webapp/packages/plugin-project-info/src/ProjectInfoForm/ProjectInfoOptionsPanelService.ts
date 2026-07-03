/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import { BaseOptionsPanelService, OptionsPanelService } from '@cloudbeaver/core-ui';

const ProjectInfoForm = importLazyComponent(() => import('./ProjectInfoForm.js').then(m => m.ProjectInfoForm));
const panelGetter = () => ProjectInfoForm;

@injectable(() => [OptionsPanelService])
export class ProjectInfoOptionsPanelService extends BaseOptionsPanelService<string | undefined> {
  constructor(optionsPanelService: OptionsPanelService) {
    super(optionsPanelService, panelGetter);
  }

  override open(tabId?: string): Promise<boolean> {
    return super.open(tabId);
  }
}
