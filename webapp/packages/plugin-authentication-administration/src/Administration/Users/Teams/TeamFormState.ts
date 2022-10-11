/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { computed, makeObservable, observable } from 'mobx';

import type { TeamInfo } from '@cloudbeaver/core-authentication';
import { Executor, IExecutionContextProvider, IExecutor } from '@cloudbeaver/core-executor';
import type { CachedMapResource } from '@cloudbeaver/core-sdk';
import { MetadataMap } from '@cloudbeaver/core-utils';

import { teamFormConfigureContext } from './Contexts/teamFormConfigureContext';
import { ITeamFormStateInfo, teamFormStateContext } from './Contexts/teamFormStateContext';
import type { ITeamFormState, ITeamFormSubmitData, TeamFormMode } from './ITeamFormProps';
import type { TeamFormService } from './TeamFormService';

export class TeamFormState implements ITeamFormState {
  mode: TeamFormMode;
  config: TeamInfo;
  statusMessage: string | null;
  configured: boolean;
  partsState: MetadataMap<string, any>;

  get info(): TeamInfo | undefined {
    if (!this.config.teamId) {
      return undefined;
    }
    return this.resource.get(this.config.teamId);
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

  readonly resource: CachedMapResource<string, TeamInfo>;

  readonly service: TeamFormService;
  readonly submittingTask: IExecutor<ITeamFormSubmitData>;

  private stateInfo: ITeamFormStateInfo | null;
  private readonly loadTeamTask: IExecutor<ITeamFormState>;
  private readonly formStateTask: IExecutor<ITeamFormState>;

  constructor(
    service: TeamFormService,
    resource: CachedMapResource<string, TeamInfo>
  ) {
    this.resource = resource;
    this.config = {
      teamId: '',
      teamPermissions: [],
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

    this.formStateTask
      .addCollection(service.formStateTask)
      .addPostHandler(this.updateFormState);

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

  async load(): Promise<void> { }

  async loadTeamInfo(): Promise<TeamInfo | undefined> {
    await this.loadTeamTask.execute(this);

    return this.info;
  }

  setOptions(
    mode: TeamFormMode,
  ): this {
    this.mode = mode;
    return this;
  }

  setConfig(config: TeamInfo): this {
    this.config = config;
    return this;
  }

  async save(): Promise<void> {
    await this.submittingTask.executeScope(
      {
        state: this,
      },
      this.service.formSubmittingTask
    );
  }

  private updateFormState(
    data: ITeamFormState,
    contexts: IExecutionContextProvider<ITeamFormState>
  ): void {
    const context = contexts.getContext(teamFormStateContext);

    this.statusMessage = context.statusMessage;

    this.stateInfo = context;
    this.configured = true;
  }

  private async loadInfo(
    data: ITeamFormState,
    contexts: IExecutionContextProvider<ITeamFormState>
  ) {
    if (!data.config.teamId) {
      return;
    }

    if (!this.resource.has(data.config.teamId)) {
      return;
    }

    await this.resource.load(data.config.teamId);
  }
}
