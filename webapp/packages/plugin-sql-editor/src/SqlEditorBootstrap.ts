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
  NavNode, ConnectionSchemaManagerService,
  isObjectCatalogProvider, isObjectSchemaProvider,
} from '@cloudbeaver/core-app';
import { ConnectionsManagerService, isConnectionProvider } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IContextMenuItem, IMenuContext } from '@cloudbeaver/core-dialogs';
import { ActiveViewService } from '@cloudbeaver/core-view';

import { SqlEditorNavigatorService } from './SqlEditorNavigatorService';
import { SqlEditorTabService } from './SqlEditorTabService';

@injectable()
export class SqlEditorBootstrap {
  constructor(
    private mainMenuService: MainMenuService,
    private contextMenuService: ContextMenuService,
    private connectionsManagerService: ConnectionsManagerService,
    private sqlEditorTabService: SqlEditorTabService,
    private sqlEditorNavigatorService: SqlEditorNavigatorService,
    private connectionSchemaManagerService: ConnectionSchemaManagerService,
    private activeViewService: ActiveViewService,
  ) {}

  async bootstrap() {
    this.sqlEditorTabService.registerTabHandler();

    this.mainMenuService.registerRootItem(
      {
        id: 'sql-editor',
        title: 'SQL',
        order: 2,
        onClick: this.openSQLEditor.bind(this),
        isDisabled: () => !this.connectionsManagerService.hasAnyConnection(),
      }
    );

    const openSqlEditor: IContextMenuItem<NavNode> = {
      id: 'open-sql-editor',
      isPresent(context) {
        return context.contextType === NavigationTreeContextMenuService.nodeContextType
          && context.data.objectFeatures.includes(EObjectFeature.dataSource);
      },
      title: 'SQL',
      order: 2,
      onClick: (context: IMenuContext<NavNode>) => {
        const node = context.data;
        const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(node.id);
        this.sqlEditorNavigatorService.openNewEditor(connectionId);
      },
    };
    this.contextMenuService.addMenuItem<NavNode>(this.contextMenuService.getRootMenuToken(), openSqlEditor);
  }

  private openSQLEditor() {
    const activeView = this.activeViewService.view;

    if (activeView) {
      let connectionId: string | undefined;
      let catalogId: string | undefined;
      let schemaId: string | undefined;

      for (const extension of activeView.extensions) {
        if (isConnectionProvider(extension)) {
          connectionId = extension(activeView.context);
        } else if (isObjectCatalogProvider(extension)) {
          catalogId = extension(activeView.context);
        } else if (isObjectSchemaProvider(extension)) {
          schemaId = extension(activeView.context);
        }
      }

      if (connectionId) {
        this.sqlEditorNavigatorService.openNewEditor(
          connectionId,
          catalogId,
          schemaId,
        );
        return;
      }
    }

    this.sqlEditorNavigatorService.openNewEditor(
      this.connectionSchemaManagerService.currentConnectionId,
      this.connectionSchemaManagerService.currentObjectCatalogId,
      this.connectionSchemaManagerService.currentObjectSchemaId,
    );
  }
}
