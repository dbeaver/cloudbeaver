/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_TABS_CONTEXT, MENU_TAB } from '@cloudbeaver/core-ui';
import { ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';

import { ACTION_TAB_CLOSE_SQL_RESULT_GROUP } from './ACTION_TAB_CLOSE_SQL_RESULT_GROUP.js';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from './DATA_CONTEXT_SQL_EDITOR_STATE.js';
import { DATA_CONTEXT_SQL_EDITOR_RESULT_ID } from './SqlResultTabs/DATA_CONTEXT_SQL_EDITOR_RESULT_ID.js';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService.js';
import { SqlScriptErrorService } from './SqlResultTabs/SqlScriptErrorService.js';

export class SqlEditorGroupTabsBootstrapImpl extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sqlResultTabsService: SqlResultTabsService,
    private readonly sqlScriptErrorService: SqlScriptErrorService,
  ) {
    super();
  }

  override register(): void {
    this.sqlScriptErrorService.register();

    this.menuService.addCreator({
      menus: [MENU_TAB],
      contexts: [DATA_CONTEXT_SQL_EDITOR_RESULT_ID, DATA_CONTEXT_SQL_EDITOR_STATE],
      isApplicable: context => {
        const state = context.get(DATA_CONTEXT_TABS_CONTEXT);
        return !!state?.enabledBaseActions;
      },
      getItems: (context, items) => [...items, ACTION_TAB_CLOSE_SQL_RESULT_GROUP],
      orderItems: (context, items) => {
        items.push(...menuExtractItems(items, [ACTION_TAB_CLOSE_SQL_RESULT_GROUP]));
        return items;
      },
    });

    this.actionService.addHandler({
      id: 'result-tabs-group-base-handler',
      actions: [ACTION_TAB_CLOSE_SQL_RESULT_GROUP],
      menus: [MENU_TAB],
      contexts: [DATA_CONTEXT_SQL_EDITOR_RESULT_ID, DATA_CONTEXT_SQL_EDITOR_STATE, DATA_CONTEXT_TABS_CONTEXT],
      isActionApplicable: context => {
        const tab = context.get(DATA_CONTEXT_SQL_EDITOR_RESULT_ID)!;
        const sqlEditorState = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;

        const groupId = sqlEditorState?.resultTabs.find(tabState => tabState.tabId === tab.id)?.groupId;
        const hasTabsInGroup = sqlEditorState.resultTabs.filter(tabState => tabState.groupId === groupId).length > 1;

        return hasTabsInGroup;
      },
      handler: async (context, action) => {
        switch (action) {
          case ACTION_TAB_CLOSE_SQL_RESULT_GROUP:
            this.closeResultTabGroup(context);
            break;
          default:
            break;
        }
      },
    });
  }

  async closeResultTabGroup(context: IDataContextProvider) {
    const tab = context.get(DATA_CONTEXT_SQL_EDITOR_RESULT_ID)!;
    const sqlEditorState = context.get(DATA_CONTEXT_SQL_EDITOR_STATE)!;
    const tabsContext = context.get(DATA_CONTEXT_TABS_CONTEXT)!;
    const resultTabs = this.sqlResultTabsService.getResultTabs(sqlEditorState);

    const resultTab = resultTabs.find(tabState => tabState.tabId === tab.id);
    const groupResultTabs = resultTabs.filter(tab => tab.groupId === resultTab?.groupId);

    groupResultTabs.forEach(groupTab => {
      tabsContext.close(groupTab.tabId);
    });
  }
}

export type SqlEditorGroupTabsBootstrap = SqlEditorGroupTabsBootstrapImpl;

export class SqlEditorGroupTabsBootstrapDI extends Context.Service<SqlEditorGroupTabsBootstrapDI, SqlEditorGroupTabsBootstrapImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlEditorGroupTabsBootstrap#SqlEditorGroupTabsBootstrap',
) {
  static readonly implementation = SqlEditorGroupTabsBootstrapImpl;

  static readonly dependencies = () => [ActionService, MenuService, SqlResultTabsService, SqlScriptErrorService] as const;
  static readonly make: Effect.Effect<
    SqlEditorGroupTabsBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof SqlResultTabsService>
    | Context.Service.Identifier<typeof SqlScriptErrorService>
  > = Effect.gen(function* makeSqlEditorGroupTabsBootstrap() {
    const actionService = yield* ActionService;
    const menuService = yield* MenuService;
    const sqlResultTabsService = yield* SqlResultTabsService;
    const sqlScriptErrorService = yield* SqlScriptErrorService;

    return new SqlEditorGroupTabsBootstrapImpl(actionService, menuService, sqlResultTabsService, sqlScriptErrorService);
  });
  static readonly layer: Layer.Layer<
    SqlEditorGroupTabsBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof SqlResultTabsService>
    | Context.Service.Identifier<typeof SqlScriptErrorService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlEditorGroupTabsBootstrap = SqlEditorGroupTabsBootstrapDI;
