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
import { uuid } from '@cloudbeaver/core-utils';

import type { IAIProfileFormState } from './IAIProfileFormState.js';

const AIProfileForm = importLazyComponent(() => import('./AIProfileForm.js').then(m => m.AIProfileForm));

const formGetter = () => AIProfileForm;

@injectable(() => [LocalizationService, NotificationService, OptionsPanelService, IServiceProvider, CommonDialogService])
export class AIProfileFormService extends FormBaseService<IAIProfileFormState> {
  formState: FormState<IAIProfileFormState> | null;

  constructor(
    localizationService: LocalizationService,
    notificationService: NotificationService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly serviceProvider: IServiceProvider,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super(localizationService, notificationService, 'AIProfileForm');

    this.formState = null;
    this.optionsPanelService.closeTask.addHandler(this.closeHandler);

    makeObservable(this, {
      formState: observable.shallow,
      open: action.bound,
      close: action.bound,
    });
  }

  async open(profileId: string | null, profileName?: string): Promise<boolean> {
    if (this.optionsPanelService.isOpen(formGetter)) {
      return false;
    }

    const opened = await this.optionsPanelService.open(formGetter);

    if (opened) {
      this.formState?.dispose();
      this.formState = new FormState<IAIProfileFormState>(this.serviceProvider, this, {
        profileId: profileId ?? uuid(),
        name: profileName ?? '',
      }).setMode(profileId ? FormMode.Edit : FormMode.Create);
    }

    return opened;
  }

  async close(): Promise<void> {
    await this.optionsPanelService.close();
  }

  private readonly closeHandler: IExecutorHandler<OptionsPanelCloseEventData> = async (data, contexts) => {
    if (data === 'before') {
      const confirmed = await this.showUnsavedChangesDialog();

      if (!confirmed) {
        ExecutorInterrupter.interrupt(contexts);
        return;
      }

      this.clearFormState();
    }
  };

  private async showUnsavedChangesDialog(): Promise<boolean> {
    if (!this.formState || !this.optionsPanelService.isOpen(formGetter)) {
      return true;
    }

    if (!this.formState.isChanged) {
      return true;
    }

    const { status } = await this.commonDialogService.open(ConfirmationDialog, {
      title: 'ui_discard_changes',
      message: 'ui_discard_changes_message',
      confirmActionText: 'ui_discard',
      cancelActionText: 'ui_keep_editing',
    });

    return status !== DialogueStateResult.Rejected;
  }

  private clearFormState(): void {
    this.formState?.dispose();
    this.formState = null;
  }
}
