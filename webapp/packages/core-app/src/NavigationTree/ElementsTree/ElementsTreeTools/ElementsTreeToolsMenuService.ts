/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UserDataService } from '@cloudbeaver/core-authentication';
import { injectable } from '@cloudbeaver/core-di';
import { LocalizationService } from '@cloudbeaver/core-localization';
import { ActionService, ACTION_COLLAPSE_ALL, ACTION_FILTER, DATA_CONTEXT_MENU, IAction, IDataContextProvider, KeyBindingService, MenuService } from '@cloudbeaver/core-view';

import { NavNodeInfoResource } from '../../../shared/NodesManager/NavNodeInfoResource';
import { NavNodeManagerService } from '../../../shared/NodesManager/NavNodeManagerService';
import { NodeManagerUtils } from '../../../shared/NodesManager/NodeManagerUtils';
import { ConnectionSchemaManagerService } from '../../../TopNavBar/ConnectionSchemaManager/ConnectionSchemaManagerService';
import { getNavigationTreeUserSettingsId } from '../../getNavigationTreeUserSettingsId';
import { ACTION_LINK_OBJECT } from '../ACTION_LINK_OBJECT';
import { DATA_CONTEXT_ELEMENTS_TREE } from '../DATA_CONTEXT_ELEMENTS_TREE';
import { KEY_BINDING_COLLAPSE_ALL } from '../KEY_BINDING_COLLAPSE_ALL';
import { KEY_BINDING_LINK_OBJECT } from '../KEY_BINDING_LINK_OBJECT';
import { MENU_ELEMENTS_TREE_TOOLS } from './MENU_ELEMENTS_TREE_TOOLS';
import { createElementsTreeSettings, validateElementsTreeSettings } from './NavigationTreeSettings/createElementsTreeSettings';
import { DATA_CONTEXT_NAV_TREE_ROOT } from './NavigationTreeSettings/DATA_CONTEXT_NAV_TREE_ROOT';
import { KEY_BINDING_ENABLE_FILTER } from './NavigationTreeSettings/KEY_BINDING_ENABLE_FILTER';

@injectable()
export class ElementsTreeToolsMenuService {
  constructor(
    private readonly actionService: ActionService,
    private readonly keyBindingService: KeyBindingService,
    private readonly userDataService: UserDataService,
    private readonly connectionSchemaManagerService: ConnectionSchemaManagerService,
    private readonly menuService: MenuService,
    private readonly localizationService: LocalizationService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
    private readonly navNodeManagerService: NavNodeManagerService,
  ) {}

  register() {
    this.actionService.addHandler({
      id: 'tree-tools-menu-base-handler',
      isActionApplicable(context, action) {
        return [ACTION_LINK_OBJECT].includes(action);
      },
      getActionInfo: (context, action) => {
        if (action === ACTION_LINK_OBJECT) {
          const tooltip = this.localizationService.translate('app_navigationTree_action_link_with_editor') + ` (${KEY_BINDING_LINK_OBJECT.label})`;
          return {
            ...action.info,
            label: '',
            tooltip,
          };
        }

        return { ...action.info, label: '' };
      },
      isHidden: (context, action) => {
        const tree = context.get(DATA_CONTEXT_ELEMENTS_TREE);

        if (action === ACTION_LINK_OBJECT && tree) {
          const objectCatalog = this.connectionSchemaManagerService.currentObjectCatalog;
          const objectSchema = this.connectionSchemaManagerService.currentObjectSchema;
          const navNode = this.connectionSchemaManagerService.activeNavNode;

          const nodeId = navNode?.nodeId ?? objectSchema?.id ?? objectCatalog?.id;

          if (nodeId) {
            const parents = NodeManagerUtils.parentsFromPath(nodeId);
            const parent = this.navNodeManagerService.getNode(parents[0]);

            if (parent && parent.id !== parent.parentId) {
              parents.unshift(parent.parentId);
            }

            const nodeInTree = parents.includes(tree.baseRoot) && this.navNodeInfoResource.has(nodeId);
            return !nodeInTree;
          }
        }

        return true;
      },
      handler: async (context, action) => {
        switch (action) {
          case ACTION_LINK_OBJECT: {
            this.elementsTreeActionHandler(context, action);
            break;
          }
        }
      },
    });

    this.menuService.addCreator({
      isApplicable: context => context.get(DATA_CONTEXT_MENU) === MENU_ELEMENTS_TREE_TOOLS,
      getItems: (context, items) => [
        ...items,
        ACTION_LINK_OBJECT,
      ],
    });

    this.registerBindings();
  }

  private registerBindings() {
    this.actionService.addHandler({
      id: 'nav-tree-filter',
      isActionApplicable: (contexts, action) => (
        action === ACTION_FILTER
        && contexts.has(DATA_CONTEXT_NAV_TREE_ROOT)
      ),
      handler: this.switchFilter.bind(this),
    });

    this.actionService.addHandler({
      id: 'elements-tree-base',
      isActionApplicable: (contexts, action) => (
        contexts.has(DATA_CONTEXT_ELEMENTS_TREE)
        && [ACTION_COLLAPSE_ALL, ACTION_LINK_OBJECT].includes(action)
      ),
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'nav-tree-filter',
      binding: KEY_BINDING_ENABLE_FILTER,
      isBindingApplicable: (contexts, action) => action === ACTION_FILTER,
      handler: this.switchFilter.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'elements-tree-collapse',
      binding: KEY_BINDING_COLLAPSE_ALL,
      isBindingApplicable: (contexts, action) => action === ACTION_COLLAPSE_ALL,
      handler: this.elementsTreeActionHandler.bind(this),
    });

    this.keyBindingService.addKeyBindingHandler({
      id: 'elements-tree-link',
      binding: KEY_BINDING_LINK_OBJECT,
      isBindingApplicable: (contexts, action) => action === ACTION_LINK_OBJECT,
      handler: this.elementsTreeActionHandler.bind(this),
    });
  }

  private switchFilter(contexts: IDataContextProvider, action: IAction) {
    const context = contexts.get(DATA_CONTEXT_NAV_TREE_ROOT);

    if (context === undefined) {
      return;
    }

    const state = this.userDataService.getUserData(
      getNavigationTreeUserSettingsId(context),
      createElementsTreeSettings,
      validateElementsTreeSettings
    );

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
      case ACTION_LINK_OBJECT: {
        const objectCatalog = this.connectionSchemaManagerService.currentObjectCatalog;
        const objectSchema = this.connectionSchemaManagerService.currentObjectSchema;
        const navNode = this.connectionSchemaManagerService.activeNavNode;

        const nodeId = navNode?.nodeId ?? objectSchema?.id ?? objectCatalog?.id;

        if (nodeId) {
          const parents = NodeManagerUtils.parentsFromPath(nodeId);
          const parent = this.navNodeManagerService.getNode(parents[0]);

          if (parent && parent.id !== parent.parentId) {
            parents.unshift(parent.parentId);
          }

          if (parents.includes(tree.baseRoot) && this.navNodeInfoResource.has(nodeId)) {
            tree.show(nodeId, parents);
          }
        }
        break;
      }
    }
  }
}