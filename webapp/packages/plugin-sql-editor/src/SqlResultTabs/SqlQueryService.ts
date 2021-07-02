/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { uuid, EDeferredState } from '@cloudbeaver/core-utils';
import { DatabaseDataAccessMode, DataModelWrapper, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type {
  IResultGroup, ISqlEditorTabState, ISqlQueryParams
} from '../ISqlEditorTabState';
import { QueryDataSource } from '../QueryDataSource';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import type { SqlExecutionState } from '../SqlExecutionState';

@injectable()
export class SqlQueryService {
  constructor(
    private sqlDialectInfoService: SqlDialectInfoService,
    private tableViewerStorageService: TableViewerStorageService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
  ) { }

  async executeEditorQuery(
    executionState: SqlExecutionState,
    editorState: ISqlEditorTabState,
    query: string,
    inNewTab: boolean
  ): Promise<void> {
    if (!query.trim()) {
      return;
    }

    if (!editorState.executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    let source: QueryDataSource;
    let model: DataModelWrapper;
    let tabGroup: IResultGroup;
    let isNewTabCreated = false;

    const connectionInfo = await this.connectionInfoResource.load(editorState.executionContext.connectionId);
    const currentTab = editorState.tabs.find(tab => tab.id === editorState.currentTabId);
    const resultTab = editorState.resultTabs.find(tab => tab.tabId === currentTab?.id);

    const sqlQueryParams: ISqlQueryParams = {
      executionContext: editorState.executionContext,
      query: await this.getSubQuery(editorState.executionContext.connectionId, query),
    };

    if (inNewTab || !resultTab) {
      source = new QueryDataSource(this.graphQLService, this.notificationService, executionState);
      model = this.tableViewerStorageService.create(source)
        .setCountGain()
        .setSlice(0);

      tabGroup = this.createGroup(sqlQueryParams, editorState, model.id);

      isNewTabCreated = true;
    } else {
      tabGroup = editorState.resultGroups.find(group => group.groupId === resultTab.groupId)!;
      tabGroup.sqlQueryParams = sqlQueryParams;
      model = this.tableViewerStorageService.get(tabGroup.modelId)!;
      source = model.source as any as QueryDataSource;
    }

    model
      .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default);

    source.setOptions({
      query: sqlQueryParams.query,
      connectionId: sqlQueryParams.executionContext.connectionId,
      constraints: [],
      whereFilter: '',
    })
      .setExecutionContext(sqlQueryParams.executionContext)
      .setSupportedDataFormats(connectionInfo.supportedDataFormats);

    this.createTabsForGroup(editorState, tabGroup, model);
    this.selectFirstResult(editorState, tabGroup.groupId, true);

    try {
      await model
        .setCountGain()
        .setSlice(0)
        .requestData();

      const group = editorState.resultGroups.find(group => group.groupId === tabGroup.groupId);

      if (!group) { // tab can be closed before we get result
        return;
      }

      this.createTabsForGroup(editorState, tabGroup, model);

      const tabsToRemove = editorState.resultTabs
        .filter(
          resultTab => resultTab.groupId === tabGroup.groupId
            && resultTab.indexInResultSet >= model.source.results.length
        )
        .map(tab => tab.tabId);

      editorState.tabs = editorState.tabs
        .filter(resultTab => !tabsToRemove.includes(resultTab.id));
      editorState.resultTabs = editorState.resultTabs
        .filter(resultTab => !tabsToRemove.includes(resultTab.tabId));

      this.selectFirstResult(editorState, tabGroup.groupId);
    } catch (exception) {
      // remove first panel if execution was cancelled
      if (source.queryExecutionProcess?.getState() === EDeferredState.CANCELLED && isNewTabCreated) {
        this.removeGroup(editorState, tabGroup.groupId);
        const message = `Query execution has been canceled${status ? `: ${status}` : ''}`;
        this.notificationService.logException(exception, 'Query execution Error', message);
      }
    }
  }

  createGroup(
    params: ISqlQueryParams,
    tabState: ISqlEditorTabState,
    modelId: string
  ): IResultGroup {
    const nameOrder = Math.max(1, ...tabState.resultGroups.map(group => group.nameOrder + 1));
    const order = Math.max(0, ...tabState.tabs.map(tab => tab.order + 1));
    const groupId = uuid();

    tabState.resultGroups.push({
      groupId,
      modelId,
      order,
      nameOrder,
      sqlQueryParams: params,
    });

    return tabState.resultGroups.find(group => group.groupId === groupId)!;
  }

  async getSubQuery(connectionId: string, query: string): Promise<string> {
    const dialectInfo = await this.sqlDialectInfoService.loadSqlDialectInfo(connectionId);

    if (dialectInfo?.scriptDelimiter && query.endsWith(dialectInfo?.scriptDelimiter)) {
      return query.slice(0, query.length - dialectInfo.scriptDelimiter.length);
    }

    return query;
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
