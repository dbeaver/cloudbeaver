/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_TABS_CONTEXT, MENU_TAB } from '@cloudbeaver/core-ui';
import { ActionService, DATA_CONTEXT_MENU, menuExtractItems, MenuService } from '@cloudbeaver/core-view';

import { ACTION_TAB_CLOSE_SQL_RESULT_GROUP } from './ACTION_TAB_CLOSE_SQL_RESULT_GROUP';
import { DATA_CONTEXT_SQL_EDITOR_STATE } from './DATA_CONTEXT_SQL_EDITOR_STATE';
import { DATA_CONTEXT_SQL_EDITOR_RESULT_ID } from './SqlResultTabs/DATA_CONTEXT_SQL_EDITOR_RESULT_ID';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

@injectable()
export class SqlEditorGroupTabsBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
    private readonly sqlResultTabsService: SqlResultTabsService,
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable: context => {
        const tab = context.tryGet(DATA_CONTEXT_SQL_EDITOR_RESULT_ID);
        const state = context.tryGet(DATA_CONTEXT_TABS_CONTEXT);
        const menu = context.hasValue(DATA_CONTEXT_MENU, MENU_TAB);
        return !!tab && !!state?.enabledBaseActions && menu;
      },
      getItems: (context, items) => [...items, ACTION_TAB_CLOSE_SQL_RESULT_GROUP],
      orderItems: (context, items) => {
        const actions = menuExtractItems(items, [ACTION_TAB_CLOSE_SQL_RESULT_GROUP]);

        if (actions.length > 0) {
          items.push(...actions);
        }

        return items;
      },
    });

    this.actionService.addHandler({
      id: 'result-tabs-group-base-handler',
      isActionApplicable: (context, action) => {
        const menu = context.hasValue(DATA_CONTEXT_MENU, MENU_TAB);
        const tab = context.tryGet(DATA_CONTEXT_SQL_EDITOR_RESULT_ID);
        const sqlEditorState = context.tryGet(DATA_CONTEXT_SQL_EDITOR_STATE);

        const groupId = sqlEditorState?.resultTabs.find(tabState => tabState.tabId === tab?.id)?.groupId;
        const hasTabsInGroup = (sqlEditorState?.resultTabs.filter(tabState => tabState.groupId === groupId) ?? []).length > 1;

        if (!menu || !tab || !hasTabsInGroup) {
          return false;
        }
        return [ACTION_TAB_CLOSE_SQL_RESULT_GROUP].includes(action);
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
    const tab = context.get(DATA_CONTEXT_SQL_EDITOR_RESULT_ID);
    const sqlEditorState = context.get(DATA_CONTEXT_SQL_EDITOR_STATE);
    const tabsContext = context.get(DATA_CONTEXT_TABS_CONTEXT);
    const resultTabs = this.sqlResultTabsService.getResultTabs(sqlEditorState);

    const resultTab = resultTabs.find(tabState => tabState.tabId === tab.id);
    const groupResultTabs = resultTabs.filter(tab => tab.groupId === resultTab?.groupId);

    groupResultTabs.forEach(groupTab => {
      tabsContext.close(groupTab.tabId);
    });
  }
}
