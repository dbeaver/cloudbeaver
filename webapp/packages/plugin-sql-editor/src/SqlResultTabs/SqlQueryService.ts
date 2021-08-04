/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionExecutionContextService, ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService } from '@cloudbeaver/core-sdk';
import { DatabaseDataAccessMode, DataModelWrapper, TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';

import type { ISqlEditorTabState } from '../ISqlEditorTabState';
import { QueryDataSource } from '../QueryDataSource';
import { SqlQueryResultService } from './SqlQueryResultService';

@injectable()
export class SqlQueryService {
  constructor(
    private tableViewerStorageService: TableViewerStorageService,
    private graphQLService: GraphQLService,
    private notificationService: NotificationService,
    private connectionInfoResource: ConnectionInfoResource,
    private connectionExecutionContextService: ConnectionExecutionContextService,
    private sqlQueryResultService: SqlQueryResultService
  ) { }

  async executeEditorQuery(
    editorState: ISqlEditorTabState,
    query: string,
    inNewTab: boolean
  ): Promise<void> {
    const contextInfo = editorState.executionContext;
    const executionContext = contextInfo && this.connectionExecutionContextService.get(contextInfo.baseId);

    if (!contextInfo || !executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    let source: QueryDataSource;
    let model: DataModelWrapper;
    let isNewTabCreated = false;

    const connectionInfo = await this.connectionInfoResource.load(contextInfo.connectionId);
    let tabGroup = this.sqlQueryResultService.getSelectedGroup(editorState);

    if (inNewTab || !tabGroup) {
      source = new QueryDataSource(this.graphQLService, this.notificationService);

      model = this.tableViewerStorageService.create(source)
        .setCountGain()
        .setSlice(0);

      tabGroup = this.sqlQueryResultService.createGroup(editorState, model.id, query);

      isNewTabCreated = true;
    } else {
      tabGroup.query = query;
      model = this.tableViewerStorageService.get(tabGroup.modelId)!;
      source = model.source as any as QueryDataSource;
    }

    model
      .setAccess(connectionInfo.readOnly ? DatabaseDataAccessMode.Readonly : DatabaseDataAccessMode.Default);

    source.setOptions({
      query: query,
      connectionId: contextInfo.connectionId,
      constraints: [],
      whereFilter: '',
    })
      .setExecutionContext(executionContext)
      .setSupportedDataFormats(connectionInfo.supportedDataFormats);

    this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId);

    try {
      await model
        .setCountGain()
        .setSlice(0)
        .requestData();

      this.sqlQueryResultService.updateGroupTabs(editorState, model, tabGroup.groupId);
    } catch (exception) {
      // remove first panel if execution was cancelled
      if (source.currentTask?.cancelled && isNewTabCreated) {
        this.sqlQueryResultService.removeGroup(editorState, tabGroup.groupId);
        const message = `Query execution has been canceled${status ? `: ${status}` : ''}`;
        this.notificationService.logException(exception, 'Query execution Error', message);
      }
    }
  }
}
