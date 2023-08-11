/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { makeObservable, observable } from 'mobx';

import { UsersResource } from '@cloudbeaver/core-authentication';
import { PlaceholderContainer } from '@cloudbeaver/core-blocks';
import { injectable } from '@cloudbeaver/core-di';
import type { AdminUserInfo } from '@cloudbeaver/core-sdk';

import { UsersAdministrationNavigationService } from '../UsersAdministrationNavigationService';

export interface IToolsContainerProps {
  param: string | null | undefined;
}

@injectable()
export class CreateUserService {
  user: AdminUserInfo | null;
  readonly toolsContainer: PlaceholderContainer<IToolsContainerProps>;

  constructor(
    private readonly usersAdministrationNavigationService: UsersAdministrationNavigationService,
    private readonly usersResource: UsersResource,
  ) {
    this.toolsContainer = new PlaceholderContainer();
    this.user = null;

    makeObservable(this, {
      user: observable,
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
    if (this.user) {
      return;
    }

    this.user = this.usersResource.getEmptyUser();
    this.usersAdministrationNavigationService.navToCreate();
  }

  clearUserTemplate(): void {
    this.user = null;
  }

  close(): void {
    this.clearUserTemplate();
  }
}
