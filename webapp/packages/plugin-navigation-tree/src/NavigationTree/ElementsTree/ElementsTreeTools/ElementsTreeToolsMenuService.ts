/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserConfigurationStorage, UserDataService } from '@cloudbeaver/core-authentication';
import type { IDataContextProvider } from '@cloudbeaver/core-data-context';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ACTION_COLLAPSE_ALL, ACTION_FILTER, ActionService, type IAction, KeyBindingService, MenuService } from '@cloudbeaver/core-view';

import { getNavigationTreeUserSettingsId } from '../../getNavigationTreeUserSettingsId.js';
import { DATA_CONTEXT_ELEMENTS_TREE } from '../DATA_CONTEXT_ELEMENTS_TREE.js';
import { KEY_BINDING_COLLAPSE_ALL } from '../KEY_BINDING_COLLAPSE_ALL.js';
import { MENU_ELEMENTS_TREE_TOOLS } from './MENU_ELEMENTS_TREE_TOOLS.js';
import { createElementsTreeSettings, validateElementsTreeSettings } from './NavigationTreeSettings/createElementsTreeSettings.js';
import { DATA_CONTEXT_NAV_TREE_ROOT } from './NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT.js';
import { KEY_BINDING_ENABLE_FILTER } from './NavigationTreeSettings/KEY_BINDING_ENABLE_FILTER.js';

export class ElementsTreeToolsMenuServiceImpl {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly userDataService: UserDataService,
    private readonly menuService: MenuService,
    private readonly userConfigurationStorage: UserConfigurationStorage,
  ) {}

  register() {
    this.actionService.addHandler({
      id: 'tree-tools-menu-base-handler',
      isActionApplicable(context, action): boolean {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE);

        if (!tree) {
          return false;
        }

        if (action === ACTION_COLLAPSE_ALL) {
          return tree.getExpanded().length > 0;
        }

        return false;
      },
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.menuService.addCreator({
      menus: [MENU_ELEMENTS_TREE_TOOLS],
      getItems: (context, items) => [...items, ACTION_COLLAPSE_ALL],
    });

    this.registerBindings();
  }

  private registerBindings() {
    this.actionService.addHandler({
      id: 'nav-tree-filter',
      actions: [ACTION_FILTER],
      contexts: [DATA_CONTEXT_NAV_TREE_ROOT],
      handler: this.switchFilter.bind(this),
    });

    this.actionService.addHandler({
      id: 'elements-tree-base',
      isActionApplicable: (contexts, action): boolean => {
        const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE);

        if (!tree) {
          return false;
        }

        if (action === ACTION_COLLAPSE_ALL) {
          return tree.getExpanded().length > 0;
        }

        return false;
      },
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'nav-tree-filter',
      binding: KEY_BINDING_ENABLE_FILTER,
      actions: [ACTION_FILTER],
      handler: this.switchFilter.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'elements-tree-collapse',
      binding: KEY_BINDING_COLLAPSE_ALL,
      actions: [ACTION_COLLAPSE_ALL],
      contexts: [DATA_CONTEXT_ELEMENTS_TREE],
      handler: this.elementsTreeActionHandler.bind(this),
    });
  }

  private switchFilter(contexts: IDataContextProvider, action: IAction) {
    const context = contexts.get(DATA_CONTEXT_NAV_TREE_ROOT);

    if (context === undefined) {
      return;
    }

    const state = this.userDataService
      .withStorage(this.userConfigurationStorage)
      .getUserData(getNavigationTreeUserSettingsId(context), createElementsTreeSettings, validateElementsTreeSettings);

    state.filter = !state.filter;
  }

  private elementsTreeActionHandler(contexts: IDataContextProvider, action: IAction) {
    const tree = contexts.get(DATA_CONTEXT_ELEMENTS_TREE);

    if (tree === undefined) {
      return;
    }

    switch (action) {
      case ACTION_COLLAPSE_ALL:
        tree.collapse();
        break;
    }
  }
}

export type ElementsTreeToolsMenuService = ElementsTreeToolsMenuServiceImpl;

export class ElementsTreeToolsMenuServiceDI extends Context.Service<ElementsTreeToolsMenuServiceDI, ElementsTreeToolsMenuServiceImpl>()(
  '@cloudbeaver/plugin-navigation-tree/NavigationTree/ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService#ElementsTreeToolsMenuService',
) {
  static readonly implementation = ElementsTreeToolsMenuServiceImpl;
  static readonly dependencies = () => [ActionService, KeyBindingService, UserDataService, MenuService, UserConfigurationStorage] as const;
  static readonly make: Effect.Effect<
    ElementsTreeToolsMenuServiceImpl,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof KeyBindingService>
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Effect.gen(function* makeElementsTreeToolsMenuService() {
    const actionService = yield* ActionService;
    const keyBindingService = yield* KeyBindingService;
    const userDataService = yield* UserDataService;
    const menuService = yield* MenuService;
    const userConfigurationStorage = yield* UserConfigurationStorage;

    return new ElementsTreeToolsMenuServiceImpl(actionService, keyBindingService, userDataService, menuService, userConfigurationStorage);
  });
  static readonly layer: Layer.Layer<
    ElementsTreeToolsMenuServiceDI,
    never,
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof KeyBindingService>
    | Context.Service.Identifier<typeof UserDataService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof UserConfigurationStorage>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ElementsTreeToolsMenuService = ElementsTreeToolsMenuServiceDI;
