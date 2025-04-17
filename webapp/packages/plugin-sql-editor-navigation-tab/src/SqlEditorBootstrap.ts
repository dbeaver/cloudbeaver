/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { RenameDialog } from '@cloudbeaver/core-blocks';
import {
  type Connection,
  ConnectionInfoResource,
  createConnectionParam,
  DATA_CONTEXT_CONNECTION,
  type IConnectionInfoParams,
  isConnectionProvider,
  isObjectCatalogProvider,
  isObjectSchemaProvider,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IExecutorHandler } from '@cloudbeaver/core-executor';
import { ExtensionUtils } from '@cloudbeaver/core-extensions';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { DATA_CONTEXT_NAV_NODE, EObjectFeature, NodeManagerUtils } from '@cloudbeaver/core-navigation-tree';
import { type ISessionAction, sessionActionContext, SessionActionService } from '@cloudbeaver/core-root';
import { ACTION_RENAME, ActionService, menuExtractItems, MenuService, ViewService } from '@cloudbeaver/core-view';
import { MENU_CONNECTIONS } from '@cloudbeaver/plugin-connections';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import {
  DATA_CONTEXT_SQL_EDITOR_STATE,
  ESqlDataSourceFeatures,
  getSqlEditorName,
  LocalStorageSqlDataSource,
  SqlDataSourceService,
  SqlEditorService,
  SqlEditorSettingsService,
} from '@cloudbeaver/plugin-sql-editor';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ACTION_SQL_EDITOR_NEW } from './ACTION_SQL_EDITOR_NEW.js';
import { ACTION_SQL_EDITOR_OPEN } from './ACTION_SQL_EDITOR_OPEN.js';
import { DATA_CONTEXT_SQL_EDITOR_TAB } from './DATA_CONTEXT_SQL_EDITOR_TAB.js';
import { isSessionActionOpenSQLEditor } from './sessionActionOpenSQLEditor.js';
import { SQL_EDITOR_SOURCE_ACTION } from './SQL_EDITOR_SOURCE_ACTION.js';
import { SqlEditorNavigatorService } from './SqlEditorNavigatorService.js';
import { SqlEditorTabService } from './SqlEditorTabService.js';

interface IActiveConnectionContext {
  connectionKey?: IConnectionInfoParams;
  catalogId?: string;
  schemaId?: string;
}

@injectable()
export class SqlEditorBootstrap extends Bootstrap {
  constructor(
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly viewService: ViewService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sessionActionService: SessionActionService,
    private readonly commonDialogService: CommonDialogService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly sqlEditorService: SqlEditorService,
    private readonly localizationService: LocalizationService,
    private readonly sqlEditorSettingsService: SqlEditorSettingsService,
  ) {
    super();
  }

  override register(): void {
    this.registerTopAppBarItem();

    this.menuService.addCreator({
      contexts: [DATA_CONTEXT_SQL_EDITOR_STATE, DATA_CONTEXT_SQL_EDITOR_TAB],
      getItems: (context, items) => [...items, ACTION_RENAME],
      orderItems: (context, items) => {
        const actions = menuExtractItems(items, [ACTION_RENAME]);

        if (actions.length > 0) {
          items.unshift(...actions);
        }

        return items;
      },
    });

    this.menuService.addCreator({
      root: true,
      contexts: [DATA_CONTEXT_CONNECTION],
      isApplicable: context => {
        const node = context.get(DATA_CONTEXT_NAV_NODE);

        if (node && !node.objectFeatures.includes(EObjectFeature.dataSource)) {
          return false;
        }

        return true;
      },
      getItems: (context, items) => [...items, ACTION_SQL_EDITOR_OPEN],
    });

    this.actionService.addHandler({
      id: 'sql-editor',
      isActionApplicable: (context, action) => {
        switch (action) {
          case ACTION_RENAME: {
            const editorState = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);

            if (!editorState) {
              return false;
            }

            const dataSource = this.sqlDataSourceService.get(editorState.editorId);

            return dataSource?.hasFeature(ESqlDataSourceFeatures.setName) ?? false;
          }
          case ACTION_SQL_EDITOR_OPEN:
            return context.has(DATA_CONTEXT_CONNECTION);
        }
        return false;
      },
      handler: async (context, action) => {
        switch (action) {
          case ACTION_RENAME: {
            const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
            const dataSource = this.sqlDataSourceService.get(state.editorId);
            const executionContext = dataSource?.executionContext;

            if (!dataSource) {
              return;
            }

            let connection: Connection | undefined;

            if (executionContext) {
              connection = this.connectionInfoResource.get(createConnectionParam(executionContext.projectId, executionContext.connectionId));
            }

            const name = getSqlEditorName(state, dataSource, connection);
            const regexp = /^(.*?)(\.\w+)$/gi.exec(name);

            const result = await this.commonDialogService.open(RenameDialog, {
              name: regexp?.[1] ?? name,
              objectName: name,
              icon: dataSource.icon,
              validation: name =>
                !this.sqlEditorTabService.sqlEditorTabs.some(
                  tab => tab.handlerState.order !== state.order && this.sqlEditorService.getName(tab.handlerState) === name.trim(),
                ) && dataSource.canRename(name),
            });

            if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
              dataSource.setName((result ?? '').trim());
            }
            break;
          }
          case ACTION_SQL_EDITOR_OPEN: {
            const connectionKey = context.get(DATA_CONTEXT_CONNECTION)!;

            this.sqlEditorNavigatorService.openNewEditor({
              dataSourceKey: LocalStorageSqlDataSource.key,
              connectionKey,
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

  private registerTopAppBarItem() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [...items, ACTION_SQL_EDITOR_NEW],
      orderItems: (context, items) => {
        let placeIndex = items.indexOf(ACTION_SQL_EDITOR_NEW);

        const actionsOpen = menuExtractItems(items, [ACTION_SQL_EDITOR_NEW]);

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
      actions: [ACTION_SQL_EDITOR_NEW],
      isLabelVisible: () => false,
      getActionInfo: (context, action) => {
        const connectionContext = this.getActiveConnectionContext();
        const schemaAndCatalog = NodeManagerUtils.concatSchemaAndCatalog(connectionContext.catalogId, connectionContext.schemaId);

        let tooltip = action.info.tooltip;

        if (connectionContext.connectionKey) {
          const connectionInfo = this.connectionInfoResource.get(connectionContext.connectionKey);

          if (connectionInfo) {
            tooltip = this.localizationService.translate(
              'plugin_sql_editor_navigation_tab_action_sql_editor_new_tooltip_context',
              'plugin_sql_editor_navigation_tab_action_sql_editor_new_tooltip',
              {
                connection: `${connectionInfo.name}${schemaAndCatalog ? ' ' + schemaAndCatalog : ''}`,
              },
            );
          }
        }

        return {
          ...action.info,
          tooltip,
        };
      },
      isHidden: (context, action) => {
        if (action === ACTION_SQL_EDITOR_NEW) {
          return this.sqlEditorSettingsService.disabled;
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

  private getActiveConnectionContext(): IActiveConnectionContext {
    let connectionKey: IConnectionInfoParams | undefined;
    let catalogId: string | undefined;
    let schemaId: string | undefined;

    for (const activeView of this.viewService.activeViews) {
      ExtensionUtils.from(activeView.extensions)
        .on(isConnectionProvider, extension => {
          connectionKey = extension(activeView.context);
        })
        .on(isObjectCatalogProvider, extension => {
          catalogId = extension(activeView.context);
        })
        .on(isObjectSchemaProvider, extension => {
          schemaId = extension(activeView.context);
        });

      if (connectionKey) {
        break;
      }
    }

    return {
      connectionKey,
      catalogId,
      schemaId,
    };
  }

  private openSQLEditor() {
    const connectionContext = this.getActiveConnectionContext();

    this.sqlEditorNavigatorService.openNewEditor({
      dataSourceKey: LocalStorageSqlDataSource.key,
      connectionKey: connectionContext.connectionKey,
      catalogId: connectionContext.catalogId,
      schemaId: connectionContext.schemaId,
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
