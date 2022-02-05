/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UserDataService } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { ActionService, ACTION_FILTER, IAction, IDataContextProvider, KeyBindingService } from '@cloudbeaver/core-view';

import { createNavigationTreeUserSettings, validateNavigationTreeUserSettings } from './NavigationTreeSettings/createNavigationTreeUserSettings';
import { DATA_CONTEXT_NAV_TREE_ROOT } from './NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT';
import { getNavigationTreeUserSettingsId } from './NavigationTreeSettings/getNavigationTreeUserSettingsId';
import { KEY_BINDING_ENABLE_FILTER } from './NavigationTreeSettings/KEY_BINDING_ENABLE_FILTER';


@injectable()
export class NavigationTreeBootstrap extends Bootstrap {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly userDataService: UserDataService
  ) {
    super();
  }

  register(): void | Promise<void> {
    this.actionService.addHandler({
      id: 'nav-tree-filter',
      isActionApplicable: (contexts, action) => (
        action === ACTION_FILTER
        && contexts.has(DATA_CONTEXT_NAV_TREE_ROOT)
      ),
      handler: this.switchFilter.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'nav-tree-filter',
      binding: KEY_BINDING_ENABLE_FILTER,
      isBindingApplicable: (contexts, action) => action === ACTION_FILTER,
      handler: this.switchFilter.bind(this),
    });
  }

  private switchFilter(contexts: IDataContextProvider, action: IAction) {
    const context = contexts.get(DATA_CONTEXT_NAV_TREE_ROOT);

    if (context === undefined) {
      return;
    }

    const state = this.userDataService.getUserData(
      getNavigationTreeUserSettingsId(context), 
      createNavigationTreeUserSettings, 
      validateNavigationTreeUserSettings
    );

    state.filter = !state.filter;
  }


  async load(): Promise<void> { }
}