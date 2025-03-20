/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { injectable, IServiceProvider } from '@cloudbeaver/core-di';

import { TeamsAdministrationNavService } from '../TeamsAdministrationNavService.js';
import { TeamsAdministrationFormService } from '../TeamsForm/TeamsAdministrationFormService.js';
import { TeamsAdministrationFormState } from '../TeamsForm/TeamsAdministrationFormState.js';

@injectable()
export class CreateTeamService {
  disabled = false;
  data: TeamsAdministrationFormState | null;

  constructor(
    private readonly teamsAdministrationNavService: TeamsAdministrationNavService,
    private readonly serviceProvider: IServiceProvider,
    private readonly service: TeamsAdministrationFormService,
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
    this.dispose();
    this.data = new TeamsAdministrationFormState(this.serviceProvider, this.service, {
      teamId: null,
    });
  }

  create(): void {
    this.teamsAdministrationNavService.navToCreate();
  }

  dispose() {
    this.data?.dispose();
    this.data = null;
  }
}
