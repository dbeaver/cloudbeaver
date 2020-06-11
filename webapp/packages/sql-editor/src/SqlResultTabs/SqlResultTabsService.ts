/*
 * cloudbeaver - Cloud Database Manager
 * Copyright (C) 2020 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { injectable } from '@dbeaver/core/di';
import { isPromiseCancelledError, uuid } from '@dbeaver/core/utils';
import { fetchingSettings } from '@dbeaver/data-viewer-plugin';

import {
  IResultsTabState, ISqlEditorTabState, ISqlQueryParams, ISqlResultPanelParams,
} from '../ISqlEditorTabState';
import { SqlResultService } from './SqlResultService';

@injectable()
export class SqlResultTabsService {

  constructor(private sqlResultService: SqlResultService) { }

  async executeEditorQuery(editorState: ISqlEditorTabState, query: string, inNewTab: boolean) {
    if (!query.trim()) {
      return;
    }

    const sqlQueryParams: ISqlQueryParams = {
      connectionId: editorState.connectionId,
      objectCatalogId: editorState.objectCatalogId,
      objectSchemaId: editorState.objectSchemaId,
      contextId: editorState.contextId,
      query,
    };

    // we should first render table, because we expect that table request first data portion
    const queryExecutionProcess = this.sqlResultService.asyncSqlQuery(
      sqlQueryParams,
      {
        offset: 0,
        limit: fetchingSettings.fetchDefault,
      }
    );

    editorState.sqlExecutionState.setCurrentlyExecutingQuery(queryExecutionProcess);

    function createTabPanelParams(indexInResultSet: number): ISqlResultPanelParams {
      const params: ISqlResultPanelParams = {
        resultTabId: uuid(),
        indexInResultSet,
        sqlQueryParams,
        firstDataPortion: queryExecutionProcess,
        sqlExecutionState: editorState.sqlExecutionState,
      };
      return params;
    }

    const firstTabPanelParams = createTabPanelParams(0);
    const currentTab = editorState.resultTabs.find(tab => tab.resultTabId === editorState.currentResultTabId);
    const groupToReplace = inNewTab ? undefined : currentTab?.groupId;

    let newGroupId = '';
    const isFistPanel = !editorState.resultTabs.length;
    if (isFistPanel) {
      // add first tab synchronously before awaiting result
      newGroupId = this.replaceGroupWithNewTab(editorState.resultTabs, firstTabPanelParams);
      editorState.currentResultTabId = firstTabPanelParams.resultTabId;
    }

    try {
      const data = await queryExecutionProcess.promise;

      if (!isFistPanel) {
        // replace old tabs with new one
        newGroupId = this.replaceGroupWithNewTab(editorState.resultTabs, firstTabPanelParams, groupToReplace);
        editorState.currentResultTabId = firstTabPanelParams.resultTabId;
      }

      // when more than one result set - add other tabs
      if (data.results && data.results?.length > 1) {
        // ignore first dataset, it was already added
        for (let i = 1; i < data.results.length; i++) {
          const tabPanelParams = createTabPanelParams(i);
          this.addTabToGroup(editorState.resultTabs, tabPanelParams, newGroupId);
        }
      }
    } catch (exception) {
      // remove first panel if execution was cancelled
      if (isPromiseCancelledError(exception) && isFistPanel) {
        editorState.currentResultTabId = undefined;
        editorState.resultTabs = [];
      }
      if (!isPromiseCancelledError(exception) && !isFistPanel) {
        // replace old tabs with new one and show error in it
        this.replaceGroupWithNewTab(editorState.resultTabs, firstTabPanelParams, groupToReplace);
        editorState.currentResultTabId = firstTabPanelParams.resultTabId;
      }
    }
  }

  /**
   * method remove current tab group from resultTabs
   * and add one tab on the same place
   *
   * @return groupId of new tab
   */
  private replaceGroupWithNewTab(resultTabs: IResultsTabState[],
                                 tabParams: ISqlResultPanelParams,
                                 groupToDelete?: string): string {
    const tabsToRemove = resultTabs.filter(tab => tab.groupId === groupToDelete);
    const tabToReplace = tabsToRemove[0];

    const order = tabToReplace
      ? tabToReplace.order
      : findMinimalFree(resultTabs.map(result => result.order), 1);

    const resultsTabState: IResultsTabState = {
      resultTabId: tabParams.resultTabId,
      groupId: uuid(),
      order,
      name: this.getTabNameForOrder(order),
      panelParams: tabParams,
    };

    if (tabToReplace) {
      const index = resultTabs.findIndex(tab => tab.resultTabId === tabToReplace.resultTabId);
      resultTabs.splice(index, 1, resultsTabState);
    } else {
      resultTabs.push(resultsTabState);
    }

    tabsToRemove.forEach((tabToRemove) => {
      const index = resultTabs.findIndex(tab => tab.resultTabId === tabToRemove.resultTabId);
      if (index !== -1) {
        resultTabs.splice(index, 1);
      }
    });

    return resultsTabState.groupId;
  }

  private addTabToGroup(resultTabs: IResultsTabState[], tabParams: ISqlResultPanelParams, groupId: string) {
    const order = findMinimalFree(resultTabs.map(result => result.order), 1);

    const resultsTabState: IResultsTabState = {
      resultTabId: tabParams.resultTabId,
      groupId,
      order,
      name: this.getTabNameForOrder(order),
      panelParams: tabParams,
    };
    resultTabs.push(resultsTabState);
  }

  private getTabNameForOrder(order: number) {
    return order > 1 ? `Result - ${order}` : 'Result';
  }

}

function findMinimalFree(array: number[], base: number): number {
  return array
    .sort((a, b) => b - a)
    .reduceRight((prev, cur) => (prev === cur ? prev + 1 : prev), base);
}
