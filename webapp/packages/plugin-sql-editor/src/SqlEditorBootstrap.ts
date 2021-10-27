/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  MainMenuService,
  EObjectFeature,
  ConnectionSchemaManagerService,
  isObjectCatalogProvider, isObjectSchemaProvider, DATA_CONTEXT_NAV_NODE
} from '@cloudbeaver/core-app';
import { isConnectionProvider } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ExtensionUtils } from '@cloudbeaver/core-extensions';
import { ActionService, DATA_CONTEXT_MENU_NESTED, MenuService, ViewService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_CONNECTION } from '@cloudbeaver/plugin-connections';

import { ACTION_SQL_EDITOR_OPEN } from './ACTION_SQL_EDITOR_OPEN';
import { SqlEditorNavigatorService } from './SqlEditorNavigatorService';

@injectable()
export class SqlEditorBootstrap extends Bootstrap {
  constructor(
    private mainMenuService: MainMenuService,
    private sqlEditorNavigatorService: SqlEditorNavigatorService,
    private connectionSchemaManagerService: ConnectionSchemaManagerService,
    private viewService: ViewService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
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

    this.menuService.addCreator({
      isApplicable: context => {
        const connection = context.tryGet(DATA_CONTEXT_CONNECTION);

        if (!connection) {
          return false;
        }

        const node = context.tryGet(DATA_CONTEXT_NAV_NODE);

        if (node && !node.objectFeatures.includes(EObjectFeature.dataSource)) {
          return false;
        }

        return !context.has(DATA_CONTEXT_MENU_NESTED);
      },
      getItems: (context, items) => [
        ...items,
        ACTION_SQL_EDITOR_OPEN,
      ],
    });

    this.actionService.addHandler({
      id: 'sql-editor',
      isActionApplicable: (context, action) => action === ACTION_SQL_EDITOR_OPEN,
      handler: async (context, action) => {
        const connection = context.get(DATA_CONTEXT_CONNECTION);

        this.sqlEditorNavigatorService.openNewEditor(connection.id);
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
