/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionInfoResource, EConnectionFeature } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { DATA_CONTEXT_NAV_NODES, ENodeFeature, type NavNode, NavTreeResource, NavTreeSettingsService } from '@cloudbeaver/core-navigation-tree';
import { ACTION_DELETE, ActionService, MenuService } from '@cloudbeaver/core-view';
import { NodeDeletionService } from '@cloudbeaver/plugin-navigation-tree';

import { MENU_OBJECT_VIEWER_FOOTER } from './MENU_OBJECT_VIEWER_FOOTER.js';

export class ObjectPropertyTableFooterServiceImpl {
  constructor(
    private readonly navTreeResource: NavTreeResource,
    private readonly nodeDeletionService: NodeDeletionService,
    private readonly navTreeSettingsService: NavTreeSettingsService,
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {}

  registerFooterActions() {
    this.menuService.addCreator({
      menus: [MENU_OBJECT_VIEWER_FOOTER],
      contexts: [DATA_CONTEXT_NAV_NODES],
      isApplicable: () => this.navTreeSettingsService.deleting,
      getItems: (_, items) => [...items, ACTION_DELETE],
    });

    this.actionService.addHandler({
      id: 'object-viewer-footer-base',
      menus: [MENU_OBJECT_VIEWER_FOOTER],
      contexts: [DATA_CONTEXT_NAV_NODES],
      actions: [ACTION_DELETE],
      getActionInfo: (_, action) => {
        if (action === ACTION_DELETE) {
          return {
            ...action.info,
            icon: 'delete',
          };
        }

        return action.info;
      },
      isDisabled: (context, action) => {
        if (action === ACTION_DELETE) {
          const selected = context.get(DATA_CONTEXT_NAV_NODES)!();
          return this.nodeDeletionService.isDeleting || this.navTreeResource.isLoading() || !selected.some(node => this.canDelete(node));
        }

        return true;
      },
      handler: async (context, action) => {
        if (action === ACTION_DELETE) {
          const selected = context.get(DATA_CONTEXT_NAV_NODES)!();
          await this.nodeDeletionService.delete(selected);
        }
      },
    });
  }

  private canDelete(node: NavNode): boolean {
    const connection = this.connectionInfoResource.getConnectionForNode(node.uri);

    return (
      !!node.features?.includes(ENodeFeature.canDelete) &&
      !connection?.features.includes(EConnectionFeature.readOnly) &&
      !connection?.features.includes(EConnectionFeature.restrictMetadataEdit)
    );
  }
}

export type ObjectPropertyTableFooterService = ObjectPropertyTableFooterServiceImpl;

export class ObjectPropertyTableFooterServiceDI extends Context.Service<ObjectPropertyTableFooterServiceDI, ObjectPropertyTableFooterServiceImpl>()(
  '@cloudbeaver/plugin-object-viewer/ObjectPropertiesPage/ObjectPropertyTable/ObjectPropertyTableFooterService#ObjectPropertyTableFooterService',
) {
  static readonly implementation = ObjectPropertyTableFooterServiceImpl;

  static readonly dependencies = () =>
    [NavTreeResource, NodeDeletionService, NavTreeSettingsService, MenuService, ActionService, ConnectionInfoResource] as const;
  static readonly make: Effect.Effect<
    ObjectPropertyTableFooterServiceImpl,
    never,
    | Context.Service.Identifier<typeof NavTreeResource>
    | Context.Service.Identifier<typeof NodeDeletionService>
    | Context.Service.Identifier<typeof NavTreeSettingsService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Effect.gen(function* makeObjectPropertyTableFooterService() {
    const navTreeResource = yield* NavTreeResource;
    const nodeDeletionService = yield* NodeDeletionService;
    const navTreeSettingsService = yield* NavTreeSettingsService;
    const menuService = yield* MenuService;
    const actionService = yield* ActionService;
    const connectionInfoResource = yield* ConnectionInfoResource;

    return new ObjectPropertyTableFooterServiceImpl(
      navTreeResource,
      nodeDeletionService,
      navTreeSettingsService,
      menuService,
      actionService,
      connectionInfoResource,
    );
  });
  static readonly layer: Layer.Layer<
    ObjectPropertyTableFooterServiceDI,
    never,
    | Context.Service.Identifier<typeof NavTreeResource>
    | Context.Service.Identifier<typeof NodeDeletionService>
    | Context.Service.Identifier<typeof NavTreeSettingsService>
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ObjectPropertyTableFooterService = ObjectPropertyTableFooterServiceDI;
