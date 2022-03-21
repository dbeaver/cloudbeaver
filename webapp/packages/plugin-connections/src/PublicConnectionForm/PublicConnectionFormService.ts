/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { SessionDataResource } from '@cloudbeaver/core-root';
import { ConnectionConfig, ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

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
    private readonly sessionDataResource: SessionDataResource
  ) {
    this.formState = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);
    this.connectionInfoResource.onDataUpdate.addPostHandler(this.closeRemoved);
    this.connectionInfoResource.onItemDelete.addPostHandler(this.closeDeleted);
    this.sessionDataResource.onDataOutdated.addHandler(() => {
      this.close(true);
    });

    makeObservable(this, {
      formState: observable.shallow,
      change: action,
      open: action,
      close: action,
    });
  }

  change(config: ConnectionConfig, availableDrivers?: string[]): void {
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
      .setOptions(config.connectionId ? 'edit' : 'create', 'public')
      .setConfig(config)
      .setAvailableDrivers(availableDrivers || []);

    this.formState.load();
  }

  async open(config: ConnectionConfig, availableDrivers?: string[]): Promise<boolean> {
    const state = await this.optionsPanelService.open(formGetter);

    if (state) {
      this.change(config, availableDrivers);
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

    const state = await this.optionsPanelService.close();

    if (state) {
      this.clearFormState();
    }
  }

  save(): void {
    const connection = this.formState?.info;

    this.close(true);

    if (connection?.id && connection.connected) {
      this.tryReconnect(connection.id);
    }
  }

  private readonly closeRemoved: IExecutorHandler<ResourceKey<string>> = (data, contexts) => {
    if (!this.formState || !this.formState.config.connectionId) {
      return;
    }

    if (!this.connectionInfoResource.has(this.formState.config.connectionId)) {
      this.close(true);
    }
  };

  private readonly closeDeleted: IExecutorHandler<ResourceKey<string>> = (data, contexts) => {
    if (!this.formState || !this.formState.config.connectionId) {
      return;
    }

    if (ResourceKeyUtils.includes(data, this.formState.config.connectionId)) {
      this.close(true);
    }
  };

  private readonly closeHandler: IExecutorHandler<any> = async (data, contexts) => {
    if (
      !this.formState
      || !this.optionsPanelService.isOpen(formGetter)
      || (
        this.formState.config.connectionId
        && !this.connectionInfoResource.has(this.formState.config.connectionId)
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

  private async tryReconnect(id: string) {
    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'connections_public_connection_edit_reconnect_title',
      message: 'connections_public_connection_edit_reconnect_message',
      confirmActionText: 'ui_reconnect',
    });

    if (result === DialogueStateResult.Rejected) {
      return;
    }

    try {
      await this.connectionInfoResource.close(id);
      await this.connectionAuthService.auth(id);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'connections_public_connection_edit_reconnect_failed');
    }
  }

  private clearFormState() {
    this.formState?.dispose();
    this.formState = null;
  }
}
