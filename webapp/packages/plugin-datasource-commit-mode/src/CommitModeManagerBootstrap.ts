/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import { MENU_APP_ACTIONS } from '@cloudbeaver/plugin-top-app-bar';

import { ACTION_COMMIT } from './actions/ACTION_COMMIT';
import { ACTION_COMMIT_MODE_TOGGLE } from './actions/ACTION_COMMIT_MODE_TOGGLE';
import { ACTION_ROLLBACK } from './actions/ACTION_ROLLBACK';

@injectable()
export class CommitModeManagerBootstrap extends Bootstrap {
  constructor(private readonly menuService: MenuService, private readonly actionService: ActionService) {
    super();
  }

  register() {
    this.menuService.addCreator({
      menus: [MENU_APP_ACTIONS],
      getItems: (context, items) => [...items, ACTION_COMMIT, ACTION_ROLLBACK, ACTION_COMMIT_MODE_TOGGLE],
    });

    this.actionService.addHandler({
      id: 'commit-mode-base',
      isActionApplicable: (context, action) => [ACTION_COMMIT, ACTION_ROLLBACK, ACTION_COMMIT_MODE_TOGGLE].includes(action),
      isLabelVisible: (context, action) => action === ACTION_COMMIT || action === ACTION_ROLLBACK,
      isHidden: (context, action) => false,
      handler: (context, action) => {},
    });
  }

  load() {}
}
