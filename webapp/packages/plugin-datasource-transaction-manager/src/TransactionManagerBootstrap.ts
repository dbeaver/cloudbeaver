/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import {
  ConnectionExecutionContext,
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  ConnectionInfoResource,
  createConnectionParam,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { AsyncTaskInfo } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ACTION_COMMIT } from './actions/ACTION_COMMIT';
import { ACTION_COMMIT_MODE_TOGGLE } from './actions/ACTION_COMMIT_MODE_TOGGLE';
import { ACTION_ROLLBACK } from './actions/ACTION_ROLLBACK';

@injectable()
export class TransactionManagerBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly notificationService: NotificationService,
  ) {
    super();
  }

  register() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      isApplicable: () =>
        !this.optionsPanelService.active &&
        this.connectionSchemaManagerService.currentConnection?.connected === true &&
        this.connectionSchemaManagerService.activeExecutionContext !== undefined,
      getItems: (_, items) => [...items, ACTION_COMMIT, ACTION_ROLLBACK, ACTION_COMMIT_MODE_TOGGLE],
    });

    this.actionService.addHandler({
      id: 'commit-mode-base',
      isActionApplicable: (_, action) => [ACTION_COMMIT, ACTION_ROLLBACK, ACTION_COMMIT_MODE_TOGGLE].includes(action),
      isLabelVisible: (_, action) => action === ACTION_COMMIT || action === ACTION_ROLLBACK,
      getActionInfo: (_, action) => {
        const transaction = this.getContextTransaction();

        if (!transaction) {
          return action.info;
        }

        if (action === ACTION_COMMIT_MODE_TOGGLE) {
          const auto = transaction.currentCommitMode;
          const icon = `/icons/commit_mode_${auto ? 'auto' : 'manual'}_m.svg`;
          const label = `plugin_datasource_transaction_manager_commit_mode_switch_to_${auto ? 'manual' : 'auto'}`;

          return { ...action.info, icon, label, tooltip: label };
        }

        return action.info;
      },
      isDisabled: () => {
        const transaction = this.getContextTransaction();
        return transaction?.executing === true;
      },
      isHidden: (_, action) => {
        const transaction = this.getContextTransaction();

        if (!transaction) {
          return true;
        }

        if (action === ACTION_COMMIT || action === ACTION_ROLLBACK) {
          return transaction.currentCommitMode;
        }

        return false;
      },
      handler: async (_, action) => {
        const transaction = this.getContextTransaction();

        if (!transaction) {
          return;
        }

        switch (action) {
          case ACTION_COMMIT: {
            try {
              const result = await transaction.commit();
              this.showTransactionResult(transaction, result);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_commit_fail');
            }

            break;
          }
          case ACTION_ROLLBACK: {
            try {
              const result = await transaction.rollback();
              this.showTransactionResult(transaction, result);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_rollback_fail');
            }

            break;
          }
          case ACTION_COMMIT_MODE_TOGGLE:
            try {
              await transaction.setAutoCommit(!transaction.currentCommitMode);
              await this.connectionExecutionContextResource.refresh();
            } catch (exception: any) {
              this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_commit_mode_fail');
            }

            break;
          default:
            break;
        }
      },
    });
  }

  load() {}

  private showTransactionResult(transaction: ConnectionExecutionContext, taskInfo: AsyncTaskInfo) {
    if (!transaction.context) {
      return;
    }

    const connectionParam = createConnectionParam(transaction.context.projectId, transaction.context.connectionId);
    const connection = this.connectionInfoResource.get(connectionParam);
    const message = typeof taskInfo.taskResult === 'string' ? taskInfo.taskResult : '';

    this.notificationService.logInfo({ title: connection?.name ?? taskInfo.name ?? '', message });
  }

  private getContextTransaction() {
    const context = this.connectionSchemaManagerService.activeExecutionContext;

    if (!context) {
      return;
    }

    return this.connectionExecutionContextService.get(context.id);
  }
}
