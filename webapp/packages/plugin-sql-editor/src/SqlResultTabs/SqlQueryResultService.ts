/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { uuid } from '@cloudbeaver/core-utils';
import { type IDatabaseDataModel, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { IResultGroup, IResultTab, ISqlEditorTabState, IStatisticsTab } from '../ISqlEditorTabState.js';
import type { QueryDataSource } from '../QueryDataSource.js';

@injectable()
export class SqlQueryResultService {
  constructor(private readonly tableViewerStorageService: TableViewerStorageService) {}

  getSelectedGroup(editorState: ISqlEditorTabState): IResultGroup | null {
    const currentTab = editorState.tabs.find(tab => tab.id === editorState.currentTabId);
    const resultTab = editorState.resultTabs.find(tab => tab.tabId === currentTab?.id);

    if (!resultTab) {
      return null;
    }

    return editorState.resultGroups.find(group => group.groupId === resultTab.groupId) || null;
  }

  getGroups(editorState: ISqlEditorTabState): IResultGroup[] {
    return editorState.resultGroups;
  }

  getGroup(editorState: ISqlEditorTabState, groupId: string): IResultGroup | undefined {
    return editorState.resultGroups.find(group => group.groupId === groupId);
  }

  getModelGroup(editorState: ISqlEditorTabState, modelId: string): IResultGroup | undefined {
    return editorState.resultGroups.find(group => group.modelId === modelId);
  }

  updateGroupTabs(
    editorState: ISqlEditorTabState,
    model: IDatabaseDataModel<QueryDataSource>,
    groupId: string,
    selectFirstResult?: boolean,
    resultCount?: number,
  ): void {
    const group = this.getGroup(editorState, groupId);

    if (!group) {
      return;
    }

    this.createTabsForGroup(editorState, group, model, resultCount);

    const tabsToRemove = editorState.resultTabs
      .filter(
        resultTab => resultTab.groupId === groupId && resultTab.indexInResultSet !== 0 && resultTab.indexInResultSet >= model.source.results.length,
      )
      .map(tab => tab.tabId);

    editorState.tabs = editorState.tabs.filter(resultTab => !tabsToRemove.includes(resultTab.id));
    editorState.resultTabs = editorState.resultTabs.filter(resultTab => !tabsToRemove.includes(resultTab.tabId));

    if (selectFirstResult) {
      this.selectFirstResult(editorState, groupId);
    }
  }

  createGroup(tabState: ISqlEditorTabState, modelId: string, query: string, nameOrder?: number): IResultGroup {
    const groupId = uuid();
    const order = Math.max(0, ...tabState.tabs.map(tab => tab.order + 1));

    tabState.resultGroups.push({
      groupId,
      modelId,
      order,
      nameOrder: nameOrder ?? this.getGroupNameOrder(tabState),
      query,
    });

    return tabState.resultGroups.find(group => group.groupId === groupId)!;
  }

  createStatisticsTab(tabState: ISqlEditorTabState): IStatisticsTab {
    const nameOrder = this.getGroupNameOrder(tabState);
    const order = Math.max(0, ...tabState.tabs.map(tab => tab.order + 1));
    const id = uuid();

    tabState.statisticsTabs.push({
      tabId: id,
      order: nameOrder,
    });

    tabState.tabs.push({
      id,
      name: `Statistics - ${nameOrder}`,
      icon: 'table-icon',
      order,
    });

    return tabState.statisticsTabs.find(tab => tab.tabId === id)!;
  }

  removeStatisticsTab(tabState: ISqlEditorTabState, tabId: string): void {
    tabState.tabs = tabState.tabs.filter(tab => tab.id !== tabId);
    tabState.statisticsTabs = tabState.statisticsTabs.filter(tab => tab.tabId !== tabId);
  }

  removeGroup(tabState: ISqlEditorTabState, groupId: string): void {
    const group = this.getGroup(tabState, groupId);

    if (!group) {
      return;
    }

    const tabsToRemove = tabState.resultTabs.filter(tab => tab.groupId === groupId).map(tab => tab.tabId);

    tabState.tabs = tabState.tabs.filter(tab => !tabsToRemove.includes(tab.id));
    tabState.resultGroups = tabState.resultGroups.filter(group => group.groupId !== groupId);
    tabState.resultTabs = tabState.resultTabs.filter(tab => tab.groupId !== groupId);
    tabState.currentTabId = tabState.tabs[0]?.id;
    this.tableViewerStorageService.remove(group.modelId);
  }

  getGroupNameOrder(tabState: ISqlEditorTabState) {
    return Math.max(1, ...tabState.resultGroups.map(group => group.nameOrder + 1), ...tabState.statisticsTabs.map(tab => tab.order + 1));
  }

  async canCloseResultTab(state: ISqlEditorTabState, tabId: string): Promise<boolean> {
    const resultTab = state.resultTabs.find(resultTab => resultTab.tabId === tabId);
    const group = state.resultGroups.find(group => group.groupId === resultTab?.groupId);

    if (resultTab && group) {
      const model = this.tableViewerStorageService.get(group.modelId);

      if (model) {
        return await model.source.canSafelyDispose();
      }
    }
    return true;
  }

  removeResultTab(state: ISqlEditorTabState, tabId: string): void {
    const resultTab = state.resultTabs.find(resultTab => resultTab.tabId === tabId);
    const group = state.resultGroups.find(group => group.groupId === resultTab?.groupId);

    if (resultTab && group) {
      state.resultTabs.splice(state.resultTabs.indexOf(resultTab), 1);

      const isGroupEmpty = !state.resultTabs.some(resultTab => resultTab.groupId === group.groupId);

      if (isGroupEmpty) {
        state.resultGroups.splice(state.resultGroups.indexOf(group), 1);
        const model = this.tableViewerStorageService.get(group.modelId);

        model?.dispose().then(() => {
          this.tableViewerStorageService.remove(group.modelId);
        });
      }
    }
  }

  selectResult(editorState: ISqlEditorTabState, groupId: string, resultIndex: number) {
    const resultTab = editorState.resultTabs
      .filter(resultTab => resultTab.groupId === groupId)
      .sort((a, b) => {
        if (a.indexInResultSet === resultIndex) {
          return -1;
        }
        return a.indexInResultSet - b.indexInResultSet;
      });

    editorState.currentTabId = resultTab[0]!.tabId;
  }

  selectFirstResult(editorState: ISqlEditorTabState, groupId: string) {
    const mainTab = editorState.resultTabs.filter(resultTab => resultTab.groupId === groupId).sort((a, b) => a.indexInResultSet - b.indexInResultSet);

    editorState.currentTabId = mainTab[0]!.tabId;
  }

  private createTabsForGroup(state: ISqlEditorTabState, group: IResultGroup, model: IDatabaseDataModel<QueryDataSource>, resultCount?: number) {
    this.createResultTabForGroup(state, group, model, 0, resultCount);

    for (let i = 1; i < model.source.results.length; i++) {
      this.createResultTabForGroup(state, group, model, i, resultCount);
    }
  }

  private createResultTabForGroup(
    state: ISqlEditorTabState,
    group: IResultGroup,
    model: IDatabaseDataModel<QueryDataSource>,
    indexInResultSet: number,
    resultCount?: number,
  ) {
    const resultTab = state.resultTabs.find(tab => tab.groupId === group.groupId && tab.indexInResultSet === indexInResultSet);

    if (!resultTab) {
      this.createResultTab(state, group, indexInResultSet, model.source.results.length, resultCount);
    } else {
      const tab = state.tabs.find(tab => tab.id === resultTab.tabId);

      if (tab) {
        tab.name = this.getTabNameForOrder(group.nameOrder, indexInResultSet, model.source.results.length, resultCount);
      }
    }
  }

  updateResultTab(state: ISqlEditorTabState, id: string, resultTab: Partial<IResultTab>) {
    const index = state.resultTabs.findIndex(tab => tab.tabId === id);

    if (index === -1) {
      return;
    }

    state.resultTabs[index] = { ...state.resultTabs[index]!, ...resultTab };
  }

  private createResultTab(state: ISqlEditorTabState, group: IResultGroup, indexInResultSet: number, results: number, resultCount?: number) {
    const id = uuid();

    state.resultTabs.push({
      tabId: id,
      groupId: group.groupId,
      indexInResultSet,
      presentationId: '',
      valuePresentationId: null,
    });

    state.tabs.push({
      id,
      name: this.getTabNameForOrder(group.nameOrder, indexInResultSet, results, resultCount),
      icon: 'table-icon',
      order: group.order,
    });
  }

  getTabNameForOrder(order: number, indexInResultSet: number, results: number, resultCount?: number) {
    let name = `Result - ${order}`;

    if (resultCount) {
      name += ` <${resultCount}>`;
    }

    if (results > 1) {
      name += ` (${indexInResultSet + 1})`;
    }

    return name;
  }
}
