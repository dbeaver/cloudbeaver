/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { ConnectionFormService, ConnectionInfoResource, IConnectionFormState } from '@cloudbeaver/core-connections';
import { ConnectionFormState } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { SessionDataResource } from '@cloudbeaver/core-root';
import type { ConnectionConfig, ResourceKey } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { PublicConnectionForm } from './PublicConnectionForm';

const formGetter = () => PublicConnectionForm;

@injectable()
export class PublicConnectionFormService {
  formState: IConnectionFormState | null;

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly connectionFormService: ConnectionFormService,
    private readonly connectionInfoResource: ConnectionInfoResource,
    private readonly sessionDataResource: SessionDataResource
  ) {
    makeObservable(this, {
      formState: observable.shallow,
      change: action,
      open: action,
      close: action,
    });
    this.formState = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);
    this.connectionInfoResource.onDataUpdate.addPostHandler(this.closeDeleted);
    // this.sessionDataResource.onDataOutdated.addHandler(() => {
    //   this.close(true);
    // });
  }

  change(config: ConnectionConfig, availableDrivers?: string[]): void {
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
    if (saved) {
      this.clearFormState();
    }

    const state = await this.optionsPanelService.close();

    if (state) {
      this.clearFormState();
    }
  }

  private closeDeleted: IExecutorHandler<ResourceKey<string>> = (data, contexts) => {
    if (!this.formState || !this.formState.config.connectionId) {
      return;
    }

    if (!this.connectionInfoResource.has(this.formState.config.connectionId)) {
      this.close(true);
    }
  };

  private closeHandler: IExecutorHandler<any> = async (data, contexts) => {
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

  private clearFormState() {
    this.formState?.dispose();
    this.formState = null;
  }
}
