/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable, IServiceProvider } from '@cloudbeaver/core-di';

import { AdministrationUserFormService } from '../UserForm/AdministrationUserFormService.js';
import { AdministrationUserFormState } from '../UserForm/AdministrationUserFormState.js';
import { UsersAdministrationNavigationService } from '../UsersAdministrationNavigationService.js';

export interface IToolsContainerProps {
  param: string | null | undefined;
}

@injectable()
export class CreateUserService {
  state: AdministrationUserFormState | null;
  readonly toolsContainer: PlaceholderContainer<IToolsContainerProps>;

  constructor(
    private readonly serviceProvider: IServiceProvider,
    private readonly administrationUserFormService: AdministrationUserFormService,
    private readonly usersAdministrationNavigationService: UsersAdministrationNavigationService,
  ) {
    this.toolsContainer = new PlaceholderContainer();
    this.state = null;

    makeObservable(this, {
      state: observable,
    });

    this.clearUserTemplate = this.clearUserTemplate.bind(this);
    this.cancelCreate = this.cancelCreate.bind(this);
    this.create = this.create.bind(this);
  }

  cancelCreate(): void {
    this.clearUserTemplate();
    this.usersAdministrationNavigationService.navToRoot();
  }

  create(): void {
    if (this.state) {
      return;
    }

    this.state = new AdministrationUserFormState(this.serviceProvider, this.administrationUserFormService, { userId: null });
    this.usersAdministrationNavigationService.navToCreate();
  }

  clearUserTemplate(): void {
    this.state?.dispose();
    this.state = null;
  }

  close(): void {
    this.clearUserTemplate();
  }
}
