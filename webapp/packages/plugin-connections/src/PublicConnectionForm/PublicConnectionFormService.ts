/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { ConnectionInfoResource, IConnectionFormDataOptions, IConnectionFormOptions } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { ConnectionConfig, ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { PublicConnectionForm } from './PublicConnectionForm';

const formGetter = () => PublicConnectionForm;

@injectable()
export class PublicConnectionFormService {
  options: IConnectionFormOptions;
  dataOptions: IConnectionFormDataOptions | null;

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly connectionInfoResource: ConnectionInfoResource
  ) {
    makeObservable(this, {
      dataOptions: observable,
      options: observable,
      open: action,
      close: action,
    });

    this.options = {
      mode: 'create',
      type: 'public',
    };
    this.dataOptions = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);
    this.connectionInfoResource.onItemDelete.addHandler(this.closeDeleted);
  }

  change(config: ConnectionConfig, availableDrivers?: string[]): void {
    this.dataOptions = {
      config: { ...config },
      availableDrivers: availableDrivers,
      resource: this.connectionInfoResource,
    };
    this.options.mode = config.connectionId ? 'edit' : 'create';
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
      this.dataOptions = null;
    }

    const state = await this.optionsPanelService.close();

    if (state) {
      this.dataOptions = null;
    }
  }

  private closeDeleted: IExecutorHandler<ResourceKey<string>> = async (data, contexts) => {
    if (!this.dataOptions) {
      return;
    }

    if (ResourceKeyUtils.includes(data, this.dataOptions.config.connectionId)) {
      this.close();
    }
  };

  private closeHandler: IExecutorHandler<any> = async (data, contexts) => {
    if (
      !this.dataOptions
      || this.optionsPanelService.panelComponent !== formGetter
      || (
        this.dataOptions.config.connectionId
        && !this.connectionInfoResource.has(this.dataOptions.config.connectionId)
      )
    ) {
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
}
