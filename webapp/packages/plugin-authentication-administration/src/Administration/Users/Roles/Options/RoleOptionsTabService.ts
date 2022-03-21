/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { RolesResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { getUniqueName } from '@cloudbeaver/core-utils';

import { roleContext } from '../Contexts/roleContext';
import type { IRoleFormFillConfigData, IRoleFormSubmitData } from '../IRoleFormProps';
import { RoleFormService } from '../RoleFormService';
import { RoleOptions } from './RoleOptions';

@injectable()
export class RoleOptionsTabService extends Bootstrap {
  constructor(
    private readonly roleFormService: RoleFormService,
    private readonly roleResource: RolesResource,
  ) {
    super();
  }

  register(): void {
    this.roleFormService.tabsContainer.add({
      key: 'options',
      name: 'ui_options',
      order: 1,
      panel: () => RoleOptions,
    });

    this.roleFormService.prepareConfigTask
      .addHandler(this.prepareConfig.bind(this));

    this.roleFormService.formValidationTask
      .addHandler(this.validate.bind(this));

    this.roleFormService.formSubmittingTask
      .addHandler(this.save.bind(this));

    this.roleFormService.fillConfigTask
      .addHandler(this.fillConfig.bind(this));
  }

  load(): void { }

  private async prepareConfig(
    {
      state,
    }: IRoleFormSubmitData,
    contexts: IExecutionContextProvider<IRoleFormSubmitData>
  ) {
    const config = contexts.getContext(roleContext);

    config.roleId = state.config.roleId;

    if (state.config.roleName) {
      config.roleName = state.config.roleName.trim();

      if (state.mode === 'create') {
        const roleNames = this.roleResource.values.map(role => role.roleName).filter(Boolean) as string[];
        config.roleName = getUniqueName(config.roleName, roleNames);
      }
    }

    if (state.config.description) {
      config.description = state.config.description;
    }
  }

  private async validate(
    {
      state,
    }: IRoleFormSubmitData,
    contexts: IExecutionContextProvider<IRoleFormSubmitData>
  ) {
    const validation = contexts.getContext(this.roleFormService.configurationValidationContext);

    if (state.mode === 'create') {
      if (!state.config.roleId.trim()) {
        validation.error("Field 'Role ID' can't be empty");
      }

      if (this.roleResource.has(state.config.roleId)) {
        validation.error(`A role with ID "${state.config.roleId}" already exists`);
      }
    }
  }

  private async save(
    {
      state,
    }: IRoleFormSubmitData,
    contexts: IExecutionContextProvider<IRoleFormSubmitData>
  ) {
    const status = contexts.getContext(this.roleFormService.configurationStatusContext);
    const config = contexts.getContext(roleContext);

    const create = state.mode === 'create';

    try {
      if (create) {
        const role = await this.roleResource.createRole(config);
        status.info('Role created');
        status.info(role.roleId);
      } else {
        const role = await this.roleResource.updateRole(config);
        status.info('Role updated');
        status.info(role.roleId);
      }
    } catch (exception: any) {
      if (create) {
        status.error('administration_roles_role_create_error', exception);
      } else {
        status.error('administration_roles_role_save_error', exception);
      }
    }
  }

  private fillConfig(
    { state, updated }: IRoleFormFillConfigData,
    contexts: IExecutionContextProvider<IRoleFormFillConfigData>
  ) {
    if (!updated) {
      return;
    }

    if (!state.info) {
      return;
    }

    if (state.info.roleId) {
      state.config.roleId = state.info.roleId;
    }
    if (state.info.roleName) {
      state.config.roleName = state.info.roleName;
    }
    if (state.info.description) {
      state.config.description = state.info.description;
    }
  }
}
