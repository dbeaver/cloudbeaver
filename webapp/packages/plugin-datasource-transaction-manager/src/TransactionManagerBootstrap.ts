/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import {
  ConnectionExecutionContext,
  ConnectionExecutionContextResource,
  ConnectionExecutionContextService,
  ConnectionInfoResource,
  ConnectionsManagerService,
  createConnectionParam,
  IConnectionExecutionContextUpdateTaskInfo,
  IConnectionExecutorData,
  isConnectionInfoParamEqual,
} from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { isNotNullDefined } from '@cloudbeaver/core-utils';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ACTION_DATASOURCE_TRANSACTION_COMMIT } from './actions/ACTION_DATASOURCE_TRANSACTION_COMMIT';
import { ACTION_DATASOURCE_TRANSACTION_COMMIT_MODE_TOGGLE } from './actions/ACTION_DATASOURCE_TRANSACTION_COMMIT_MODE_TOGGLE';
import { ACTION_DATASOURCE_TRANSACTION_ROLLBACK } from './actions/ACTION_DATASOURCE_TRANSACTION_ROLLBACK';
import { TransactionManagerSettingsService } from './TransactionManagerSettingsService';

@injectable()
export class TransactionManagerBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly connectionExecutionContextService: ConnectionExecutionContextService,
    private readonly connectionExecutionContextResource: ConnectionExecutionContextResource,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly localizationService: LocalizationService,
    private readonly transactionManagerSettingsService: TransactionManagerSettingsService,
  ) {
    super();
  }

  register() {
    this.connectionsManagerService.onDisconnect.addHandler(this.disconnectHandler.bind(this));

    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      isApplicable: () => {
        const transaction = this.getContextTransaction();

        return (
          !this.transactionManagerSettingsService.disabled &&
          !this.optionsPanelService.active &&
          this.connectionSchemaManagerService.currentConnection?.connected === true &&
          !!transaction?.context &&
          isNotNullDefined(transaction.autoCommit)
        );
      },
      getItems: (_, items) => [
        ...items,
        ACTION_DATASOURCE_TRANSACTION_COMMIT,
        ACTION_DATASOURCE_TRANSACTION_ROLLBACK,
        ACTION_DATASOURCE_TRANSACTION_COMMIT_MODE_TOGGLE,
      ],
    });

    this.actionService.addHandler({
      id: 'commit-mode-base',
      actions: [ACTION_DATASOURCE_TRANSACTION_COMMIT, ACTION_DATASOURCE_TRANSACTION_ROLLBACK, ACTION_DATASOURCE_TRANSACTION_COMMIT_MODE_TOGGLE],
      isLabelVisible: (_, action) => action === ACTION_DATASOURCE_TRANSACTION_COMMIT || action === ACTION_DATASOURCE_TRANSACTION_ROLLBACK,
      getActionInfo: (_, action) => {
        const transaction = this.getContextTransaction();

        if (!transaction) {
          return action.info;
        }

        if (action === ACTION_DATASOURCE_TRANSACTION_COMMIT_MODE_TOGGLE) {
          const auto = transaction.autoCommit;
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

        if (action === ACTION_DATASOURCE_TRANSACTION_COMMIT || action === ACTION_DATASOURCE_TRANSACTION_ROLLBACK) {
          return transaction.autoCommit === true;
        }

        return false;
      },
      handler: async (_, action) => {
        const transaction = this.getContextTransaction();

        if (!transaction) {
          return;
        }

        switch (action) {
          case ACTION_DATASOURCE_TRANSACTION_COMMIT: {
            await this.commit(transaction);
            break;
          }
          case ACTION_DATASOURCE_TRANSACTION_ROLLBACK: {
            try {
              const result = await transaction.rollback();
              this.showTransactionResult(transaction, result);
            } catch (exception: any) {
              this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_rollback_fail');
            }

            break;
          }
          case ACTION_DATASOURCE_TRANSACTION_COMMIT_MODE_TOGGLE:
            try {
              await transaction.setAutoCommit(!transaction.autoCommit);
              await this.connectionExecutionContextResource.refresh();
            } catch (exception: any) {
              this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_commit_mode_fail');
            }

            break;
        }
      },
    });
  }

  private showTransactionResult(transaction: ConnectionExecutionContext, info: IConnectionExecutionContextUpdateTaskInfo) {
    if (!transaction.context) {
      return;
    }

    const connectionParam = createConnectionParam(transaction.context.projectId, transaction.context.connectionId);
    const connection = this.connectionInfoResource.get(connectionParam);
    const message = typeof info.result === 'string' ? info.result : '';

    this.notificationService.logInfo({ title: connection?.name ?? info.name ?? '', message });
  }

  private getContextTransaction() {
    const context = this.connectionSchemaManagerService.activeExecutionContext;

    if (!context) {
      return;
    }

    return this.connectionExecutionContextService.get(context.id);
  }

  private async disconnectHandler(data: IConnectionExecutorData, contexts: IExecutionContextProvider<IConnectionExecutorData>) {
    if (data.state === 'before') {
      for (const connectionKey of data.connections) {
        const context = this.connectionExecutionContextResource.values.find(connection => isConnectionInfoParamEqual(connection, connectionKey));

        if (context) {
          const transaction = this.connectionExecutionContextService.get(context.id);

          if (transaction?.autoCommit === false) {
            const connectionData = this.connectionInfoResource.get(connectionKey);
            const state = await this.commonDialogService.open(ConfirmationDialog, {
              title: `${this.localizationService.translate('plugin_datasource_transaction_manager_commit')} (${connectionData?.name ?? context.id})`,
              message: 'plugin_datasource_transaction_manager_commit_confirmation_message',
              confirmActionText: 'plugin_datasource_transaction_manager_commit',
              extraStatus: 'no',
            });

            if (state === DialogueStateResult.Resolved) {
              await this.commit(transaction, () => ExecutorInterrupter.interrupt(contexts));
            } else if (state === DialogueStateResult.Rejected) {
              ExecutorInterrupter.interrupt(contexts);
            }
          }
        }
      }
    }
  }

  private async commit(transaction: ConnectionExecutionContext, onError?: (exception: any) => void) {
    try {
      const result = await transaction.commit();
      this.showTransactionResult(transaction, result);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_datasource_transaction_manager_commit_fail');
      onError?.(exception);
    }
  }
}
