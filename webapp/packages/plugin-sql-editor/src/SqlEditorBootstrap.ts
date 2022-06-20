/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { ConnectionsManagerService, IConnectionHandlerData } from '@cloudbeaver/core-connections';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ExecutorInterrupter, IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { IServerConfigSaveData, ServerConfigurationService } from '@cloudbeaver/plugin-administration';
import { AuthenticationService, LogoutState } from '@cloudbeaver/plugin-authentication';
import { SqlEditorTabService } from '@cloudbeaver/plugin-sql-editor-navigation-tab';

import { SqlEditorMenuService } from './SqlEditorMenuService';
import { SqlResultTabsService } from './SqlResultTabs/SqlResultTabsService';

@injectable()
export class SqlEditorBootstrap extends Bootstrap {
  constructor(
    private readonly authenticationService: AuthenticationService,
    private readonly sqlEditorTabService: SqlEditorTabService,
    private readonly sqlResultTabsService: SqlResultTabsService,
    private readonly sqlEditorMenuService: SqlEditorMenuService,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly serverConfigurationService: ServerConfigurationService
  ) {
    super();
  }

  register(): void {
    this.sqlEditorMenuService.register();

    this.authenticationService.onLogout.addHandler(this.logoutHandler.bind(this));
    this.connectionsManagerService.onDisconnect.addHandler(this.connectionHandler.bind(this));
    this.connectionsManagerService.onDelete.addHandler(this.connectionHandler.bind(this));
    this.serverConfigurationService.saveTask.addHandler(this.saveHandler.bind(this));
  }

  load(): void | Promise<void> { }

  private async saveHandler(data: IServerConfigSaveData, contexts: IExecutionContextProvider<IServerConfigSaveData>) {
    for (const tab of this.sqlEditorTabService.sqlEditorTabs) {
      const canSave = await this.sqlResultTabsService.canCloseResultTabs(tab.handlerState);

      if (!canSave) {
        ExecutorInterrupter.interrupt(contexts);
        return;
      }
    }
  }

  private async logoutHandler(data: LogoutState, contexts: IExecutionContextProvider<LogoutState>) {
    if (data === 'before') {
      for (const tab of this.sqlEditorTabService.sqlEditorTabs) {
        const canLogout = await this.sqlResultTabsService.canCloseResultTabs(tab.handlerState);

        if (!canLogout) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
      }
    }
  }

  private async connectionHandler(
    data: IConnectionHandlerData,
    contexts: IExecutionContextProvider<IConnectionHandlerData>
  ) {
    if (data.state === 'before') {
      for (const tab of this.sqlEditorTabService.sqlEditorTabs) {
        if (tab.handlerState.executionContext?.connectionId !== data.connectionId) {
          continue;
        }

        const canPerformAction = await this.sqlResultTabsService.canCloseResultTabs(tab.handlerState);

        if (!canPerformAction) {
          ExecutorInterrupter.interrupt(contexts);
          return;
        }
      }
    }
  }
}