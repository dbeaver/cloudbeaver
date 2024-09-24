/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { TeamInfoMetaParametersResource, TeamsResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';

import type { ITeamFormState } from './ITeamFormProps.js';
import { TeamFormService } from './TeamFormService.js';
import { TeamFormState } from './TeamFormState.js';
import { TeamsAdministrationNavService } from './TeamsAdministrationNavService.js';

@injectable()
export class CreateTeamService {
  disabled = false;
  data: ITeamFormState | null;

  constructor(
    private readonly teamsAdministrationNavService: TeamsAdministrationNavService,
    private readonly teamFormService: TeamFormService,
    private readonly teamsResource: TeamsResource,
    private readonly teamInfoMetaParametersResource: TeamInfoMetaParametersResource,
  ) {
    this.data = null;

    this.cancelCreate = this.cancelCreate.bind(this);
    this.create = this.create.bind(this);

    makeObservable(this, {
      data: observable,
      disabled: observable,
    });
  }

  cancelCreate(): void {
    this.teamsAdministrationNavService.navToRoot();
  }

  fillData(): void {
    this.data = new TeamFormState(this.teamFormService, this.teamsResource, this.teamInfoMetaParametersResource);
  }

  create(): void {
    this.teamsAdministrationNavService.navToCreate();
  }
}
