/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsManagerService } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { MenuService, ActionService, DATA_CONTEXT_MENU } from '@cloudbeaver/core-view';

import { ACTION_CONNECTION_DISCONNECT_ALL } from './ContextMenu/Actions/ACTION_CONNECTION_DISCONNECT_ALL';
import { MENU_CONNECTIONS } from './ContextMenu/MENU_CONNECTIONS';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionsManagerService: ConnectionsManagerService,
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable: context => context.tryGet(DATA_CONTEXT_MENU) === MENU_CONNECTIONS,
      getItems: (context, items) => [
        ...items,
        ACTION_CONNECTION_DISCONNECT_ALL,
      ],
    });

    this.actionService.addHandler({
      id: 'connection-base',
      isActionApplicable: (context, action) => [
        ACTION_CONNECTION_DISCONNECT_ALL,
      ].includes(action),
      isDisabled: () => !this.connectionsManagerService.hasAnyConnection(true),
      handler: async (context, action) => {
        switch (action) {
          case ACTION_CONNECTION_DISCONNECT_ALL: {
            await this.connectionsManagerService.closeAllConnections();
            break;
          }
        }
      },
    });
  }

  load(): void { }
}
