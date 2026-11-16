/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { action, makeObservable, observable } from 'mobx';

import { Context, Effect, IServiceProvider, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { FormBaseService, FormMode, FormState } from '@cloudbeaver/core-ui';

import type { IProjectInfoFormState } from './IProjectInfoFormState.js';
import { ProjectInfoOptionsPanelService } from './ProjectInfoOptionsPanelService.js';

export class ProjectInfoFormServiceImpl extends FormBaseService<IProjectInfoFormState> {
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

export type ProjectInfoFormService = ProjectInfoFormServiceImpl;

export class ProjectInfoFormServiceDI extends Context.Service<ProjectInfoFormServiceDI, ProjectInfoFormServiceImpl>()(
  '@cloudbeaver/plugin-project-info/ProjectInfoForm/ProjectInfoFormService#ProjectInfoFormService',
) {
  static readonly implementation = ProjectInfoFormServiceImpl;

  static readonly dependencies = () => [LocalizationService, NotificationService, ProjectInfoOptionsPanelService, IServiceProvider] as const;
  static readonly make: Effect.Effect<
    ProjectInfoFormServiceImpl,
    never,
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ProjectInfoOptionsPanelService>
    | Context.Service.Identifier<typeof IServiceProvider>
  > = Effect.gen(function* makeProjectInfoFormService() {
    const localizationService = yield* LocalizationService;
    const notificationService = yield* NotificationService;
    const projectInfoOptionsPanelService = yield* ProjectInfoOptionsPanelService;
    const serviceProvider = yield* IServiceProvider;

    return new ProjectInfoFormServiceImpl(localizationService, notificationService, projectInfoOptionsPanelService, serviceProvider);
  });
  static readonly layer: Layer.Layer<
    ProjectInfoFormServiceDI,
    never,
    | Context.Service.Identifier<typeof LocalizationService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ProjectInfoOptionsPanelService>
    | Context.Service.Identifier<typeof IServiceProvider>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ProjectInfoFormService = ProjectInfoFormServiceDI;
