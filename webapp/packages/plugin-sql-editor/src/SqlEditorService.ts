/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { observable } from 'mobx';

import {
  type Connection,
  ConnectionExecutionContextProjectKey,
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  ConnectionInfoResource,
  ConnectionsManagerService,
  createConnectionParam,
  type IConnectionExecutionContext,
  type IConnectionExecutionContextInfo,
  type IConnectionInfoParams,
} from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { CachedMapAllKey } from '@cloudbeaver/core-resource';
import { FEATURE_GIT_ID, ServerConfigResource } from '@cloudbeaver/core-root';
import { GraphQLService, type SqlCompletionProposal, type SqlScriptInfoFragment } from '@cloudbeaver/core-sdk';

import { getSqlEditorName } from './getSqlEditorName.js';
import type { ISqlEditorTabState } from './ISqlEditorTabState.js';
import { ESqlDataSourceFeatures } from './SqlDataSource/ESqlDataSourceFeatures.js';
import { SqlDataSourceService } from './SqlDataSource/SqlDataSourceService.js';
import { SqlEditorSettingsService } from './SqlEditorSettingsService.js';

export type SQLProposal = SqlCompletionProposal;

@injectable()
export class SqlEditorService {
  get autoSave() {
    return this.sqlEditorSettingsService.autoSave && !this.serverConfigResource.isFeatureEnabled(FEATURE_GIT_ID, true);
  }

  get insertTableAlias() {
    return this.sqlEditorSettingsService.insertTableAlias;
  }

  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly notificationService: NotificationService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly sqlDataSourceService: SqlDataSourceService,
    private readonly sqlEditorSettingsService: SqlEditorSettingsService,
    private readonly serverConfigResource: ServerConfigResource,
  ) {}

  getState(editorId: string, datasourceKey: string, order: number, source?: string): ISqlEditorTabState {
    return observable({
      editorId,
      datasourceKey,
      source,
      order,
      tabs: observable([]),
      resultGroups: observable([]),
      resultTabs: observable([]),
      executionPlanTabs: observable([]),
      statisticsTabs: observable([]),
      outputLogsTab: undefined,
      currentModeId: undefined,
      modeState: observable([]),
    });
  }

  async parseSQLScript(projectId: string, connectionId: string, script: string): Promise<SqlScriptInfoFragment> {
    const result = await this.graphQLService.sdk.parseSQLScript({
      projectId,
      connectionId,
      script,
    });

    return result.scriptInfo;
  }

  async parseSQLQuery(projectId: string, connectionId: string, script: string, position: number) {
    const result = await this.graphQLService.sdk.parseSQLQuery({
      projectId,
      connectionId,
      script,
      position,
    });

    return result.queryInfo;
  }

  async getAutocomplete(
    projectId: string,
    connectionId: string,
    contextId: string,
    query: string,
    cursor: number,
    maxResults?: number,
    simple?: boolean,
  ): Promise<SQLProposal[]> {
    const { proposals } = await this.graphQLService.sdk.querySqlCompletionProposals({
      projectId,
      connectionId,
      contextId,
      query,
      position: cursor,
      maxResults,
      simple,
    });

    return proposals as SQLProposal[];
  }

  getName(tabState: ISqlEditorTabState): string {
    const dataSource = this.sqlDataSourceService.get(tabState.editorId);
    const executionContext = dataSource?.executionContext;
    let connection: Connection | undefined;

    if (executionContext) {
      connection = this.connectionInfoResource.get(createConnectionParam(executionContext.projectId, executionContext.connectionId));
    }

    return getSqlEditorName(tabState, dataSource, connection);
  }

  setName(name: string, state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    if (dataSource && dataSource.hasFeature(ESqlDataSourceFeatures.setName)) {
      dataSource.setName(name);
    }
  }

  setScript(script: string, state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    dataSource!.setScript(script);
  }

  async resetExecutionContext(state: ISqlEditorTabState) {
    const dataSource = this.sqlDataSourceService.get(state.editorId);

    if (dataSource?.executionContext) {
      await this.destroyContext(dataSource.executionContext);

      dataSource.setExecutionContext(undefined);
    }
  }

  async setConnection(state: ISqlEditorTabState, connectionKey: IConnectionInfoParams, catalogId?: string, schemaId?: string): Promise<boolean> {
    try {
      const executionContext = await this.initContext(connectionKey, catalogId, schemaId);
      const dataSource = this.sqlDataSourceService.get(state.editorId);

      if (!executionContext?.context || !dataSource) {
        return false;
      }

      const previousContext = dataSource.executionContext;
      dataSource.setExecutionContext({ ...executionContext.context });

      if (previousContext) {
        await this.destroyContext(previousContext);
      }

      return true;
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Failed to change SQL-editor connection');
      return false;
    }
  }

  initEditorConnection(state: ISqlEditorTabState): Promise<IConnectionExecutionContext | undefined> {
    return this.sqlDataSourceService.executeAction(
      state.editorId,
      async dataSource => {
        const executionContext = dataSource?.executionContext;
        if (!executionContext) {
          console.error('executeEditorQuery executionContext is not provided');
          return;
        }

        await this.connectionExecutionContextResource.load(ConnectionExecutionContextProjectKey(executionContext.projectId));

        if (this.connectionExecutionContextResource.has(executionContext.id)) {
          return this.connectionExecutionContextService.get(executionContext.id);
        }

        const context = await this.initContext(
          createConnectionParam(executionContext.projectId, executionContext.connectionId),
          executionContext.defaultCatalog,
          executionContext.defaultSchema,
        );

        if (!context?.context) {
          await this.resetExecutionContext(state);
          return;
        }

        dataSource.setExecutionContext({ ...context.context });

        return context;
      },
      () => {
        console.error('executeEditorQuery executionContext is not provided');
      },
    );
  }

  async canDestroy(state: ISqlEditorTabState): Promise<boolean> {
    return await this.sqlDataSourceService.canDestroy(state.editorId);
  }

  async destroy(state: ISqlEditorTabState): Promise<void> {
    await this.sqlDataSourceService.destroy(state.editorId);
  }

  async initContext(connectionKey: IConnectionInfoParams, catalogId?: string, schemaId?: string): Promise<IConnectionExecutionContext | null> {
    const connection = await this.connectionsManagerService.requireConnection(connectionKey);

    if (!connection) {
      return null;
    }

    try {
      return await this.connectionExecutionContextService.create(connectionKey, catalogId, schemaId);
    } catch (exception: any) {
      this.notificationService.logException(exception, `Failed to create context for ${connection.name} connection`);
      return null;
    }
  }

  async destroyContext(contextInfo: IConnectionExecutionContextInfo) {
    await this.connectionExecutionContextResource.load(CachedMapAllKey);

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
