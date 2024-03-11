/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import { ConnectionSchemaManagerService } from '@cloudbeaver/plugin-datasource-context-switch';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ACTION_COMMIT } from './actions/ACTION_COMMIT';
import { ACTION_COMMIT_MODE_TOGGLE } from './actions/ACTION_COMMIT_MODE_TOGGLE';
import { ACTION_ROLLBACK } from './actions/ACTION_ROLLBACK';
import { TransactionManagerService } from './TransactionManagerService';

@injectable()
export class TransactionManagerBootstrap extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly transactionManagerService: TransactionManagerService,
    private readonly optionsPanelService: OptionsPanelService,
  ) {
    super();
  }

  register() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      isApplicable: () =>
        !this.optionsPanelService.active &&
        !!this.connectionSchemaManagerService.currentConnection?.connected &&
        !!this.transactionManagerService.currentContext,
      getItems: (_, items) => [...items, ACTION_COMMIT, ACTION_ROLLBACK, ACTION_COMMIT_MODE_TOGGLE],
    });

    this.actionService.addHandler({
      id: 'commit-mode-base',
      isActionApplicable: (_, action) => [ACTION_COMMIT, ACTION_ROLLBACK, ACTION_COMMIT_MODE_TOGGLE].includes(action),
      isLabelVisible: (_, action) => action === ACTION_COMMIT || action === ACTION_ROLLBACK,
      getActionInfo: (_, action) => {
        if (action === ACTION_COMMIT_MODE_TOGGLE) {
          const auto = this.transactionManagerService.autoCommitMode;
          const icon = `/icons/commit_mode_${auto ? 'auto' : 'manual'}_m.svg`;
          const label = `plugin_datasource_transaction_manager_commit_mode_switch_to_${auto ? 'manual' : 'auto'}`;

          return { ...action.info, icon, label, tooltip: label };
        }

        return action.info;
      },
      isDisabled: (_, action) => {
        const context = this.transactionManagerService.currentContext;

        if (!context) {
          return false;
        }

        const transaction = this.transactionManagerService.transactions.get(context.id);
        return transaction.executing;
      },
      isHidden: (_, action) => {
        if (action === ACTION_COMMIT || action === ACTION_ROLLBACK) {
          return this.transactionManagerService.autoCommitMode;
        }

        return false;
      },
      handler: async (_, action) => {
        const context = this.transactionManagerService.currentContext;

        if (!context) {
          return;
        }

        switch (action) {
          case ACTION_COMMIT:
            await this.transactionManagerService.commit(context.connectionId, context.id);
            break;
          case ACTION_ROLLBACK:
            await this.transactionManagerService.rollback(context.connectionId, context.id);
            break;
          case ACTION_COMMIT_MODE_TOGGLE:
            await this.transactionManagerService.setAutoCommit(context.connectionId, context.id, !context.autoCommit);
            break;
          default:
            break;
        }
      },
    });
  }

  load() {}
}
