/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionExecutionContextResource, ConnectionExecutionContextService, ConnectionsManagerService, IConnectionExecutionContext, IConnectionExecutionContextInfo } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, SqlCompletionProposal, SqlScriptInfoFragment } from '@cloudbeaver/core-sdk';
import type { ISqlEditorTabState } from '@cloudbeaver/plugin-sql-editor';

export type SQLProposal = SqlCompletionProposal;

@injectable()
export class SqlEditorService {
  constructor(
    private readonly gql: GraphQLService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly notificationService: NotificationService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
  ) { }

  getState(
    order: number,
    name?: string,
    source?: string,
    query?: string,
    contextInfo?: IConnectionExecutionContextInfo,
    associatedScriptId?: string,
  ): ISqlEditorTabState {
    return {
      name,
      source,
      query: query ?? '',
      order,
      executionContext: contextInfo ? { ...contextInfo } : undefined,
      tabs: [],
      resultGroups: [],
      resultTabs: [],
      executionPlanTabs: [],
      statisticsTabs: [],

      currentModeId: '',
      associatedScriptId: associatedScriptId ?? '',
      modeState: [],
    };
  }

  async parseSQLScript(
    connectionId: string,
    script: string
  ): Promise<SqlScriptInfoFragment> {
    const result = await this.gql.sdk.parseSQLScript({
      connectionId,
      script,
    });

    return result.scriptInfo;
  }

  async parseSQLQuery(
    connectionId: string,
    script: string,
    position: number,
  ) {
    const result = await this.gql.sdk.parseSQLQuery({
      connectionId,
      script,
      position,
    });

    return result.queryInfo;
  }

  async getAutocomplete(
    connectionId: string,
    contextId: string,
    query: string,
    cursor: number,
    maxResults?: number,
    simple?: boolean,
  ): Promise<SQLProposal[]> {
    const { proposals } = await this.gql.sdk.querySqlCompletionProposals({
      connectionId,
      contextId,
      query,
      position: cursor,
      maxResults,
      simple,
    });

    return proposals as SQLProposal[];
  }

  setAssociatedScriptId(scriptId: string, state: ISqlEditorTabState) {
    state.associatedScriptId = scriptId;
  }

  setName(name: string, state: ISqlEditorTabState) {
    state.name = name;
  }

  setQuery(query: string, state: ISqlEditorTabState) {
    state.query = query;
  }

  async resetExecutionContext(state: ISqlEditorTabState) {
    if (state.executionContext) {
      await this.destroyContext(state.executionContext);
    }

    state.executionContext = undefined;
  }

  async initEditorConnection(state: ISqlEditorTabState): Promise<IConnectionExecutionContext | undefined> {
    if (!state.executionContext) {
      console.error('executeEditorQuery executionContext is not provided');
      return;
    }

    const context = await this.initContext(
      state.executionContext.connectionId,
      state.executionContext.defaultCatalog,
      state.executionContext.defaultSchema
    );

    if (!context?.context) {
      await this.resetExecutionContext(state);
      return;
    }

    state.executionContext = { ...context.context };

    return context;
  }

  async initContext(
    connectionId?: string,
    catalogId?: string,
    schemaId?: string
  ): Promise<IConnectionExecutionContext | null> {
    const connection = await this.connectionsManagerService.requireConnection(connectionId);

    if (!connection) {
      return null;
    }

    try {
      return await this.connectionExecutionContextService.create(connection.id, catalogId, schemaId);
    } catch (exception: any) {
      this.notificationService.logException(
        exception,
        `Failed to create context for ${connection.name} connection`,
      );
      return null;
    }
  }

  async destroyContext(contextInfo: IConnectionExecutionContextInfo) {
    await this.connectionExecutionContextResource.loadAll();

    const executionContext = this.connectionExecutionContextService.get(contextInfo.id);

    if (executionContext) {
      try {
        await executionContext.destroy();
      } catch (exception: any) {
        this.notificationService.logException(exception, `Failed to destroy SQL-context ${executionContext.context?.id}`, '', true);
      }
    }
  }
}
