/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { uuid } from '@cloudbeaver/core-utils';
import { IDatabaseDataModel, IDatabaseResultSet, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { IResultGroup, ISqlEditorTabState, IStatisticsTab } from '../ISqlEditorTabState';
import type { IDataQueryOptions } from '../QueryDataSource';

@injectable()
export class SqlQueryResultService {
  constructor(
    private tableViewerStorageService: TableViewerStorageService
  ) { }

  getSelectedGroup(editorState: ISqlEditorTabState): IResultGroup | null {
    const currentTab = editorState.tabs.find(tab => tab.id === editorState.currentTabId);
    const resultTab = editorState.resultTabs.find(tab => tab.tabId === currentTab?.id);

    if (!resultTab) {
      return null;
    }

    return editorState.resultGroups
      .find(group => group.groupId === resultTab.groupId)
    || null;
  }

  getGroup(
    editorState: ISqlEditorTabState,
    groupId: string
  ): IResultGroup | undefined {
    return editorState.resultGroups
      .find(group => group.groupId === groupId);
  }

  updateGroupTabs(
    editorState: ISqlEditorTabState,
    model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>,
    groupId: string,
    selectFirstResult?: boolean,
    statisticsIndex?: number,
    queryIndex?: number
  ): void {
    const group = this.getGroup(editorState, groupId);

    if (!group) {
      return;
    }

    this.createTabsForGroup(editorState, group, model, statisticsIndex, queryIndex);

    const tabsToRemove = editorState.resultTabs
      .filter(
        resultTab => resultTab.groupId === groupId
          && resultTab.indexInResultSet !== 0
          && resultTab.indexInResultSet >= model.source.results.length

      )
      .map(tab => tab.tabId);

    editorState.tabs = editorState.tabs
      .filter(resultTab => !tabsToRemove.includes(resultTab.id));
    editorState.resultTabs = editorState.resultTabs
      .filter(resultTab => !tabsToRemove.includes(resultTab.tabId));

    if (selectFirstResult) {
      this.selectFirstResult(editorState, groupId);
    }
  }

  createGroup(
    tabState: ISqlEditorTabState,
    modelId: string,
    query: string,
  ): IResultGroup {
    const nameOrder = Math.max(1, ...tabState.resultGroups.map(group => group.nameOrder + 1));
    const order = Math.max(0, ...tabState.tabs.map(tab => tab.order + 1));
    const groupId = uuid();

    tabState.resultGroups.push({
      groupId,
      modelId,
      order,
      nameOrder,
      query,
    });

    return tabState.resultGroups.find(group => group.groupId === groupId)!;
  }

  createStatisticsTab(tabState: ISqlEditorTabState): IStatisticsTab {
    const nameOrder = Math.max(1, ...tabState.statisticsTabs.map(group => group.order + 1));
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

  async canCloseResultTab(state: ISqlEditorTabState, tabId: string): Promise<boolean> {
    const resultTab = state.resultTabs.find(resultTab => resultTab.tabId === tabId);
    const group = state.resultGroups.find(group => group.groupId === resultTab?.groupId);

    if (resultTab && group) {
      const model = this.tableViewerStorageService.get(group.modelId);

      if (model) {
        let canClose = false;

        try {
          await model.requestDataAction(() => {
            canClose = true;
          });
        } catch {}
        return canClose;
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

        // TODO: we need to dispose table model, but don't close execution context, so now we only
        const model = this.tableViewerStorageService.get(group.modelId);
        // model?.dispose();

        if (model?.isLoading()) {
          model.cancel();
        }

        this.tableViewerStorageService.remove(group.modelId);
      }
    }
  }

  selectFirstResult(editorState: ISqlEditorTabState, groupId: string) {
    const mainTab = editorState.resultTabs.filter(
      resultTab => resultTab.groupId === groupId
    )
      .sort((a, b) => a.indexInResultSet - b.indexInResultSet);

    editorState.currentTabId = mainTab[0].tabId;
  }

  private createTabsForGroup(
    state: ISqlEditorTabState,
    group: IResultGroup,
    model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>,
    statisticsIndex?: number,
    queryIndex?: number
  ) {
    this.updateResultTab(state, group, model, 0, statisticsIndex, queryIndex);

    for (let i = 1; i < model.source.results.length; i++) {
      this.updateResultTab(state, group, model, i, statisticsIndex, queryIndex);
    }
  }

  private updateResultTab(
    state: ISqlEditorTabState,
    group: IResultGroup,
    model: IDatabaseDataModel<IDataQueryOptions, IDatabaseResultSet>,
    indexInResultSet: number,
    statisticsIndex?: number,
    queryIndex?: number
  ) {
    const resultTab = state.resultTabs.find(
      tab => tab.groupId === group.groupId && tab.indexInResultSet === indexInResultSet
    );

    if (!resultTab) {
      this.createResultTab(
        state,
        group,
        indexInResultSet,
        model.source.results.length,
        statisticsIndex,
        queryIndex
      );
    } else {
      const tab = state.tabs.find(tab => tab.id === resultTab.tabId);

      if (tab) {
        tab.name = this.getTabNameForOrder(
          group.nameOrder,
          indexInResultSet,
          model.source.results.length,
          statisticsIndex,
          queryIndex
        );
      }
    }
  }

  private createResultTab(
    state: ISqlEditorTabState,
    group: IResultGroup,
    indexInResultSet: number,
    results: number,
    statisticsIndex?: number,
    queryIndex?: number
  ) {
    const id = uuid();

    state.resultTabs.push({
      tabId: id,
      groupId: group.groupId,
      indexInResultSet,
    });

    state.tabs.push({
      id,
      name: this.getTabNameForOrder(
        group.nameOrder,
        indexInResultSet,
        results,
        statisticsIndex,
        queryIndex
      ),
      icon: 'table-icon',
      order: group.order,
    });
  }

  getTabNameForOrder(
    order: number,
    indexInResultSet: number,
    results: number,
    statisticsIndex?: number,
    queryIndex?: number
  ) {
    let name = `Result - ${statisticsIndex ?? order}`;

    if (queryIndex) {
      name += ` <${queryIndex}>`;
    }

    if (results > 1) {
      name += ` (${indexInResultSet + 1})`;
    }

    return name;
  }
}
