/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeAutoObservable, observable } from 'mobx';

import { ConnectionExecutionContextResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';
import { TableViewerStorageService } from '@cloudbeaver/plugin-data-viewer';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';
import { NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';
import { SqlDataSourceService } from '@cloudbeaver/plugin-sql-editor';

type ConnectionId = string;

interface IProcessData {
  mode: boolean;
  commit: boolean;
  rollback: boolean;
}

type ProcessType = keyof IProcessData;

const DEFAULT_PROCESS_DATA_GETTER: () => IProcessData = () => ({ mode: false, commit: false, rollback: false });
const DEFAULT_AUTO_COMMIT = true;

@injectable()
export class TransactionManagerService {
  get currentContext() {
    const tab = this.navigationTabsService.currentTab;

    if (tab) {
      const model = this.tableViewerStorageService.get(tab.handlerState.tableId);

      if (model) {
        return model.source.executionContext?.context;
      }

      const source = this.sqlDataSourceService.get(tab.handlerState.editorId);

      if (source) {
        return source.executionContext;
      }
    }

    return null;
  }

  get autoCommitMode() {
    const context = this.currentContext;

    if (context) {
      return context.autoCommit ?? DEFAULT_AUTO_COMMIT;
    }

    return DEFAULT_AUTO_COMMIT;
  }

  readonly processState: Map<ConnectionId, IProcessData>;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly navigationTabsService: NavigationTabsService,
    private readonly tableViewerStorageService: TableViewerStorageService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly sqlDataSourceService: SqlDataSourceService,
  ) {
    this.processState = new Map();

    makeAutoObservable(this, {
      currentContext: computed,
      autoCommitMode: computed,
      processState: observable,
    });
  }

  async setAutoCommit(connectionId: string, contextId: string, autoCommit: boolean) {
    this.changeProcessStatus(connectionId, 'mode', true);

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlSetAutoCommit({
        connectionId,
        contextId,
        autoCommit,
      });

      return taskInfo;
    });

    await this.asyncTaskInfoService.run(task);

    if (this.currentContext) {
      const param = createConnectionParam(this.currentContext.projectId, this.currentContext.connectionId);
      await this.connectionExecutionContextResource.refreshConnectionContexts(param);
    }

    this.changeProcessStatus(connectionId, 'mode', false);
  }

  async commit(connectionId: string, contextId: string) {
    this.changeProcessStatus(connectionId, 'commit', true);

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlCommitTransaction({
        connectionId,
        contextId,
      });

      return taskInfo;
    });

    const result = await this.asyncTaskInfoService.run(task);
    const connection = this.connectionSchemaManagerService.currentConnection;

    if (result.taskResult) {
      this.notificationService.logInfo({ title: connection?.name ?? result.name ?? '', message: result.taskResult });
    }

    this.changeProcessStatus(connectionId, 'commit', false);
  }

  async rollback(connectionId: string, contextId: string) {
    this.changeProcessStatus(connectionId, 'rollback', true);

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlRollbackTransaction({
        connectionId,
        contextId,
      });

      return taskInfo;
    });

    const result = await this.asyncTaskInfoService.run(task);
    const connection = this.connectionSchemaManagerService.currentConnection;

    if (result.taskResult) {
      this.notificationService.logInfo({ title: connection?.name ?? result.name ?? '', message: result.taskResult });
    }

    this.changeProcessStatus(connectionId, 'rollback', false);
  }

  private changeProcessStatus(connectionId: string, type: ProcessType, value: boolean) {
    const currentState = this.processState.get(connectionId) || DEFAULT_PROCESS_DATA_GETTER();

    currentState[type] = value;
    this.processState.set(connectionId, currentState);
  }
}
