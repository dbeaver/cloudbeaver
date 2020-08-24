/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@cloudbeaver/core-di';
import { uuid, MetadataMap, isPromiseCancelledError } from '@cloudbeaver/core-utils';
import { fetchingSettings } from '@cloudbeaver/plugin-data-viewer';

import { ISqlEditorGroupMetadata } from '../ISqlEditorGroupMetadata';
import {
  IQueryTabGroup, ISqlEditorTabState, ISqlQueryParams, IResultDataTab
} from '../ISqlEditorTabState';
import { SqlEditorGroupMetadataService } from '../SqlEditorGroupMetadataService';
import { SqlExecutionState } from '../SqlExecutionState';

@injectable()
export class SqlResultTabsService {
  private tabExecutionContext: MetadataMap<string, SqlExecutionState>

  constructor(
    private sqlEditorGroupMetadataService: SqlEditorGroupMetadataService,
  ) {
    this.tabExecutionContext = new MetadataMap(() => new SqlExecutionState());
  }

  getTabExecutionContext(tabId: string) {
    return this.tabExecutionContext.get(tabId);
  }

  async executeEditorQuery(tabId: string, editorState: ISqlEditorTabState, query: string, inNewTab: boolean) {
    if (!query.trim()) {
      return;
    }

    const currentTab = editorState.resultTabs.find(tab => tab.resultTabId === editorState.currentResultTabId);
    let tabGroup: IQueryTabGroup;

    const sqlQueryParams: ISqlQueryParams = {
      connectionId: editorState.connectionId,
      objectCatalogId: editorState.objectCatalogId,
      objectSchemaId: editorState.objectSchemaId,
      contextId: editorState.contextId,
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
        editorState.resultTabs.push(resultTab);
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
            }
          );

          const data = await editorMetadata.resultDataProcess.promise;

          length = data.results?.length || 1;
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
      name: this.getTabNameForOrder(order, groupOrder),
      indexInResultSet,
    };
  }

  private getTabNameForOrder(order: number, groupOrder: number) {
    return `Result - ${groupOrder} (${order})`;
  }

}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}
