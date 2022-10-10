/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EAdminPermission } from '@cloudbeaver/core-administration';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { PermissionsService } from '@cloudbeaver/core-root';
import { MainMenuService, EMainMenu } from '@cloudbeaver/plugin-top-app-bar';

import { ConnectionSearchService } from './Search/ConnectionSearchService';

@injectable()
export class SearchConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly projectsService: ProjectsService,
    private readonly permissionsService: PermissionsService,
    private readonly connectionSearchService: ConnectionSearchService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.mainMenuService.onConnectionClick.addHandler(() => {
      this.projectsService.load();
    });

    this.mainMenuService.registerMenuItem(EMainMenu.mainMenuConnectionsPanel, {
      id: 'searchConnection',
      order: 3,
      title: 'connections_connection_create_search_database',
      isHidden: () => (
        !this.projectsService.activeProjects.some(project => project.canEditDataSources)
        || !this.permissionsService.has(EAdminPermission.admin)
      ),
      onClick: () => {
        this.connectionSearchService.open();
      },
    });
  }

  load(): void | Promise<void> { }
}
