/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { observable, makeObservable } from 'mobx';

import { RolesResource } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';

import type { IRoleFormState } from './IRoleFormProps';
import { RoleFormService } from './RoleFormService';
import { RoleFormState } from './RoleFormState';
import { RolesAdministrationNavService } from './RolesAdministrationNavService';

@injectable()
export class CreateRoleService {
  disabled = false;
  data: IRoleFormState | null;

  constructor(
    private readonly rolesAdministrationNavService: RolesAdministrationNavService,
    private readonly roleFormService: RoleFormService,
    private readonly rolesResource: RolesResource
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
    this.rolesAdministrationNavService.navToRoot();
  }

  fillData(): void {
    this.data = new RoleFormState(
      this.roleFormService,
      this.rolesResource
    );
  }

  create(): void {
    this.rolesAdministrationNavService.navToCreate();
  }
}
