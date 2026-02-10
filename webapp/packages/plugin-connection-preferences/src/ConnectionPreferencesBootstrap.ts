/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { DATA_CONTEXT_CONNECTION } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature } from '@cloudbeaver/core-navigation-tree';

import { ACTION_CONNECTION_PREFERENCES } from './actions/ACTION_CONNECTION_PREFERENCES.js';
import { ConnectionPreferencesPanelService } from './ConnectionPreferencesPanelService.js';

@injectable(() => [ActionService, MenuService, ConnectionPreferencesPanelService])
export class ConnectionPreferencesBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly connectionPreferencesPanelService: ConnectionPreferencesPanelService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_CONNECTION, DATA_CONTEXT_NAV_NODE],
      isApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE)!;
        return node.objectFeatures.includes(EObjectFeature.dataSource);
      },
      getItems: (context, items) => [...items, ACTION_CONNECTION_PREFERENCES],
    });

    this.actionService.addHandler({
      id: 'connection-preferences',
      actions: [ACTION_CONNECTION_PREFERENCES],
      contexts: [DATA_CONTEXT_CONNECTION],
      handler: async context => {
        const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;
        await this.connectionPreferencesPanelService.open(connectionKey);
      },
    });
  }
}
