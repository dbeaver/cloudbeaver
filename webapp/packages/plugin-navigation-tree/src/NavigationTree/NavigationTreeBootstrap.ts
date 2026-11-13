/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { LeftBarPanelService } from '@cloudbeaver/core-ui';

import { NavigationTreeSettingsService } from '../NavigationTreeSettingsService.js';
import { TreeSettingsMenuService } from '../TreeNew/TreeSettingsMenuService.js';
import { TreeToolbarMenuService } from '../TreeNew/TreeToolbarMenuService.js';
import { ElementsTreeToolsMenuService } from './ElementsTree/ElementsTreeTools/ElementsTreeToolsMenuService.js';

const NavigationTreePanel = importLazyComponent(() => import('./NavigationTreePanel.js').then(m => m.NavigationTreePanel));

export class NavigationTreeBootstrapImpl extends Bootstrap {
  constructor(
    private readonly navigationTreeSettingsService: NavigationTreeSettingsService,
    private readonly elementsTreeToolsMenuService: ElementsTreeToolsMenuService,
    private readonly treeToolbarMenuService: TreeToolbarMenuService,
    private readonly treeSettingsMenuService: TreeSettingsMenuService,
    private readonly leftBarPanelService: LeftBarPanelService,
  ) {
    super();
  }

  override register(): void {
    this.elementsTreeToolsMenuService.register();
    this.treeToolbarMenuService.register();
    this.treeSettingsMenuService.register();
    this.leftBarPanelService.tabsContainer.add({
      key: 'navigation-tree-tab',
      order: 0,
      name: 'plugin_navigation_tree_explorer_tab_title',
      isHidden: () => this.navigationTreeSettingsService.disabled,
      panel: () => NavigationTreePanel,
    });
  }
}

export type NavigationTreeBootstrap = NavigationTreeBootstrapImpl;

export class NavigationTreeBootstrapDI extends Context.Service<NavigationTreeBootstrapDI, NavigationTreeBootstrapImpl>()(
  '@cloudbeaver/plugin-navigation-tree/NavigationTree/NavigationTreeBootstrap#NavigationTreeBootstrap',
) {
  static readonly implementation = NavigationTreeBootstrapImpl;

  static readonly dependencies = () =>
    [NavigationTreeSettingsService, ElementsTreeToolsMenuService, TreeToolbarMenuService, TreeSettingsMenuService, LeftBarPanelService] as const;
  static readonly make: Effect.Effect<
    NavigationTreeBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof NavigationTreeSettingsService>
    | Context.Service.Identifier<typeof ElementsTreeToolsMenuService>
    | Context.Service.Identifier<typeof TreeToolbarMenuService>
    | Context.Service.Identifier<typeof TreeSettingsMenuService>
    | Context.Service.Identifier<typeof LeftBarPanelService>
  > = Effect.gen(function* makeNavigationTreeBootstrap() {
    const navigationTreeSettingsService = yield* NavigationTreeSettingsService;
    const elementsTreeToolsMenuService = yield* ElementsTreeToolsMenuService;
    const treeToolbarMenuService = yield* TreeToolbarMenuService;
    const treeSettingsMenuService = yield* TreeSettingsMenuService;
    const leftBarPanelService = yield* LeftBarPanelService;

    return new NavigationTreeBootstrapImpl(
      navigationTreeSettingsService,
      elementsTreeToolsMenuService,
      treeToolbarMenuService,
      treeSettingsMenuService,
      leftBarPanelService,
    );
  });
  static readonly layer: Layer.Layer<
    NavigationTreeBootstrapDI,
    never,
    | Context.Service.Identifier<typeof NavigationTreeSettingsService>
    | Context.Service.Identifier<typeof ElementsTreeToolsMenuService>
    | Context.Service.Identifier<typeof TreeToolbarMenuService>
    | Context.Service.Identifier<typeof TreeSettingsMenuService>
    | Context.Service.Identifier<typeof LeftBarPanelService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NavigationTreeBootstrap = NavigationTreeBootstrapDI;
