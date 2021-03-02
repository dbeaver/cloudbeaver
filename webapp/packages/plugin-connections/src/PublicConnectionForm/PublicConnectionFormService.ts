/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { ConnectionInfoResource } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { ResourceKey, ResourceKeyUtils } from '@cloudbeaver/core-sdk';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { PublicConnectionForm } from './PublicConnectionForm';

const formGetter = () => PublicConnectionForm;

@injectable()
export class PublicConnectionFormService {
  connectionId: string | null;

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly connectionInfoResource: ConnectionInfoResource
  ) {
    makeObservable(this, {
      connectionId: observable,
    });

    this.connectionId = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);
    this.connectionInfoResource.onItemDelete.addHandler(this.closeDeleted);
  }

  async open(connectionId: string): Promise<void> {
    this.connectionId = connectionId;
    await this.optionsPanelService.open(formGetter);
  }

  async close(): Promise<void> {
    const state = await this.optionsPanelService.close();

    if (state) {
      this.connectionId = null;
    }
  }

  private closeDeleted: IExecutorHandler<ResourceKey<string>> = async (data, contexts) => {
    if (!this.connectionId) {
      return;
    }

    if (ResourceKeyUtils.includes(data, this.connectionId)) {
      this.close();
    }
  };

  private closeHandler: IExecutorHandler<any> = async (data, contexts) => {
    if (
      !this.connectionId
      || this.optionsPanelService.panelComponent !== formGetter
      || !this.connectionInfoResource.has(this.connectionId)
    ) {
      return;
    }

    const result = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'connections_public_connection_edit_cancel_title',
      message: 'connections_public_connection_edit_cancel_message',
      confirmActionText: 'ui_error_close',
    });

    if (result === DialogueStateResult.Rejected) {
      ExecutorInterrupter.interrupt(contexts);
    }
  };
}
