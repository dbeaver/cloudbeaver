/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Connection, ConnectionInfoResource, createConnectionParam, IConnectionInfoParams, isConnectionProvider, isObjectCatalogProvider, isObjectSchemaProvider } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, RenameDialog } from '@cloudbeaver/core-dialogs';
import type { IExecutorHandler } from '@cloudbeaver/core-executor';
import { ExtensionUtils } from '@cloudbeaver/core-extensions';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature } from '@cloudbeaver/core-navigation-tree';
import { ISessionAction, sessionActionContext, SessionActionService } from '@cloudbeaver/core-root';
import { ActionService, ACTION_RENAME, DATA_CONTEXT_MENU_NESTED, menuExtractItems, MenuService, ViewService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_CONNECTION, MENU_CONNECTIONS } from '@cloudbeaver/plugin-connections';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { DATA_CONTEXT_SQL_EDITOR_STATE, ESqlDataSourceFeatures, getSqlEditorName, LocalStorageSqlDataSource, SqlDataSourceService, SqlEditorService, SqlEditorSettingsService } from '@cloudbeaver/plugin-sql-editor';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ACTION_SQL_EDITOR_NEW } from './ACTION_SQL_EDITOR_NEW';
import { ACTION_SQL_EDITOR_OPEN } from './ACTION_SQL_EDITOR_OPEN';
import { DATA_CONTEXT_SQL_EDITOR_TAB } from './DATA_CONTEXT_SQL_EDITOR_TAB';
import { isSessionActionOpenSQLEditor } from './sessionActionOpenSQLEditor';
import { SQL_EDITOR_SOURCE_ACTION } from './SQL_EDITOR_SOURCE_ACTION';
import { SqlEditorNavigatorService } from './SqlEditorNavigatorService';
import { SqlEditorTabService } from './SqlEditorTabService';

@injectable()
export class SqlEditorBootstrap extends Bootstrap {
  constructor(
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly viewService: ViewService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sessionActionService: SessionActionService,
    private readonly commonDialogService: CommonDialogService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly sqlEditorService: SqlEditorService,
    private readonly sqlEditorSettingsService: SqlEditorSettingsService,
  ) {
    super();
  }

  register(): void {
    this.registerTopAppBarItem();

    this.menuService.addCreator({
      isApplicable: context => context.has(DATA_CONTEXT_SQL_EDITOR_STATE) && context.has(DATA_CONTEXT_SQL_EDITOR_TAB),
      getItems: (context, items) => [
        ...items,
        ACTION_RENAME,
      ],
      orderItems: (context, items) => {
        const actions = menuExtractItems(items, [
          ACTION_RENAME,
        ]);

        if (actions.length > 0) {
          items.unshift(...actions);
        }

        return items;
      },
    });

    this.menuService.addCreator({
      isApplicable: context => {
        if (!context.has(DATA_CONTEXT_CONNECTION)) {
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
      isActionApplicable: (context, action) => {
        if (action === ACTION_RENAME) {
          const editorState = context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE);

          if (!editorState) {
            return false;
          }

          const dataSource = this.sqlDataSourceService.get(editorState.editorId);

          return dataSource?.hasFeature(ESqlDataSourceFeatures.setName) ?? false;
        }
        return (
          action === ACTION_SQL_EDITOR_OPEN
          && context.has(DATA_CONTEXT_CONNECTION)
        );
      },
      handler: async (context, action) => {
        switch (action) {
          case ACTION_RENAME: {
            const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);
            const dataSource = this.sqlDataSourceService.get(state.editorId);

            if (!dataSource) {
              return;
            }

            let connection: Connection | undefined;

            if (dataSource.executionContext) {
              connection = this.connectionInfoResource.get({
                projectId: dataSource.executionContext.projectId,
                connectionId: dataSource.executionContext.connectionId,
              });
            }

            const name = getSqlEditorName(state, dataSource, connection);
            const regexp = /^(.*?)(\.\w+)$/ig.exec(name);

            const result = await this.commonDialogService.open(RenameDialog, {
              value: regexp?.[1] ?? name,
              objectName: name,
              icon: '/icons/sql_script_m.svg',
              validation: name => (
                !this.sqlEditorTabService.sqlEditorTabs.some(tab => (
                  tab.handlerState.order !== state.order
                  && this.sqlEditorService.getName(tab.handlerState) === name.trim()
                ))
                && dataSource.canRename(name)
              ),
            });

            if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
              dataSource.setName((result ?? '').trim());
            }
            break;
          }
          case ACTION_SQL_EDITOR_OPEN: {
            const connection = context.get(DATA_CONTEXT_CONNECTION);

            this.sqlEditorNavigatorService.openNewEditor({
              dataSourceKey: LocalStorageSqlDataSource.key,
              connectionKey: createConnectionParam(connection),
            });
            break;
          }
        }
      },
    });

    this.navigationTabsService.onInit.addHandler(state => {
      if (state) {
        this.sessionActionService.onAction.addHandler(this.handleAction);
      } else {
        this.sessionActionService.onAction.removeHandler(this.handleAction);
      }
    });
  }

  load(): void { }

  private registerTopAppBarItem() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [
        ...items,
        ACTION_SQL_EDITOR_NEW,
      ],
      orderItems: (context, items) => {
        let placeIndex = items.indexOf(ACTION_SQL_EDITOR_NEW);

        const actionsOpen = menuExtractItems(items, [
          ACTION_SQL_EDITOR_NEW,
        ]);

        const connectionsIndex = items.indexOf(MENU_CONNECTIONS);

        if (connectionsIndex !== -1) {
          placeIndex = connectionsIndex + 1;
        }

        items.splice(placeIndex, 0, ...actionsOpen);

        return items;
      },
    });

    this.actionService.addHandler({
      id: 'sql-editor-new',
      isActionApplicable: (context, action) => [
        ACTION_SQL_EDITOR_NEW,
      ].includes(action),
      isLabelVisible: () => false,
      isHidden: (context, action) => {
        if (action === ACTION_SQL_EDITOR_NEW) {
          return this.sqlEditorSettingsService.settings.getValue('disabled');
        }

        return false;
      },
      handler: (context, action) => {
        switch (action) {
          case ACTION_SQL_EDITOR_NEW: {
            this.openSQLEditor();
            break;
          }
        }
      },
    });
  }

  private openSQLEditor() {
    let connectionKey: IConnectionInfoParams | undefined;
    let catalogId: string | undefined;
    let schemaId: string | undefined;

    const activeView = this.viewService.activeView;

    if (activeView) {
      ExtensionUtils.from(activeView.extensions)
        .on(isConnectionProvider, extension => { connectionKey = extension(activeView.context); })
        .on(isObjectCatalogProvider, extension => { catalogId = extension(activeView.context); })
        .on(isObjectSchemaProvider, extension => { schemaId = extension(activeView.context); });
    } else {
      connectionKey = this.connectionSchemaManagerService.currentConnectionKey || undefined;
      catalogId = this.connectionSchemaManagerService.currentObjectCatalogId;
      schemaId = this.connectionSchemaManagerService.currentObjectSchemaId;
    }

    this.sqlEditorNavigatorService.openNewEditor({
      dataSourceKey: LocalStorageSqlDataSource.key,
      connectionKey,
      catalogId,
      schemaId,
    });
  }

  private readonly handleAction: IExecutorHandler<ISessionAction | null> = (data, contexts) => {
    const processInfo = contexts.getContext(sessionActionContext);

    if (isSessionActionOpenSQLEditor(data)) {
      try {
        this.sqlEditorNavigatorService.openNewEditor({
          dataSourceKey: LocalStorageSqlDataSource.key,
          name: data['editor-name'],
          connectionKey: createConnectionParam(data['project-id'], data['connection-id']),
          source: SQL_EDITOR_SOURCE_ACTION,
        });
      } finally {
        processInfo.process();
      }
    }
  };
}
