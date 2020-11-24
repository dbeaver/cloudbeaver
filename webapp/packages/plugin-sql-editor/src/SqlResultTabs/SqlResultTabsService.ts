/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { uuid, MetadataMap, isPromiseCancelledError } from '@cloudbeaver/core-utils';
import { fetchingSettings } from '@cloudbeaver/plugin-data-viewer';

import { ISqlEditorGroupMetadata } from '../ISqlEditorGroupMetadata';
import {
  IQueryTabGroup, ISqlEditorTabState, ISqlQueryParams, IResultDataTab
} from '../ISqlEditorTabState';
import { SqlDialectInfoService } from '../SqlDialectInfoService';
import { SqlEditorGroupMetadataService } from '../SqlEditorGroupMetadataService';
import { SqlEditorService } from '../SqlEditorService';
import { SqlExecutionState } from '../SqlExecutionState';

@injectable()
export class SqlResultTabsService {
  private tabExecutionContext: MetadataMap<string, SqlExecutionState>;

  constructor(
    private sqlEditorGroupMetadataService: SqlEditorGroupMetadataService,
    private sqlDialectInfoService: SqlDialectInfoService,
    private sqlEditorService: SqlEditorService
  ) {
    this.tabExecutionContext = new MetadataMap(() => new SqlExecutionState());
  }

  getTabExecutionContext(tabId: string): SqlExecutionState {
    return this.tabExecutionContext.get(tabId);
  }

  async executeEditorQuery(
    tabId: string,
    editorState: ISqlEditorTabState,
    query: string,
    inNewTab: boolean
  ): Promise<void> {
    if (!query.trim()) {
      return;
    }

    const context = await this.sqlEditorService.initEditorConnection(editorState);

    if (!context) {
      console.error('executeEditorQuery connection not established');
      return;
    }

    if (!context.contextId) {
      console.error('executeEditorQuery contextId is not provided');
      return;
    }

    if (!context.connectionId) {
      console.error('executeEditorQuery connectionId is not provided');
      return;
    }

    const dialectInfo = await this.sqlDialectInfoService.loadSqlDialectInfo(context.connectionId);
    const currentTab = editorState.resultTabs.find(tab => tab.resultTabId === editorState.currentResultTabId);

    if (dialectInfo?.scriptDelimiter && query.endsWith(dialectInfo?.scriptDelimiter)) {
      query = query.slice(0, query.length - dialectInfo.scriptDelimiter.length);
    }

    let tabGroup: IQueryTabGroup;

    const sqlQueryParams: ISqlQueryParams = {
      connectionId: context.connectionId,
      objectCatalogId: context.objectCatalogId,
      objectSchemaId: context.objectSchemaId,
      contextId: context.contextId,
      query,
    };

    let isNewTabCreated = false;

    if (inNewTab || !currentTab?.groupId) {
      const order = findMinimalFree(
        editorState.queryTabGroups.map(group => group.order),
        1
      );

      tabGroup = {
        groupId: uuid(),
        order,
        sqlQueryParams,
      };
      editorState.queryTabGroups.push(tabGroup);

      isNewTabCreated = true;
    } else {
      tabGroup = editorState.queryTabGroups.find(group => group.groupId === currentTab.groupId)!;
      tabGroup.sqlQueryParams = sqlQueryParams;
    }

    let editorMetadata: ISqlEditorGroupMetadata;

    for (let [i, length] = [0, 1]; i < length; i++) {
      let resultTab = editorState.resultTabs.find(
        resultTab => resultTab.groupId === tabGroup.groupId
          && resultTab.indexInResultSet === i
      );

      if (!resultTab) {
        const order = findMinimalFree(
          editorState.resultTabs
            .filter(resultTab => resultTab.groupId === tabGroup.groupId)
            .map(result => result.order),
          1
        );
        resultTab = this.createResultTab(order, tabGroup.groupId, tabGroup.order, i);

        // we get mobx observed value here, so we can mutate name late
        resultTab = editorState.resultTabs[editorState.resultTabs.push(resultTab) - 1];
      }

      if (i === 0) {
        editorState.currentResultTabId = resultTab.resultTabId;

        try {
          editorMetadata = this.sqlEditorGroupMetadataService.getTabData(resultTab.resultTabId);

          // we should first render table, because we expect that table request first data portion
          await editorMetadata.start(
            this.getTabExecutionContext(tabId),
            sqlQueryParams,
            {
              offset: 0,
              limit: fetchingSettings.fetchDefault,
            },
            ResultDataFormat.Resultset
          );

          const data = await editorMetadata.resultDataProcess.promise;

          length = data.results?.length || 1;

          if (length === 1) {
            resultTab.name = this.getTabNameForOrder(tabGroup.order);
          } else {
            resultTab.name = this.getTabNameForOrder(tabGroup.order, resultTab.order);
          }

          editorState.resultTabs = editorState.resultTabs
            .filter(
              resultTab => resultTab.groupId !== tabGroup.groupId
              || resultTab.indexInResultSet < length
            );
        } catch (exception) {
          // remove first panel if execution was cancelled
          if (isPromiseCancelledError(exception) && isNewTabCreated) {
            editorState.queryTabGroups = editorState.queryTabGroups.filter(group => group.groupId !== tabGroup.groupId);
            editorState.resultTabs = editorState.resultTabs.filter(tab => tab.groupId !== tabGroup.groupId);
            editorState.currentResultTabId = editorState.resultTabs[0]?.resultTabId;
          }
          return;
        }
      } else {
        this.sqlEditorGroupMetadataService
          .getTabData(resultTab.resultTabId)
          .resultDataProcess = editorMetadata!.resultDataProcess;
      }
    }
  }

  private createResultTab(
    order: number,
    groupId: string,
    groupOrder: number,
    indexInResultSet: number
  ): IResultDataTab {
    return {
      resultTabId: uuid(),
      groupId,
      order,
      name: this.getTabNameForOrder(groupOrder, indexInResultSet === 0 ? undefined : order),
      indexInResultSet,
    };
  }

  private getTabNameForOrder(groupOrder: number, order?: number) {
    return `Result - ${groupOrder}` + (order !== undefined ? ` (${order})` : '');
  }
}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}
