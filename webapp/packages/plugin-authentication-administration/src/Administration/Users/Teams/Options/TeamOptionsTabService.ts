/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { TeamsResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { getUniqueName } from '@cloudbeaver/core-utils';

import { teamContext } from '../Contexts/teamContext';
import type { ITeamFormFillConfigData, ITeamFormSubmitData } from '../ITeamFormProps';
import { TeamFormService } from '../TeamFormService';
import { TeamOptions } from './TeamOptions';

@injectable()
export class TeamOptionsTabService extends Bootstrap {
  constructor(
    private readonly teamFormService: TeamFormService,
    private readonly teamResource: TeamsResource,
    private readonly localizationService: LocalizationService
  ) {
    super();
  }

  register(): void {
    this.teamFormService.tabsContainer.add({
      key: 'options',
      name: 'ui_options',
      order: 1,
      panel: () => TeamOptions,
    });

    this.teamFormService.prepareConfigTask
      .addHandler(this.prepareConfig.bind(this));

    this.teamFormService.formValidationTask
      .addHandler(this.validate.bind(this));

    this.teamFormService.formSubmittingTask
      .addHandler(this.save.bind(this));

    this.teamFormService.fillConfigTask
      .addHandler(this.fillConfig.bind(this));
  }

  load(): void { }

  private async prepareConfig(
    {
      state,
    }: ITeamFormSubmitData,
    contexts: IExecutionContextProvider<ITeamFormSubmitData>
  ) {
    const config = contexts.getContext(teamContext);

    config.teamId = state.config.teamId;

    if (state.config.teamName) {
      config.teamName = state.config.teamName.trim();

      if (state.mode === 'create') {
        const teamNames = this.teamResource.values.map(team => team.teamName).filter(Boolean) as string[];
        config.teamName = getUniqueName(config.teamName, teamNames);
      }
    }

    if (state.config.description) {
      config.description = state.config.description;
    }

    config.teamPermissions = [...state.config.teamPermissions];
  }

  private async validate(
    {
      state,
    }: ITeamFormSubmitData,
    contexts: IExecutionContextProvider<ITeamFormSubmitData>
  ) {
    const validation = contexts.getContext(this.teamFormService.configurationValidationContext);

    if (state.mode === 'create') {
      if (!state.config.teamId.trim()) {
        validation.error('administration_teams_team_info_id_invalid');
      }

      if (this.teamResource.has(state.config.teamId)) {
        validation.error(this.localizationService.translate('administration_teams_team_info_exists', undefined, {
          teamId: state.config.teamId,
        }));
      }
    }
  }

  private async save(
    {
      state,
    }: ITeamFormSubmitData,
    contexts: IExecutionContextProvider<ITeamFormSubmitData>
  ) {
    const status = contexts.getContext(this.teamFormService.configurationStatusContext);
    const config = contexts.getContext(teamContext);

    const create = state.mode === 'create';

    try {
      if (create) {
        const team = await this.teamResource.createTeam(config);
        status.info('administration_teams_team_info_created');
        status.info(team.teamId);
      } else {
        const team = await this.teamResource.updateTeam(config);
        status.info('administration_teams_team_info_updated');
        status.info(team.teamId);
      }
    } catch (exception: any) {
      if (create) {
        status.error(exception, 'administration_teams_team_create_error');
      } else {
        status.error(exception, 'administration_teams_team_save_error');
      }
    }
  }

  private fillConfig(
    { state, updated }: ITeamFormFillConfigData,
    contexts: IExecutionContextProvider<ITeamFormFillConfigData>
  ) {
    if (!updated) {
      return;
    }

    if (!state.info) {
      return;
    }

    if (state.info.teamId) {
      state.config.teamId = state.info.teamId;
    }
    if (state.info.teamName) {
      state.config.teamName = state.info.teamName;
    }
    if (state.info.description) {
      state.config.description = state.info.description;
    }
    state.config.teamPermissions = [...state.info.teamPermissions];
  }
}
