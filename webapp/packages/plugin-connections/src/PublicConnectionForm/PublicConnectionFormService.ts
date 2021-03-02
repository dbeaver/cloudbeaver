/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { makeObservable, observable } from 'mobx';

import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import { PublicConnectionForm } from './PublicConnectionForm';

const formGetter = () => PublicConnectionForm;

@injectable()
export class PublicConnectionFormService {
  connectionId: string | null;

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly optionsPanelService: OptionsPanelService
  ) {
    makeObservable(this, {
      connectionId: observable,
    });

    this.connectionId = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);
  }

  async open(connectionId: string): Promise<void> {
    this.connectionId = connectionId;
    await this.optionsPanelService.open(formGetter);
  }

  async close(): Promise<void> {
    this.connectionId = null;
    await this.optionsPanelService.close();
  }

  private closeHandler: IExecutorHandler<any> = async (data, contexts) => {
    if (this.optionsPanelService.panelComponent !== formGetter) {
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
