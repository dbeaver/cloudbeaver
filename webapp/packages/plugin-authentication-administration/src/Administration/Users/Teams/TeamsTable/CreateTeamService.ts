/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { action, makeObservable, observable } from 'mobx';

import { ConfirmationDialog, importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, IServiceProvider, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ExecutorInterrupter, type IExecutorHandler } from '@cloudbeaver/core-executor';
import { OptionsPanelService, type OptionsPanelCloseEventData } from '@cloudbeaver/core-ui';

import { TeamsAdministrationFormService } from '../TeamsForm/TeamsAdministrationFormService.js';
import { TeamsAdministrationFormState } from '../TeamsForm/TeamsAdministrationFormState.js';

const CreateTeam = importLazyComponent(() => import('./CreateTeam.js').then(m => m.CreateTeam));
const panelGetter = () => CreateTeam;

export class CreateTeamServiceImpl {
  formState: TeamsAdministrationFormState | null;

  constructor(
    private readonly serviceProvider: IServiceProvider,
    private readonly teamsAdministrationFormService: TeamsAdministrationFormService,
    private readonly optionsPanelService: OptionsPanelService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    this.formState = null;

    this.optionsPanelService.closeTask.addHandler(this.closeHandler);

    makeObservable(this, {
      formState: observable,
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
      await this.dispose();
      this.formState = new TeamsAdministrationFormState(this.serviceProvider, this.teamsAdministrationFormService, {
        teamId: null,
      });
    }
  }

  async dispose(): Promise<void> {
    await this.formState?.dispose();
    this.formState = null;
  }

  private readonly closeHandler: IExecutorHandler<OptionsPanelCloseEventData> = async (data, contexts) => {
    if (data !== 'before' || !this.optionsPanelService.isOpen(panelGetter)) {
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

    await this.dispose();
  };
}

export type CreateTeamService = CreateTeamServiceImpl;

export class CreateTeamServiceDI extends Context.Service<CreateTeamServiceDI, CreateTeamServiceImpl>()(
  '@cloudbeaver/plugin-authentication-administration/Administration/Users/Teams/TeamsTable/CreateTeamService#CreateTeamService',
) {
  static readonly implementation = CreateTeamServiceImpl;

  static readonly dependencies = () => [IServiceProvider, TeamsAdministrationFormService, OptionsPanelService, CommonDialogService] as const;
  static readonly make: Effect.Effect<
    CreateTeamServiceImpl,
    never,
    | Context.Service.Identifier<typeof IServiceProvider>
    | Context.Service.Identifier<typeof TeamsAdministrationFormService>
    | Context.Service.Identifier<typeof OptionsPanelService>
    | Context.Service.Identifier<typeof CommonDialogService>
  > = Effect.gen(function* makeCreateTeamService() {
    const serviceProvider = yield* IServiceProvider;
    const teamsAdministrationFormService = yield* TeamsAdministrationFormService;
    const optionsPanelService = yield* OptionsPanelService;
    const commonDialogService = yield* CommonDialogService;

    return new CreateTeamServiceImpl(serviceProvider, teamsAdministrationFormService, optionsPanelService, commonDialogService);
  });
  static readonly layer: Layer.Layer<
    CreateTeamServiceDI,
    never,
    | Context.Service.Identifier<typeof IServiceProvider>
    | Context.Service.Identifier<typeof TeamsAdministrationFormService>
    | Context.Service.Identifier<typeof OptionsPanelService>
    | Context.Service.Identifier<typeof CommonDialogService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const CreateTeamService = CreateTeamServiceDI;
