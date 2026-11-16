/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NavNodeInfoResource } from '@cloudbeaver/core-navigation-tree';
import { NavNodeViewService } from '@cloudbeaver/plugin-navigation-tree';

import { VirtualFolderUtils } from './VirtualFolderUtils.js';

const VirtualFolderTab = importLazyComponent(() => import('./VirtualFolderTab.js').then(m => m.VirtualFolderTab));
const VirtualFolderPanel = importLazyComponent(() => import('./VirtualFolderPanel.js').then(m => m.VirtualFolderPanel));

export class VirtualFolderViewBootstrapImpl extends Bootstrap {
  constructor(
    private readonly navNodeViewService: NavNodeViewService,
    private readonly navNodeInfoResource: NavNodeInfoResource,
  ) {
    super();
  }

  override register(): void {
    this.navNodeViewService.addTransform({
      order: 2,
      tab: (nodeId, folderId) => {
        if (VirtualFolderUtils.isVirtualFolder(folderId)) {
          return VirtualFolderTab;
        }

        return undefined;
      },
      panel: (nodeId, folderId) => {
        if (VirtualFolderUtils.isVirtualFolder(folderId)) {
          return VirtualFolderPanel;
        }

        return undefined;
      },
      transformer: (nodeId, children) => {
        if (!children) {
          return children;
        }

        const virtualFolders: string[] = [];
        const nextChildren: string[] = [];

        for (const child of children) {
          const node = this.navNodeInfoResource.get(child);

          if (!node || node.folder) {
            nextChildren.push(child);
          } else if (node.nodeType) {
            const virtualId = VirtualFolderUtils.getFolderId(node.nodeType);

            if (!virtualFolders.includes(virtualId)) {
              virtualFolders.push(virtualId);
            }
          }
        }

        nextChildren.push(...virtualFolders);

        return nextChildren;
      },
    });
  }
}

export type VirtualFolderViewBootstrap = VirtualFolderViewBootstrapImpl;

export class VirtualFolderViewBootstrapDI extends Context.Service<VirtualFolderViewBootstrapDI, VirtualFolderViewBootstrapImpl>()(
  '@cloudbeaver/plugin-object-viewer/ObjectPropertiesPage/NavNodeView/VirtualFolder/VirtualFolderViewBootstrap#VirtualFolderViewBootstrap',
) {
  static readonly implementation = VirtualFolderViewBootstrapImpl;

  static readonly dependencies = () => [NavNodeViewService, NavNodeInfoResource] as const;
  static readonly make: Effect.Effect<
    VirtualFolderViewBootstrapImpl,
    never,
    Context.Service.Identifier<typeof NavNodeViewService> | Context.Service.Identifier<typeof NavNodeInfoResource>
  > = Effect.gen(function* makeVirtualFolderViewBootstrap() {
    const navNodeViewService = yield* NavNodeViewService;
    const navNodeInfoResource = yield* NavNodeInfoResource;

    return new VirtualFolderViewBootstrapImpl(navNodeViewService, navNodeInfoResource);
  });
  static readonly layer: Layer.Layer<
    VirtualFolderViewBootstrapDI,
    never,
    Context.Service.Identifier<typeof NavNodeViewService> | Context.Service.Identifier<typeof NavNodeInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const VirtualFolderViewBootstrap = VirtualFolderViewBootstrapDI;
