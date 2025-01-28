/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import type { TeamInfo, TeamInfoMetaParametersResource, TeamsResource } from '@cloudbeaver/core-authentication';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import type { LocalizationService } from '@cloudbeaver/core-localization';
import { FormMode, FormPart, formValidationContext, type IFormState } from '@cloudbeaver/core-ui';
import { getUniqueName } from '@cloudbeaver/core-utils';

import type { ITeamFormState } from '../TeamsAdministrationFormService.js';
import type { ITeamOptionsState } from './ITeamOptionsState.js';

function getInitialState(): ITeamOptionsState {
  return {
    teamId: '',
    teamName: '',
    description: '',
    teamPermissions: [],
    metaParameters: {},
  };
}

export class TeamOptionsFormPart extends FormPart<ITeamOptionsState, ITeamFormState> {
  constructor(
    formState: IFormState<ITeamFormState>,
    private readonly teamResource: TeamsResource,
    private readonly teamsMetaParametersResource: TeamInfoMetaParametersResource,
    private readonly localizationService: LocalizationService,
  ) {
    super(formState, getInitialState());
  }

  protected override async loader(): Promise<void> {
    if (this.formState.mode === 'edit' && this.formState.state.teamId) {
      const [team, metaParameters] = await Promise.all([
        this.teamResource.load(this.formState.state.teamId),
        this.teamsMetaParametersResource.load(this.formState.state.teamId),
      ]);

      this.setInitialState({
        teamId: team.teamId,
        teamName: team.teamName ?? '',
        description: team.description ?? '',
        teamPermissions: team.teamPermissions,
        metaParameters: metaParameters,
      });

      return;
    }

    this.setInitialState(getInitialState());
  }

  protected override validate(
    data: IFormState<ITeamFormState>,
    contexts: IExecutionContextProvider<IFormState<ITeamFormState>>,
  ): void | Promise<void> {
    const validation = contexts.getContext(formValidationContext);

    if (this.formState.mode === 'create') {
      if (!this.state.teamId?.trim()) {
        validation.error('administration_teams_team_info_id_invalid');
      }

      if (this.state.teamId && this.teamResource.has(this.state.teamId)) {
        validation.error(
          this.localizationService.translate('administration_teams_team_info_exists', undefined, {
            teamId: this.state.teamId,
          }),
        );
      }
    }
  }

  protected override format(data: IFormState<ITeamFormState>, contexts: IExecutionContextProvider<IFormState<ITeamFormState>>): void | Promise<void> {
    this.state.teamId = this.state.teamId.trim();

    if (this.state.teamName) {
      this.state.teamName = this.state.teamName.trim();

      if (this.formState.mode === 'create') {
        const teamNames = this.teamResource.values.map(team => team.teamName).filter(Boolean) as string[];
        this.state.teamName = getUniqueName(this.state.teamName, teamNames);
      }
    }

    if (this.state.description) {
      this.state.description = this.state.description.trim();
    }

    if (this.state.metaParameters) {
      for (const key of Object.keys(this.state.metaParameters)) {
        if (typeof this.state.metaParameters[key] === 'string') {
          this.state.metaParameters[key] = (this.state.metaParameters[key] as any).trim();
        }
      }
    }
  }

  protected override async saveChanges(
    data: IFormState<ITeamFormState>,
    contexts: IExecutionContextProvider<IFormState<ITeamFormState>>,
  ): Promise<void> {
    const teamInfo: TeamInfo = {
      teamId: this.state.teamId,
      teamName: this.state.teamName,
      description: this.state.description,
      teamPermissions: this.state.teamPermissions,
    };

    if (this.formState.mode === 'create') {
      const team = await this.teamResource.createTeam(teamInfo);
      this.formState.setMode(FormMode.Edit);
      await this.teamsMetaParametersResource.setMetaParameters(this.state.teamId, this.state.metaParameters);

      this.formState.setState({
        teamId: team.teamId,
      });

      return;
    }

    await Promise.all([
      this.teamResource.updateTeam(teamInfo),
      this.teamsMetaParametersResource.setMetaParameters(this.state.teamId, this.state.metaParameters),
    ]);
  }
}
