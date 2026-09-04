/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { ExecutorInterrupter, type IExecutorHandler } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, FormMode, FormState, OptionsPanelService, type OptionsPanelCloseEventData } from '@cloudbeaver/core-ui';
import { UserProfileTabsService } from '@cloudbeaver/plugin-user-profile';

import type { IAIProfileCredentialsFormState } from './AIProfileCredentialsForm/IAIProfileCredentialsFormState.js';
import type { IAIProfileCredentialsFormProps } from './AIProfileCredentialsForm/IAIProfileCredentialsFormProps.js';
import { AI_PROFILES_TAB_ID } from './AI_PROFILES_TAB_ID.js';

const AIProfileCredentialsPanel = importLazyComponent(() =>
  import('./components/AIProfileCredentialsPanel.js').then(module => module.AIProfileCredentialsPanel),
);
const panelGetter = () => AIProfileCredentialsPanel;

@injectable(() => [LocalizationService, NotificationService, OptionsPanelService, UserProfileTabsService, IServiceProvider, CommonDialogService])
export class AIProfileCredentialsPanelService extends FormBaseService<IAIProfileCredentialsFormState, IAIProfileCredentialsFormProps> {
  formState: FormState<IAIProfileCredentialsFormState> | null = null;

  constructor(
    localizationService: LocalizationService,
    notificationService: NotificationService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly userProfileTabsService: UserProfileTabsService,
    private readonly serviceProvider: IServiceProvider,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super(localizationService, notificationService, 'AIProfileCredentialsForm');

    this.optionsPanelService.closeTask.addHandler(this.closeHandler);

    makeObservable(this, {
      formState: observable.shallow,
      open: action.bound,
      close: action.bound,
    });
  }

  async open(profileId: string): Promise<boolean> {
    const opened = await this.optionsPanelService.open(panelGetter);

    if (opened) {
      await this.formState?.dispose();
      this.formState = new FormState<IAIProfileCredentialsFormState>(this.serviceProvider, this, { profileId }).setMode(FormMode.Edit);
    }

    return opened;
  }

  back(): Promise<boolean> {
    return this.userProfileTabsService.open(AI_PROFILES_TAB_ID);
  }

  close(): Promise<boolean> {
    return this.optionsPanelService.close();
  }

  private readonly closeHandler: IExecutorHandler<OptionsPanelCloseEventData> = async (data, contexts) => {
    if (!this.optionsPanelService.isOpen(panelGetter)) {
      return;
    }

    if (data === 'after') {
      await this.formState?.dispose();
      this.formState = null;
      return;
    }

    if (this.formState?.isChanged) {
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
  };
}
