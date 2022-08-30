/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { ConnectionInfoResource, createConnectionParam, IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import type { ConnectionConfig, ResourceKey } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';
import { AuthenticationService } from '@cloudbeaver/plugin-authentication';

import { ConnectionAuthService } from '../ConnectionAuthService';
import { ConnectionFormService } from '../ConnectionForm/ConnectionFormService';
import { ConnectionFormState } from '../ConnectionForm/ConnectionFormState';
import type { IConnectionFormState } from '../ConnectionForm/IConnectionFormProps';
import { PublicConnectionForm } from './PublicConnectionForm';

const formGetter = () => PublicConnectionForm;

@injectable()
export class PublicConnectionFormService {
  formState: IConnectionFormState | null;

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly connectionFormService: ConnectionFormService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly connectionAuthService: ConnectionAuthService,
    private readonly authenticationService: AuthenticationService,
  ) {
    this.formState = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);
    this.connectionInfoResource.onDataUpdate.addPostHandler(this.closeRemoved);
    this.connectionInfoResource.onItemDelete.addPostHandler(this.closeDeleted);

    this.authenticationService.onLogin.addHandler(async (event, context) => {
      if (event === 'before') {
        const confirmed = await this.close(false);
        if (!confirmed) {
          ExecutorInterrupter.interrupt(context);
        }
      }
    });

    this.authenticationService.onLogout.addHandler(async (event, context) => {
      if (event === 'before') {
        const confirmed = await this.close(false);
        if (!confirmed) {
          ExecutorInterrupter.interrupt(context);
        }
      }
    });

    makeObservable(this, {
      formState: observable.shallow,
      change: action,
      open: action,
      close: action,
    });
  }

  change(projectId: string, config: ConnectionConfig, availableDrivers?: string[]): void {
    // if (this.formState) {
    //   this.formState.dispose();
    // }

    if (!this.formState) {
      this.formState = new ConnectionFormState(
        this.connectionFormService,
        this.connectionInfoResource
      );
    }

    this.formState
      .setOptions(
        config.connectionId ? 'edit' : 'create',
        'public'
      )
      .setConfig(projectId, config)
      .setAvailableDrivers(availableDrivers || []);

    this.formState.load();
  }

  async open(projectId: string, config: ConnectionConfig, availableDrivers?: string[]): Promise<boolean> {
    const state = await this.optionsPanelService.open(formGetter);

    if (state) {
      this.change(projectId, config, availableDrivers);
    }

    return state;
  }

  async close(saved?: boolean) {
    if (!this.formState) {
      return true;
    }

    if (saved) {
      this.clearFormState();
    }

    const state = await this.optionsPanelService.close();

    if (state) {
      this.clearFormState();
    }

    return state;
  }

  async save(): Promise<void> {
    const key = (
      (this.formState && this.formState.config.connectionId && this.formState.projectId !== null)
        ? createConnectionParam(
          this.formState.projectId,
          this.formState.config.connectionId
        )
        : null
    );

    await this.close(true);

    if (key && this.connectionInfoResource.isConnected(key)) {
      this.tryReconnect(key);
    }
  }

  private readonly closeRemoved: IExecutorHandler<ResourceKey<IConnectionInfoParams>> = (data, contexts) => {
    if (!this.formState || !this.formState.config.connectionId || this.formState.projectId === null) {
      return;
    }

    if (!this.connectionInfoResource.has(createConnectionParam(
      this.formState.projectId,
      this.formState.config.connectionId
    ))) {
      this.close(true);
    }
  };

  private readonly closeDeleted: IExecutorHandler<ResourceKey<IConnectionInfoParams>> = (data, contexts) => {
    if (!this.formState || !this.formState.config.connectionId || this.formState.projectId === null) {
      return;
    }

    if (this.connectionInfoResource.includes(data, createConnectionParam(
      this.formState.projectId,
      this.formState.config.connectionId
    ))) {
      this.close(true);
    }
  };

  private readonly closeHandler: IExecutorHandler<any> = async (data, contexts) => {
    if (
      !this.formState
      || !this.optionsPanelService.isOpen(formGetter)
      || (
        this.formState.config.connectionId
        && this.formState.projectId !== null
        && !this.connectionInfoResource.has(createConnectionParam(
          this.formState.projectId,
          this.formState.config.connectionId
        ))
      )
    ) {
      return;
    }

    const state = await this.formState.checkFormState();

    if (!state?.edited) {
      return;
    }

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'connections_public_connection_edit_cancel_title',
      message: 'connections_public_connection_edit_cancel_message',
      confirmActionText: 'ui_processing_ok',
    });

    if (result === DialogueStateResult.Rejected) {
      ExecutorInterrupter.interrupt(contexts);
    }
  };

  private async tryReconnect(connectionKey: IConnectionInfoParams) {
    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'connections_public_connection_edit_reconnect_title',
      message: 'connections_public_connection_edit_reconnect_message',
      confirmActionText: 'ui_reconnect',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }

    try {
      await this.connectionInfoResource.close(connectionKey);
      await this.connectionAuthService.auth(connectionKey);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'connections_public_connection_edit_reconnect_failed');
    }
  }

  private clearFormState() {
    this.formState?.dispose();
    this.formState = null;
  }
}
