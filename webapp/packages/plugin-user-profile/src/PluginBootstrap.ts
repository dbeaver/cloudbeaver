/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_MENU, DATA_CONTEXT_MENU_NESTED, MenuBaseItem, MenuService } from '@cloudbeaver/core-view';
import { MENU_USER_PROFILE } from '@cloudbeaver/plugin-authentication';

import { UserProfileService } from './UserProfileService';

@injectable()
export class PluginBootstrap extends Bootstrap {
  constructor(
    private menuService: MenuService,
    private userProfileService: UserProfileService
  ) {
    super();
  }

  register(): void {
    this.menuService.addCreator({
      isApplicable:
        context => context.get(DATA_CONTEXT_MENU) === MENU_USER_PROFILE
        && !context.get(DATA_CONTEXT_MENU_NESTED),
      getItems: (context, items) => [
        new MenuBaseItem('profile', 'plugin_user_profile_menu', undefined, {
          onSelect: () => this.userProfileService.open(),
        }),
        ...items,
      ],
    });
  }

  load(): void {}
}
