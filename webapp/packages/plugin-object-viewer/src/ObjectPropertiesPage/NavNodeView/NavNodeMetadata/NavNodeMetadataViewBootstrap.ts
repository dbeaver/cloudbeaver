/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ENodeFeature, NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { importLazyComponent } from '@cloudbeaver/core-blocks';

const NavNodeMetadataPanel = importLazyComponent(() => import('./NavNodeMetadataPanel.js').then(m => m.NavNodeMetadataPanel));
const NavNodeMetadataTab = importLazyComponent(() => import('./NavNodeMetadataTab.js').then(m => m.NavNodeMetadataTab));

const navNodeMetadataId = 'object-viewer://metadata';

export class NavNodeMetadataViewBootstrapImpl extends Bootstrap {
  constructor(
    private readonly navNodeViewService: NavNodeViewService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
  ) {
    super();
  }

  override register(): void {
    this.navNodeViewService.addTransform({
      order: 1,
      tab: (nodeId, folderId) => {
        if (folderId.startsWith(navNodeMetadataId)) {
          return NavNodeMetadataTab;
        }

        return undefined;
      },
      panel: (nodeId, folderId) => {
        if (folderId.startsWith(navNodeMetadataId)) {
          return NavNodeMetadataPanel;
        }

        return undefined;
      },
      transformer: (nodeId, children) => {
        const node = this.navNodeInfoResource.get(nodeId);
        const isDatabaseObject = node?.features?.includes(ENodeFeature.item) || node?.features?.includes(ENodeFeature.container);

        if (!isDatabaseObject) {
          return children;
        }

        return [navNodeMetadataId, ...(children || [])];
      },
    });
  }
}

export type NavNodeMetadataViewBootstrap = NavNodeMetadataViewBootstrapImpl;

export class NavNodeMetadataViewBootstrapDI extends Context.Service<NavNodeMetadataViewBootstrapDI, NavNodeMetadataViewBootstrapImpl>()(
  '@cloudbeaver/plugin-object-viewer/ObjectPropertiesPage/NavNodeView/NavNodeMetadata/NavNodeMetadataViewBootstrap#NavNodeMetadataViewBootstrap',
) {
  static readonly implementation = NavNodeMetadataViewBootstrapImpl;

  static readonly dependencies = () => [NavNodeViewService, NavNodeInfoResource] as const;
  static readonly make: Effect.Effect<
    NavNodeMetadataViewBootstrapImpl,
    never,
    Context.Service.Identifier<typeof NavNodeViewService> | Context.Service.Identifier<typeof NavNodeInfoResource>
  > = Effect.gen(function* makeNavNodeMetadataViewBootstrap() {
    const navNodeViewService = yield* NavNodeViewService;
    const navNodeInfoResource = yield* NavNodeInfoResource;

    return new NavNodeMetadataViewBootstrapImpl(navNodeViewService, navNodeInfoResource);
  });
  static readonly layer: Layer.Layer<
    NavNodeMetadataViewBootstrapDI,
    never,
    Context.Service.Identifier<typeof NavNodeViewService> | Context.Service.Identifier<typeof NavNodeInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const NavNodeMetadataViewBootstrap = NavNodeMetadataViewBootstrapDI;
