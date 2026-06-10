/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODE, isProjectNode } from '@cloudbeaver/core-navigation-tree';
import { ActionService, MenuService } from '@cloudbeaver/core-view';

import { ACTION_PROJECT_INFO } from './actions/ACTION_PROJECT_INFO.js';
import { ProjectInfoFormService } from './ProjectInfoForm/ProjectInfoFormService.js';

@injectable(() => [ActionService, MenuService, ProjectInfoFormService])
export class ProjectInfoBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly projectInfoFormService: ProjectInfoFormService,
  ) {
    super();
  }

  override register() {
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_NAV_NODE],
      getItems: (context, items) => [...items, ACTION_PROJECT_INFO],
    });

    this.actionService.addHandler({
      id: 'action-project-info-handler',
      actions: [ACTION_PROJECT_INFO],
      contexts: [DATA_CONTEXT_NAV_NODE],
      isActionApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        return isProjectNode(node);
      },
      handler: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);
        const projectId = node?.projectId;

        if (projectId) {
          this.projectInfoFormService.open(projectId);
        }
      },
    });
  }
}
