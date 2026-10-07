/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { injectable, IServiceProvider } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, FormMode, FormState } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormState } from './IProjectInfoFormState.js';
import { ProjectInfoOptionsPanelService } from './ProjectInfoOptionsPanelService.js';

@injectable(() => [LocalizationService, NotificationService, ProjectInfoOptionsPanelService, IServiceProvider])
export class ProjectInfoFormService extends FormBaseService<IProjectInfoFormState> {
  formState: FormState<IProjectInfoFormState> | null;

  constructor(
    localizationService: LocalizationService,
    notificationService: NotificationService,
    private readonly projectInfoOptionsPanelService: ProjectInfoOptionsPanelService,
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

  async open(projectId: string, tabId?: string): Promise<boolean> {
    if (this.projectInfoOptionsPanelService.isOpen()) {
      const projectChanged = this.formState?.state.projectId !== projectId;

      if (projectChanged) {
        this.formState?.dispose();
        this.formState = new FormState<IProjectInfoFormState>(this.serviceProvider, this, { projectId }).setMode(FormMode.Edit);
      }

      this.projectInfoOptionsPanelService.itemId = tabId ?? null;
      return true;
    }

    const opened = await this.projectInfoOptionsPanelService.open(tabId);

    this.formState?.dispose();
    this.formState = new FormState<IProjectInfoFormState>(this.serviceProvider, this, { projectId }).setMode(FormMode.Edit);

    return opened;
  }

  async close(): Promise<void> {
    this.formState?.dispose();
    this.formState = null;
    await this.projectInfoOptionsPanelService.close();
  }
}
