/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  NavigationTreeContextMenuService,
  EObjectFeature,
  NodeManagerUtils,
  NavNode
} from '@cloudbeaver/core-app';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ContextMenuService } from '@cloudbeaver/core-dialogs';

import { PublicConnectionFormService } from './PublicConnectionFormService';

@injectable()
export class PublicConnectionFormBootstrap extends Bootstrap {
  constructor(
    private readonly contextMenuService: ContextMenuService,
    private readonly publicConnectionFormService: PublicConnectionFormService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.contextMenuService.addMenuItem<NavNode>(this.contextMenuService.getRootMenuToken(), {
      id: 'connection-edit',
      isPresent(context) {
        return context.contextType === NavigationTreeContextMenuService.nodeContextType
          && context.data.objectFeatures.includes(EObjectFeature.dataSource);
      },
      title: 'connections_public_connection_edit_menu_item_title',
      order: 2,
      onClick: context => {
        const node = context.data;
        const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(node.id);
        this.publicConnectionFormService.open({ connectionId });
      },
    });
  }

  load(): void | Promise<void> {
  }
}
