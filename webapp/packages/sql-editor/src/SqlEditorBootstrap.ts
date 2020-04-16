/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  MainMenuService,
  NavigationTreeContextMenuService,
  EObjectFeature,
  NodeManagerUtils,
  NodeWithParent, ConnectionsManagerService,
} from '@dbeaver/core/app';
import { injectable } from '@dbeaver/core/di';
import { ContextMenuService, IContextMenuItem, IMenuContext } from '@dbeaver/core/dialogs';

import { SqlEditorManagerService } from './SqlEditorManagerService';
import { SqlEditorTabService } from './SqlEditorTabService';

@injectable()
export class SqlEditorBootstrap {
  constructor(private mainMenuService: MainMenuService,
              private contextMenuService: ContextMenuService,
              private connectionsManagerService: ConnectionsManagerService,
              private sqlEditorTabService: SqlEditorTabService,
              private sqlEditorManagerService: SqlEditorManagerService) {}

  async bootstrap() {
    this.sqlEditorTabService.registerTabHandler();

    this.mainMenuService.registerRootItem(
      {
        id: 'sql-editor',
        title: 'SQL',
        order: 2,
        onClick: () => this.sqlEditorManagerService.openNewEditor(),
        isDisabled: () => !this.connectionsManagerService.hasAnyConnection(),
      }
    );

    const openSqlEditor: IContextMenuItem<NodeWithParent> = {
      id: 'open-sql-editor',
      isPresent(context) {
        return context.contextType === NavigationTreeContextMenuService.nodeContextType
          && Boolean((context.data as NodeWithParent)?.object?.features?.includes(EObjectFeature.dataSource));
      },
      title: 'SQL',
      order: 2,
      onClick: (context: IMenuContext<NodeWithParent>) => {
        const node = context.data;
        const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(node.id);
        this.sqlEditorManagerService.openNewEditor(connectionId);
      },
    };
    this.contextMenuService.addMenuItem<NodeWithParent>(this.contextMenuService.getRootMenuToken(), openSqlEditor);
  }
}
