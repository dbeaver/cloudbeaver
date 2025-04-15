/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { ConnectionInfoResource, ConnectionsManagerService, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { executorHandlerFilter, ExecutorInterrupter, type IExecutorHandler } from '@cloudbeaver/core-executor';
import type { ResourceKey, ResourceKeySimple } from '@cloudbeaver/core-resource';
import type { ConnectionConfig } from '@cloudbeaver/core-sdk';
import { FormMode, OptionsPanelService } from '@cloudbeaver/core-ui';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

import { ConnectionFormState } from '../ConnectionForm/ConnectionFormState.js';
import { ConnectionFormService } from '../ConnectionForm/ConnectionFormService.js';
import { getConnectionFormOptionsPart } from '../ConnectionForm/Options/getConnectionFormOptionsPart.js';

const PublicConnectionForm = importLazyComponent(() => import('./PublicConnectionForm.js').then(m => m.PublicConnectionForm));

const formGetter = () => PublicConnectionForm;

@injectable()
export class PublicConnectionFormService {
  formState: ConnectionFormState | null;

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly serviceProvider: IServiceProvider,
    private readonly connectionFormService: ConnectionFormService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionsManagerService: ConnectionsManagerService,
    private readonly userInfoResource: UserInfoResource,
    private readonly authenticationService: AuthenticationService,
  ) {
    this.formState = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);
    this.connectionInfoResource.onDataUpdate.addPostHandler(this.closeRemoved);
    this.connectionInfoResource.onItemDelete.addPostHandler(this.closeDeleted);

    this.authenticationService.onLogin.addHandler(
      executorHandlerFilter(
        () => !!this.formState && this.optionsPanelService.isOpen(formGetter),
        async (event, context) => {
          if (event === 'before' && this.userInfoResource.isAnonymous()) {
            const confirmed = await this.showUnsavedChangesDialog();

            if (!confirmed) {
              ExecutorInterrupter.interrupt(context);
            }
          }
        },
      ),
    );

    makeObservable(this, {
      formState: observable.shallow,
      change: action,
      open: action,
      close: action,
    });
  }

  async change(projectId: string, config: ConnectionConfig, availableDrivers?: string[]): Promise<void> {
    this.formState?.dispose();
    this.formState = new ConnectionFormState(this.serviceProvider, this.connectionFormService, {
      projectId,
      availableDrivers: availableDrivers ?? [],
      type: 'public',
      requiredNetworkHandlersIds: [],
      connectionId: config.connectionId,
    }).setMode(config.connectionId ? FormMode.Edit : FormMode.Create);

    await this.optionsPart?.load();

    if (config.driverId) {
      await this.optionsPart?.setDriverId(config.driverId);
    }

    Object.assign(this.optionsPart!.state, config);

    this.formState.disposeTask.addHandler(this.close.bind(this, true));
  }

  async open(projectId: string, config: ConnectionConfig, availableDrivers?: string[]): Promise<boolean> {
    const state = await this.optionsPanelService.open(formGetter);

    if (state) {
      this.change(projectId, config, availableDrivers);
    }

    return state;
  }

  async close(saved?: boolean): Promise<void> {
    if (!this.formState) {
      return;
    }

    if (saved) {
      this.clearFormState();
    }

    await this.optionsPanelService.close();
  }

  async save(): Promise<void> {
    const key = this.optionsPart?.connectionKey;

    await this.close(true);

    if (key && this.connectionInfoResource.isConnected(key)) {
      this.tryReconnect(key);
    }
  }

  private get optionsPart() {
    return this.formState ? getConnectionFormOptionsPart(this.formState) : null;
  }

  private readonly closeRemoved: IExecutorHandler<ResourceKey<IConnectionInfoParams>> = (data, contexts) => {
    if (!this.formState || !this.optionsPart?.connectionKey) {
      return;
    }

    if (!this.connectionInfoResource.has(this.optionsPart.connectionKey)) {
      this.close(true);
    }
  };

  private readonly closeDeleted: IExecutorHandler<ResourceKeySimple<IConnectionInfoParams>> = (data, contexts) => {
    if (!this.formState || !this.optionsPart?.connectionKey) {
      return;
    }

    if (this.connectionInfoResource.isIntersect(data, this.optionsPart.connectionKey)) {
      this.close(true);
    }
  };

  private readonly closeHandler: IExecutorHandler<any> = async (data, contexts) => {
    const confirmed = await this.showUnsavedChangesDialog();

    if (!confirmed) {
      ExecutorInterrupter.interrupt(contexts);
      return;
    }

    this.clearFormState();
  };

  private async showUnsavedChangesDialog(): Promise<boolean> {
    if (
      !this.formState ||
      !this.optionsPanelService.isOpen(formGetter) ||
      (this.optionsPart?.connectionKey && !this.connectionInfoResource.has(this.optionsPart.connectionKey))
    ) {
      return true;
    }

    if (!this.formState.isChanged) {
      return true;
    }

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'plugin_connections_connection_edit_cancel_title',
      message: 'plugin_connections_connection_edit_cancel_message',
      confirmActionText: 'ui_processing_ok',
    });

    return result !== DialogueStateResult.Rejected;
  }

  private async tryReconnect(connectionKey: IConnectionInfoParams) {
    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'plugin_connections_connection_edit_reconnect_title',
      message: 'plugin_connections_connection_edit_reconnect_message',
      confirmActionText: 'ui_reconnect',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }

    try {
      await this.connectionsManagerService.closeConnectionAsync(connectionKey);
      await this.connectionsManagerService.requireConnection(connectionKey);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'plugin_connections_connection_edit_reconnect_failed');
    }
  }

  private clearFormState() {
    this.formState?.dispose();
    this.formState = null;
  }
}
