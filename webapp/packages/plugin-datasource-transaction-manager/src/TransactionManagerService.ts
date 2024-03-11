/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeAutoObservable } from 'mobx';

import { ConnectionExecutionContextResource, ConnectionInfoResource, createConnectionParam } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { TaskScheduler } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService, GraphQLService } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';

import { TransactionExecutionContext } from './TransactionExecutionContext';

const DEFAULT_AUTO_COMMIT = true;

@injectable()
export class TransactionManagerService {
  get currentContext() {
    return this.connectionSchemaManagerService.activeExecutionContext;
  }

  get autoCommitMode() {
    const context = this.currentContext;

    if (context) {
      return context.autoCommit ?? DEFAULT_AUTO_COMMIT;
    }

    return DEFAULT_AUTO_COMMIT;
  }

  readonly transactions: MetadataMap<string, TransactionExecutionContext>;
  readonly scheduler: TaskScheduler<string>;

  constructor(
    private readonly notificationService: NotificationService,
    private readonly graphQLService: GraphQLService,
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    this.scheduler = new TaskScheduler((a, b) => a === b);
    this.transactions = new MetadataMap(
      contextId => new TransactionExecutionContext(this.scheduler, this.connectionExecutionContextResource, contextId),
    );

    makeAutoObservable(this, {
      currentContext: computed,
      autoCommitMode: computed,
    });
  }

  async setAutoCommit(connectionId: string, contextId: string, autoCommit: boolean) {
    const transaction = this.transactions.get(contextId);

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlSetAutoCommit({
        connectionId,
        contextId,
        autoCommit,
      });

      return taskInfo;
    });

    try {
      await transaction.run(
        async () => await this.asyncTaskInfoService.run(task),
        () => this.asyncTaskInfoService.cancel(task.id),
        () => this.asyncTaskInfoService.remove(task.id),
      );

      await this.connectionExecutionContextResource.refresh();
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_commit_mode_fail');
    }
  }

  async commit(connectionId: string, contextId: string) {
    const transaction = this.transactions.get(contextId);

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlCommitTransaction({
        connectionId,
        contextId,
      });

      return taskInfo;
    });

    try {
      const info = await transaction.run(
        async () => await this.asyncTaskInfoService.run(task),
        () => this.asyncTaskInfoService.cancel(task.id),
        () => this.asyncTaskInfoService.remove(task.id),
      );

      const connectionParam = createConnectionParam(transaction.context!.projectId, transaction.context!.connectionId);
      const connection = this.connectionInfoResource.get(connectionParam);
      const message = typeof info.taskResult === 'string' ? info.taskResult : '';

      this.notificationService.logInfo({ title: connection?.name ?? info.name ?? '', message });
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_commit_fail');
    }
  }

  async rollback(connectionId: string, contextId: string) {
    const transaction = this.transactions.get(contextId);

    const task = this.asyncTaskInfoService.create(async () => {
      const { taskInfo } = await this.graphQLService.sdk.asyncSqlRollbackTransaction({
        connectionId,
        contextId,
      });

      return taskInfo;
    });

    try {
      const info = await transaction.run(
        async () => await this.asyncTaskInfoService.run(task),
        () => this.asyncTaskInfoService.cancel(task.id),
        () => this.asyncTaskInfoService.remove(task.id),
      );

      const connectionParam = createConnectionParam(transaction.context!.projectId, transaction.context!.connectionId);
      const connection = this.connectionInfoResource.get(connectionParam);
      const message = typeof info.taskResult === 'string' ? info.taskResult : '';

      this.notificationService.logInfo({ title: connection?.name ?? info.name ?? '', message });
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_rollback_fail');
    }
  }
}
