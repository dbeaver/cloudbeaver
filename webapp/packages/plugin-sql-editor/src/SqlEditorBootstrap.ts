/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  MainMenuService,
  NavNodeContextMenuService,
  EObjectFeature,
  NodeManagerUtils,
  ConnectionSchemaManagerService,
  isObjectCatalogProvider, isObjectSchemaProvider, INodeMenuData
} from '@cloudbeaver/core-app';
import { isConnectionProvider } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ContextMenuService } from '@cloudbeaver/core-dialogs';
import { ExtensionUtils } from '@cloudbeaver/core-extensions';
import { ViewService } from '@cloudbeaver/core-view';

import { SqlEditorNavigatorService } from './SqlEditorNavigatorService';

@injectable()
export class SqlEditorBootstrap extends Bootstrap {
  constructor(
    private mainMenuService: MainMenuService,
    private contextMenuService: ContextMenuService,
    private sqlEditorNavigatorService: SqlEditorNavigatorService,
    private connectionSchemaManagerService: ConnectionSchemaManagerService,
    private viewService: ViewService
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
    this.contextMenuService.addMenuItem<INodeMenuData>(this.contextMenuService.getRootMenuToken(), {
      id: 'open-sql-editor',
      title: 'SQL',
      order: 2,
      isPresent(context) {
        return context.contextType === NavNodeContextMenuService.nodeContextType
          && context.data.node.objectFeatures.includes(EObjectFeature.dataSource);
      },
      onClick: context => {
        const node = context.data.node;
        const connectionId = NodeManagerUtils.connectionNodeIdToConnectionId(node.id);
        this.sqlEditorNavigatorService.openNewEditor(connectionId);
      },
    });
  }

  load(): void { }

  private isSQLEntryDisabled() {
    const activeView = this.viewService.activeView;
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

    const activeView = this.viewService.activeView;

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
