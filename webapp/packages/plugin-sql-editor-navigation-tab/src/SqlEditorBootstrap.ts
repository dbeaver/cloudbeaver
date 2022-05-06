/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import {
  MainMenuService,
  EObjectFeature,
  ConnectionSchemaManagerService,
  isObjectCatalogProvider, isObjectSchemaProvider, DATA_CONTEXT_NAV_NODE, NavigationTabsService
} from '@cloudbeaver/core-app';
import { isConnectionProvider } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, RenameDialog } from '@cloudbeaver/core-dialogs';
import type { IExecutorHandler } from '@cloudbeaver/core-executor';
import { ExtensionUtils } from '@cloudbeaver/core-extensions';
import { ISessionAction, sessionActionContext, SessionActionService } from '@cloudbeaver/core-root';
import { ActionService, ACTION_RENAME, DATA_CONTEXT_MENU_NESTED, menuExtractActions, MenuService, ViewService } from '@cloudbeaver/core-view';
import { DATA_CONTEXT_CONNECTION } from '@cloudbeaver/plugin-connections';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from '@cloudbeaver/plugin-sql-editor';

import { ACTION_SQL_EDITOR_OPEN } from './ACTION_SQL_EDITOR_OPEN';
import { DATA_CONTEXT_SQL_EDITOR_TAB } from './DATA_CONTEXT_SQL_EDITOR_TAB';
import { isSessionActionOpenSQLEditor } from './sessionActionOpenSQLEditor';
import { SQL_EDITOR_SOURCE_ACTION } from './SQL_EDITOR_SOURCE_ACTION';
import { SqlEditorNavigatorService } from './SqlEditorNavigatorService';
import { SqlEditorTabService } from './SqlEditorTabService';

@injectable()
export class SqlEditorBootstrap extends Bootstrap {
  constructor(
    private readonly mainMenuService: MainMenuService,
    private readonly sqlEditorNavigatorService: SqlEditorNavigatorService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly viewService: ViewService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sessionActionService: SessionActionService,
    private readonly commonDialogService: CommonDialogService,
    private readonly sqlEditorTabService: SqlEditorTabService
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
      isApplicable: context => context.has(DATA_CONTEXT_SQL_EDITOR_STATE) && context.has(DATA_CONTEXT_SQL_EDITOR_TAB),
      getItems: (context, items) => [
        ...items,
        ACTION_RENAME,
      ],
      orderItems: (context, items) => {
        const actions = menuExtractActions(items, [
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
      isActionApplicable: (context, action) => (
        (
          action === ACTION_RENAME
          && context.has(DATA_CONTEXT_SQL_EDITOR_STATE)
          && context.has(DATA_CONTEXT_SQL_EDITOR_TAB)
        ) || (
          action === ACTION_SQL_EDITOR_OPEN
          && context.has(DATA_CONTEXT_CONNECTION)
        )
      ),
      handler: async (context, action) => {
        switch (action) {
          case ACTION_RENAME: {
            const state = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);

            const name = this.sqlEditorTabService.getName(state);

            const result = await this.commonDialogService.open(RenameDialog, {
              value: name,
              objectName: name,
              icon: '/icons/sql_script_m.svg',
              validation: name => !this.sqlEditorTabService.sqlEditorTabs.some(tab => (
                tab.handlerState.order !== state.order
                && this.sqlEditorTabService.getName(tab.handlerState) === name.trim()
              )),
            });

            if (result !== DialogueStateResult.Rejected && result !== DialogueStateResult.Resolved) {
              state.name = (result ?? '').trim();
            }
            break;
          }
          case ACTION_SQL_EDITOR_OPEN: {
            const connection = context.get(DATA_CONTEXT_CONNECTION);

            this.sqlEditorNavigatorService.openNewEditor({ connectionId: connection.id });
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

    this.sqlEditorNavigatorService.openNewEditor({ connectionId, catalogId, schemaId });
  }

  private readonly handleAction: IExecutorHandler<ISessionAction | null> = (data, contexts) => {
    const processInfo = contexts.getContext(sessionActionContext);

    if (isSessionActionOpenSQLEditor(data)) {
      try {
        this.sqlEditorNavigatorService.openNewEditor({
          name: data['editor-name'],
          connectionId: data['connection-id'],
          source: SQL_EDITOR_SOURCE_ACTION,
        });
      } finally {
        processInfo.process();
      }
    }
  };
}
