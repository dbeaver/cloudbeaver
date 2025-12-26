/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { AdministrationScreenService } from '@cloudbeaver/core-administration';
import { AUTH_PROVIDER_LOCAL_ID, AuthProvidersResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CachedMapAllKey, getCachedMapResourceLoaderState } from '@cloudbeaver/core-resource';
import { ACTION_CREATE, ACTION_REFRESH, ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';

import { AdministrationUsersManagementService } from '../../../AdministrationUsersManagementService.js';
import { MENU_USERS_ADMINISTRATION } from '../../../Menus/MENU_USERS_ADMINISTRATION.js';
import { ADMINISTRATION_ITEM_USER_CREATE_PARAM } from '../ADMINISTRATION_ITEM_USER_CREATE_PARAM.js';
import { CreateUserService } from './CreateUserService.js';
import { DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS } from './DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS.js';

@injectable(() => [
  AuthProvidersResource,
  CreateUserService,
  MenuService,
  ActionService,
  AdministrationUsersManagementService,
  AdministrationScreenService,
])
export class CreateUserBootstrap extends Bootstrap {
  constructor(
    private readonly authProvidersResource: AuthProvidersResource,
    private readonly createUserService: CreateUserService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly administrationUsersManagementService: AdministrationUsersManagementService,
    private readonly administrationScreenService: AdministrationScreenService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      menus: [MENU_USERS_ADMINISTRATION],
      getItems(context, items) {
        return [...items, ACTION_CREATE, ACTION_REFRESH];
      },
      orderItems(context, items) {
        items.push(...menuExtractItems(items, [ACTION_REFRESH]));
        return items;
      },
    });

    this.actionService.addHandler({
      id: 'users-table-base',
      menus: [MENU_USERS_ADMINISTRATION],
      actions: [ACTION_CREATE, ACTION_REFRESH],
      isHidden: (context, action) => {
        if (action === ACTION_CREATE) {
          return this.administrationUsersManagementService.externalUserProviderEnabled || !this.authProvidersResource.has(AUTH_PROVIDER_LOCAL_ID);
        }

        return false;
      },
      isDisabled: (context, action) => {
        if (action === ACTION_CREATE) {
          return this.administrationScreenService.activeScreen?.param === ADMINISTRATION_ITEM_USER_CREATE_PARAM && !!this.createUserService.state;
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
          case ACTION_REFRESH:
            context.get(DATA_CONTEXT_USERS_ADMINISTRATION_ACTIONS)?.onRefresh();
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

        if (action === ACTION_REFRESH) {
          return {
            ...action.info,
            label: 'ui_refresh',
            icon: 'refresh',
            tooltip: 'authentication_administration_tools_refresh_tooltip',
          };
        }

        return action.info;
      },
    });
  }
}
