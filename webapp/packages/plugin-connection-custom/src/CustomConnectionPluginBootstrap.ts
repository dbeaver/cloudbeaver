/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ProjectsService } from '@cloudbeaver/core-projects';
import { ServerConfigResource } from '@cloudbeaver/core-root';
import { MainMenuService, EMainMenu } from '@cloudbeaver/plugin-top-app-bar';

import { CustomConnectionDialog } from './CustomConnection/CustomConnectionDialog';

@injectable()
export class CustomConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly commonDialogService: CommonDialogService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly projectsService: ProjectsService,
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.mainMenuService.onConnectionClick.addHandler(() => {
      this.projectsService.load();
    });

    this.mainMenuService.registerMenuItem(EMainMenu.mainMenuConnectionsPanel, {
      id: 'сustomConnection',
      order: 2,
      title: 'app_shared_connectionMenu_custom',
      isHidden: () => (
        !this.serverConfigResource.data?.supportsCustomConnections
        || !this.projectsService.activeProject?.canCreateConnections
      ),
      onClick: () => this.openConnectionsDialog(),
    });
  }

  load(): void | Promise<void> { }

  private async openConnectionsDialog() {
    await this.commonDialogService.open(CustomConnectionDialog, null);
  }
}
