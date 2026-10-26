/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ACTION_CREATE, ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION.js';
import { CreateUserService } from './CreateUserService.js';

@injectable(() => [AuthProvidersResource, CreateUserService, MenuService, ActionService, AdministrationUsersManagementService])
export class CreateUserBootstrap extends Bootstrap {
  constructor(
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly createUserService: CreateUserService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly administrationUsersManagementService: AdministrationUsersManagementService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      menus: [MENU_USERS_ADMINISTRATION],
      getItems(context, items) {
        return [...items, ACTION_CREATE];
      },
      orderItems(context, items) {
        items.push(...menuExtractItems(items, [ACTION_CREATE]));
        return items;
      },
    });

    this.actionService.addHandler({
      id: 'users-table-base',
      menus: [MENU_USERS_ADMINISTRATION],
      actions: [ACTION_CREATE],
      isHidden: () =>
        this.administrationUsersManagementService.externalUserProviderEnabled || !this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID),
      isDisabled: () => !!this.createUserService.formState,
      getLoader: () => [
        getCachedMapResourceLoaderState(this.authProvidersResource, () => CachedMapAllKey),
        ...this.administrationUsersManagementService.loaders,
      ],
      handler: () => this.createUserService.create(),
      getActionInfo: (context, action) => ({
        ...action.info,
        label: 'authentication_administration_create_user',
        icon: 'add',
        tooltip: 'authentication_administration_tools_add_tooltip',
      }),
    });
  }
}
