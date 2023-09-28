/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { App, injectable } from '@cloudbeaver/core-di';

import { AdministrationUserFormService } from '../UserForm/AdministrationUserFormService';
import { AdministrationUserFormState } from '../UserForm/AdministrationUserFormState';
import { UsersAdministrationNavigationService } from '../UsersAdministrationNavigationService';

export interface IToolsContainerProps {
  param: string | null | undefined;
}

@injectable()
export class CreateUserService {
  state: AdministrationUserFormState | null;
  readonly toolsContainer: PlaceholderContainer<IToolsContainerProps>;

  constructor(
    private readonly app: App,
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

    this.state = new AdministrationUserFormState(this.app, this.administrationUserFormService, { userId: null });
    this.usersAdministrationNavigationService.navToCreate();
  }

  clearUserTemplate(): void {
    this.state = null;
  }

  close(): void {
    this.clearUserTemplate();
  }
}
