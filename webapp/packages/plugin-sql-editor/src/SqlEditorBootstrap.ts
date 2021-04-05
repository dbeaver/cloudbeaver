/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
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
  isObjectCatalogProvider, isObjectSchemaProvider
} from '@cloudbeaver/core-app';
import { isConnectionProvider } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ContextMenuService, IMenuContext } from '@cloudbeaver/core-dialogs';
import { ExtensionUtils } from '@cloudbeaver/core-extensions';
import { ActiveViewService } from '@cloudbeaver/core-view';

import { SqlEditorNavigatorService } from './SqlEditorNavigatorService';

@injectable()
export class SqlEditorBootstrap extends Bootstrap {
  constructor(
    private mainMenuService: MainMenuService,
    private contextMenuService: ContextMenuService,
    private sqlEditorNavigatorService: SqlEditorNavigatorService,
    private connectionSchemaManagerService: ConnectionSchemaManagerService,
    private activeViewService: ActiveViewService
  ) {
    super();
  }

  register(): void {
    this.mainMenuService.registerRootItem(
      {
        id: 'sql-editor',
        title: 'SQL',
        order: 2,
        onClick: this.openSQLEditor.bind(this),
        isDisabled: () => this.isSQLEntryDisabled(),
      }
    );
    this.contextMenuService.addMenuItem<NavNode>(this.contextMenuService.getRootMenuToken(), {
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
    });
  }

  load(): void {}

  private isSQLEntryDisabled() {
    const activeView = this.activeViewService.view;
    if (activeView) {
      return !ExtensionUtils
        .from(activeView.extensions)
        .has(isConnectionProvider);
    }
    return !this.connectionSchemaManagerService.currentConnectionId;
  }

  private openSQLEditor() {
    let connectionId: string | undefined;
    let catalogId: string | undefined;
    let schemaId: string | undefined;

    const activeView = this.activeViewService.view;

    if (activeView) {
      ExtensionUtils.from(activeView.extensions)
        .on(isConnectionProvider, extension => { connectionId = extension(activeView.context); })
        .on(isObjectCatalogProvider, extension => { catalogId = extension(activeView.context); })
        .on(isObjectSchemaProvider, extension => { schemaId = extension(activeView.context); });
    } else {
      connectionId = this.connectionSchemaManagerService.currentConnectionId || undefined;
      catalogId = this.connectionSchemaManagerService.currentObjectCatalogId;
      schemaId = this.connectionSchemaManagerService.currentObjectSchemaId;
    }

    this.sqlEditorNavigatorService.openNewEditor(connectionId, catalogId, schemaId);
  }
}
