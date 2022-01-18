/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { MainMenuService, EMainMenu } from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource } from '@cloudbeaver/core-root';

import { CustomConnectionDialog } from './CustomConnection/CustomConnectionDialog';

@injectable()
export class CustomConnectionPluginBootstrap extends Bootstrap {
  constructor(
    private mainMenuService: MainMenuService,
    private commonDialogService: CommonDialogService,
    private serverConfigResource: ServerConfigResource
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.mainMenuService.registerMenuItem(EMainMenu.mainMenuConnectionsPanel, {
      id: 'сustomConnection',
      order: 2,
      title: 'app_shared_connectionMenu_custom',
      isHidden: () => !this.serverConfigResource.data?.supportsCustomConnections,
      onClick: () => this.openConnectionsDialog(),
    });
  }

  load(): void | Promise<void> { }

  private async openConnectionsDialog() {
    await this.commonDialogService.open(CustomConnectionDialog, null);
  }
}
