/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ProjectsNavNodeService } from '@cloudbeaver/core-navigation-tree';

import { NAV_NODE_TYPE_RM_PROJECT } from './NAV_NODE_TYPE_RM_PROJECT';
import { RESOURCES_NODE_PATH } from './RESOURCES_NODE_PATH';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(private readonly projectsNavNodeService: ProjectsNavNodeService) {
    super();
  }

  register(): void | Promise<void> {
    this.addRmProjectIds();
  }
  load(): void | Promise<void> {}

  private addRmProjectIds() {
    this.projectsNavNodeService.addProjectType(NAV_NODE_TYPE_RM_PROJECT);
    this.projectsNavNodeService.addProjectPrefix(RESOURCES_NODE_PATH + '/');
  }
}
