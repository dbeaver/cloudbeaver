/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { uuid } from '@cloudbeaver/core-utils';
import { DataModelWrapper, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { IResultGroup, ISqlEditorTabState } from '../ISqlEditorTabState';

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
    model: DataModelWrapper,
    groupId: string
  ): void {
    const group = this.getGroup(editorState, groupId);

    if (!group) {
      return;
    }

    this.createTabsForGroup(editorState, group, model);

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

    this.selectFirstResult(editorState, groupId);
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

  removeGroup(tabState: ISqlEditorTabState, groupId: string): void {
    const tabsToRemove = tabState.resultTabs.filter(tab => tab.groupId === groupId).map(tab => tab.tabId);

    tabState.tabs = tabState.tabs.filter(tab => !tabsToRemove.includes(tab.id));
    tabState.resultGroups = tabState.resultGroups.filter(group => group.groupId !== groupId);
    tabState.resultTabs = tabState.resultTabs.filter(tab => tab.groupId !== groupId);
    tabState.currentTabId = tabState.tabs[0]?.id;
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

  private selectFirstResult(editorState: ISqlEditorTabState, groupId: string, openNew = false) {
    const currentTab = editorState.tabs.find(tab => tab.id === editorState.currentTabId);

    const mainTab = editorState.resultTabs.filter(
      resultTab => resultTab.groupId === groupId
    )
      .sort((a, b) => a.indexInResultSet - b.indexInResultSet);

    if (mainTab.length && (!currentTab || openNew)) {
      editorState.currentTabId = mainTab[0].tabId;
    }
  }

  private createTabsForGroup(
    state: ISqlEditorTabState,
    group: IResultGroup,
    model: DataModelWrapper
  ) {
    this.updateResultTab(model, state, group, 0);

    for (let i = 1; i < model.source.results.length; i++) {
      this.updateResultTab(model, state, group, i);
    }
  }

  private updateResultTab(
    model: DataModelWrapper,
    state: ISqlEditorTabState,
    group: IResultGroup,
    indexInResultSet: number,
  ) {
    const resultTab = state.resultTabs.find(
      tab => tab.groupId === group.groupId && tab.indexInResultSet === indexInResultSet
    );

    if (!resultTab) {
      this.createResultTab(state, group, indexInResultSet, model.source.results.length);
    } else {
      const tab = state.tabs.find(tab => tab.id === resultTab.tabId);

      if (tab) {
        tab.name = this.getTabNameForOrder(group.nameOrder, indexInResultSet, model.source.results.length);
      }
    }
  }

  private createResultTab(
    state: ISqlEditorTabState,
    group: IResultGroup,
    indexInResultSet: number,
    results: number
  ) {
    const id = uuid();

    state.resultTabs.push({
      tabId: id,
      groupId: group.groupId,
      indexInResultSet,
    });

    state.tabs.push({
      id,
      name: this.getTabNameForOrder(group.nameOrder, indexInResultSet, results),
      icon: 'table-icon',
      order: group.order,
    });
  }

  private getTabNameForOrder(order: number, indexInResultSet: number, results: number) {
    return `Result - ${order}` + (results > 1 ? ` (${indexInResultSet + 1})` : '');
  }
}
