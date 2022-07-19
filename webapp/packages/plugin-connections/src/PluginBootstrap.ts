/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { EMainMenu, MainMenuService } from '@cloudbeaver/core-app';
import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly connectionsManagerService: ConnectionsManagerService,
  ) {
    super();
  }

  register(): void {
    this.mainMenuService.registerMenuItem(
      EMainMenu.mainMenuConnectionsPanel,
      {
        id: 'mainMenuDisconnect',
        order: 3,
        title: 'app_shared_connectionMenu_disconnect',
        onClick: () => this.connectionsManagerService.closeAllConnections(),
        isDisabled: () => !this.connectionsManagerService.hasAnyConnection(true),
      }
    );
  }

  load(): void { }
}
