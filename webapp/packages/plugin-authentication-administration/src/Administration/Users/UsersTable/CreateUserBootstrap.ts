/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { DATA_CONTEXT_ADMINISTRATION_ITEM_ROUTE } from '@cloudbeaver/core-administration';
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ACTION_CREATE, ActionService, MenuService } from '@cloudbeaver/core-view';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION.js';
import { ADMINISTRATION_ITEM_USER_CREATE_PARAM } from '../ADMINISTRATION_ITEM_USER_CREATE_PARAM.js';
import { CreateUserService } from './CreateUserService.js';

@injectable()
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

  override register() {
    this.menuService.addCreator({
      menus: [MENU_USERS_ADMINISTRATION],
      getItems(context, items) {
        return [...items, ACTION_CREATE];
      },
    });

    this.actionService.addHandler({
      id: 'users-table-base',
      menus: [MENU_USERS_ADMINISTRATION],
      actions: [ACTION_CREATE],
      isHidden: (context, action) => {
        if (action === ACTION_CREATE) {
          return this.administrationUsersManagementService.externalUserProviderEnabled || !this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID);
        }

        return false;
      },
      isDisabled: (context, action) => {
        if (action === ACTION_CREATE) {
          const administrationItemRoute = context.get(DATA_CONTEXT_ADMINISTRATION_ITEM_ROUTE);

          return administrationItemRoute?.param === ADMINISTRATION_ITEM_USER_CREATE_PARAM && !!this.createUserService.state;
        }

        return false;
      },
      getLoader: () => [
        getCachedMapResourceLoaderState(this.authProvidersResource, () => CachedMapAllKey),
        ...this.administrationUsersManagementService.loaders,
      ],
      handler: (context, action) => {
        switch (action) {
          case ACTION_CREATE:
            this.createUserService.create();
            break;
        }
      },
      getActionInfo: (context, action) => {
        if (action === ACTION_CREATE) {
          return {
            ...action.info,
            icon: 'add',
            tooltip: 'authentication_administration_tools_add_tooltip',
          };
        }

        return action.info;
      },
    });
  }
}
