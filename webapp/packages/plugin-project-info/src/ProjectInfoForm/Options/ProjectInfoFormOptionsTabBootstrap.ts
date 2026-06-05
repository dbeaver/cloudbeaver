/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';

import { ProjectInfoFormService } from '../ProjectInfoFormService.js';
import { ProjectInfoFormOptions } from './ProjectInfoFormOptions.js';

@injectable(() => [ProjectInfoFormService])
export class ProjectInfoFormOptionsTabBootstrap extends Bootstrap {
  constructor(private readonly projectInfoFormService: ProjectInfoFormService) {
    super();
  }

  override register(): void {
    this.projectInfoFormService.parts.add({
      key: 'options',
      name: 'plugin_project_info_form_tab_options',
      order: 1,
      panel: () => ProjectInfoFormOptions,
    });
  }
}
