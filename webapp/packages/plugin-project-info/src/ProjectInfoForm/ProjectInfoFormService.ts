/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, FormMode, FormState, OptionsPanelService } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormState } from './IProjectInfoFormState.js';

const ProjectInfoForm = importLazyComponent(() => import('./ProjectInfoForm.js').then(m => m.ProjectInfoForm));

const formGetter = () => ProjectInfoForm;

@injectable(() => [LocalizationService, NotificationService, OptionsPanelService, IServiceProvider])
export class ProjectInfoFormService extends FormBaseService<IProjectInfoFormState> {
  formState: FormState<IProjectInfoFormState> | null;

  constructor(
    localizationService: LocalizationService,
    notificationService: NotificationService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly serviceProvider: IServiceProvider,
  ) {
    super(localizationService, notificationService, 'ProjectInfoForm');

    this.formState = null;

    makeObservable(this, {
      formState: observable.shallow,
      open: action.bound,
      close: action.bound,
    });
  }

  async open(projectId: string): Promise<boolean> {
    const opened = await this.optionsPanelService.open(formGetter);

    if (opened) {
      this.formState?.dispose();
      this.formState = new FormState<IProjectInfoFormState>(this.serviceProvider, this, { projectId }).setMode(FormMode.Edit);
    }

    return opened;
  }

  async close(): Promise<void> {
    this.formState?.dispose();
    this.formState = null;
    await this.optionsPanelService.close();
  }
}
