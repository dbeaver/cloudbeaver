/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { ConfirmationDialog, importLazyComponent, PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, type IExecutorHandler } from '@cloudbeaver/core-executor';
import { OptionsPanelService, type OptionsPanelCloseEventData } from '@cloudbeaver/core-ui';

import { AdministrationUserFormService } from '../UserForm/AdministrationUserFormService.js';
import { AdministrationUserFormState } from '../UserForm/AdministrationUserFormState.js';

const CreateUser = importLazyComponent(() => import('./CreateUser.js').then(m => m.CreateUser));
const panelGetter = () => CreateUser;

export interface IToolsContainerProps {
  param: string | null | undefined;
}

@injectable(() => [IServiceProvider, AdministrationUserFormService, OptionsPanelService, CommonDialogService])
export class CreateUserService {
  state: AdministrationUserFormState | null;
  readonly toolsContainer: PlaceholderContainer<IToolsContainerProps>;

  constructor(
    private readonly serviceProvider: IServiceProvider,
    private readonly administrationUserFormService: AdministrationUserFormService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    this.toolsContainer = new PlaceholderContainer();
    this.state = null;

    this.optionsPanelService.closeTask.addHandler(this.closeHandler);

    makeObservable(this, {
      state: observable,
      cancelCreate: action.bound,
      create: action.bound,
    });
  }

  async cancelCreate(): Promise<void> {
    await this.optionsPanelService.close();
  }

  async create(): Promise<void> {
    if (this.optionsPanelService.isOpen(panelGetter)) {
      return;
    }

    const opened = await this.optionsPanelService.open(panelGetter);

    if (opened) {
      this.clearUserTemplate();
      this.state = new AdministrationUserFormState(this.serviceProvider, this.administrationUserFormService, { userId: null });
    }
  }

  clearUserTemplate(): void {
    this.state?.dispose();
    this.state = null;
  }

  private readonly closeHandler: IExecutorHandler<OptionsPanelCloseEventData> = async (data, contexts) => {
    if (data !== 'before' || !this.optionsPanelService.isOpen(panelGetter)) {
      return;
    }

    if (this.state?.isChanged) {
      const { status } = await this.commonDialogService.open(ConfirmationDialog, {
        title: 'ui_discard_changes',
        message: 'ui_discard_changes_message',
        confirmActionText: 'ui_discard',
        cancelActionText: 'ui_keep_editing',
      });

      if (status === DialogueStateResult.Rejected) {
        ExecutorInterrupter.interrupt(contexts);
        return;
      }
    }

    this.clearUserTemplate();
  };
}
