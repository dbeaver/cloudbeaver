/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { MainMenuService, EMainMenu } from '@cloudbeaver/plugin-top-app-bar';

import { SearchDatabase } from './Search/SearchDatabase';

@injectable()
export class SearchConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly projectsService: ProjectsService,
    private readonly optionsPanelService: OptionsPanelService,
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
        !this.serverConfigResource.data?.supportsCustomConnections
        || !this.projectsService.activeProject?.canCreateConnections
      ),
      onClick: () => {
        this.optionsPanelService.open(() => SearchDatabase);
      },
    });
  }

  load(): void | Promise<void> { }
}
