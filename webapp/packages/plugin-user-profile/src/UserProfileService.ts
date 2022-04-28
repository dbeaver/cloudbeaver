/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, ConfirmationDialog, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, IExecutorHandler } from '@cloudbeaver/core-executor';
import { OptionsPanelService } from '@cloudbeaver/core-ui';

import type { IUserProfileFormState } from './UserProfileForm/IUserProfileFormState';
import { UserProfileForm } from './UserProfileForm/UserProfileForm';
import { UserProfileFormState } from './UserProfileForm/UserProfileFormState';

const formGetter = () => UserProfileForm;

@injectable()
export class UserProfileService {
  formState: IUserProfileFormState | null;

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly userInfoResource: UserInfoResource,
  ) {
    this.formState = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);
    this.userInfoResource.onDataUpdate.addHandler(this.userUpdateHandler.bind(this));

    makeObservable(this, {
      formState: observable.ref,
      change: action,
      open: action,
      close: action,
    });
  }

  change(): void {
    if (!this.formState) {
      this.formState = new UserProfileFormState();
    }
  }

  async open(): Promise<boolean> {
    const state = await this.optionsPanelService.open(formGetter);

    if (state) {
      this.change();
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

  save(): void {
    this.close(true);
  }

  private readonly closeHandler: IExecutorHandler<any> = async (data, contexts) => {
    if (!this.formState || !this.optionsPanelService.isOpen(formGetter)) {
      return;
    }

    if (!this.formState.info.edited) {
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

  private userUpdateHandler() {
    if (!this.formState || !this.optionsPanelService.isOpen(formGetter)) {
      return;
    }

    if (this.userInfoResource.data === null) {
      this.save();
    }
  }

  private clearFormState() {
    this.formState?.dispose();
    this.formState = null;
  }
}
