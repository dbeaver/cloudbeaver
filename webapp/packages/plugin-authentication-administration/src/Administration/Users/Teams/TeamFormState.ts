/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { computed, makeObservable, observable } from 'mobx';

import type { TeamInfo, TeamInfoMetaParametersResource, TeamsResource } from '@cloudbeaver/core-authentication';
import { Executor, type IExecutionContextProvider, type IExecutor } from '@cloudbeaver/core-executor';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { teamFormConfigureContext } from './Contexts/teamFormConfigureContext.js';
import { type ITeamFormStateInfo, teamFormStateContext } from './Contexts/teamFormStateContext.js';
import type { ITeamFormState, ITeamFormSubmitData, TeamFormMode, TeamInfoConfig } from './ITeamFormProps.js';
import type { TeamFormService } from './TeamFormService.js';

export class TeamFormState implements ITeamFormState {
  mode: TeamFormMode;
  config: TeamInfoConfig;
  statusMessage: string | null;
  configured: boolean;
  partsState: MetadataMap<string, any>;

  get info(): TeamInfoConfig | undefined {
    if (!this.config.teamId) {
      return undefined;
    }
    const info = this.resource.get(this.config.teamId) ?? {};
    const meta = this.teamInfoMetaParametersResource.get(this.config.teamId) ?? {};

    return {
      ...info,
      metaParameters: meta,
    } as TeamInfoConfig;
  }

  get loading(): boolean {
    return this.loadTeamTask.executing || this.submittingTask.executing;
  }

  get disabled(): boolean {
    return this.loading || !!this.stateInfo?.disabled || this.loadTeamTask.executing;
  }

  get readonly(): boolean {
    return false;
  }

  readonly resource: TeamsResource;
  readonly teamInfoMetaParametersResource: TeamInfoMetaParametersResource;

  readonly service: TeamFormService;
  readonly submittingTask: IExecutor<ITeamFormSubmitData>;

  private stateInfo: ITeamFormStateInfo | null;
  private readonly loadTeamTask: IExecutor<ITeamFormState>;
  private readonly formStateTask: IExecutor<ITeamFormState>;

  constructor(service: TeamFormService, resource: TeamsResource, teamInfoMetaParametersResource: TeamInfoMetaParametersResource) {
    this.resource = resource;
    this.teamInfoMetaParametersResource = teamInfoMetaParametersResource;
    this.config = {
      teamId: '',
      teamPermissions: [],
      metaParameters: {},
    };

    this.stateInfo = null;
    this.service = service;
    this.formStateTask = new Executor<ITeamFormState>(this, () => true);
    this.loadTeamTask = new Executor<ITeamFormState>(this, () => true);
    this.submittingTask = new Executor();
    this.statusMessage = null;
    this.configured = false;
    this.partsState = new MetadataMap();
    this.mode = 'create';

    makeObservable<ITeamFormState>(this, {
      mode: observable,
      config: observable,
      statusMessage: observable,
      info: computed,
      readonly: computed,
    });

    this.save = this.save.bind(this);
    this.loadInfo = this.loadInfo.bind(this);
    this.updateFormState = this.updateFormState.bind(this);

    this.formStateTask.addCollection(service.formStateTask).addPostHandler(this.updateFormState);

    this.loadTeamTask
      .before(service.configureTask)
      .addPostHandler(this.loadInfo)
      .next(service.fillConfigTask, (state, contexts) => {
        const configuration = contexts.getContext(teamFormConfigureContext);

        return {
          state,
          updated: state.info !== configuration.info || !this.configured,
        };
      })
      .next(this.formStateTask);
  }

  async load(): Promise<void> {}

  async loadTeamInfo(): Promise<TeamInfo | undefined> {
    await this.loadTeamTask.execute(this);

    return this.info;
  }

  setOptions(mode: TeamFormMode): this {
    this.mode = mode;
    return this;
  }

  setConfig(config: TeamInfoConfig): this {
    this.config = config;
    return this;
  }

  async save(): Promise<void> {
    await this.submittingTask.executeScope(
      {
        state: this,
      },
      this.service.formSubmittingTask,
    );
  }

  private updateFormState(data: ITeamFormState, contexts: IExecutionContextProvider<ITeamFormState>): void {
    const context = contexts.getContext(teamFormStateContext);

    this.statusMessage = context.statusMessage;

    this.stateInfo = context;
    this.configured = true;
  }

  private async loadInfo(data: ITeamFormState, contexts: IExecutionContextProvider<ITeamFormState>) {
    if (!data.config.teamId) {
      return;
    }

    if (!this.resource.has(data.config.teamId)) {
      return;
    }

    await Promise.all([this.resource.load(data.config.teamId), this.teamInfoMetaParametersResource.load(data.config.teamId)]);
  }
}
