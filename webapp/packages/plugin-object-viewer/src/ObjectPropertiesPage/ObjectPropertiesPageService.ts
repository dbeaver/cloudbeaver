/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { NotificationService } from '@cloudbeaver/core-events';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';
import { type INodeNavigationData, NavNodeManagerService } from '@cloudbeaver/core-navigation-tree';

import { DBObjectPageService } from '../ObjectPage/DBObjectPageService.js';
import type { ObjectPage } from '../ObjectPage/ObjectPage.js';
import { ObjectViewerTabService } from '../ObjectViewerTabService.js';

const ObjectPropertiesPagePanel = importLazyComponent(() => import('./ObjectPropertiesPagePanel.js').then(m => m.ObjectPropertiesPagePanel));
const ObjectPropertiesPageTab = importLazyComponent(() => import('./ObjectPropertiesPageTab.js').then(m => m.ObjectPropertiesPageTab));

export class ObjectPropertiesPageServiceImpl {
  page?: ObjectPage;

  constructor(
    private readonly navNodeManagerService: NavNodeManagerService,
    private readonly notificationService: NotificationService,
    private readonly objectViewerTabService: ObjectViewerTabService,
    private readonly dbObjectPageService: DBObjectPageService,
  ) {}

  registerDBObjectPage(): void {
    this.page = this.dbObjectPageService.register({
      key: 'properties',
      priority: 1,
      order: 1,
      getTabComponent: () => ObjectPropertiesPageTab,
      getPanelComponent: () => ObjectPropertiesPagePanel,
    });

    this.navNodeManagerService.navigator.addHandler(this.navigationHandler.bind(this));
  }

  private async navigationHandler(data: INodeNavigationData, contexts: IExecutionContextProvider<INodeNavigationData>) {
    if (!this.page) {
      // TODO: it will be never true, because navHandler registers after page creation
      return;
    }

    try {
      const tabContext = contexts.getContext(this.objectViewerTabService.objectViewerTabContext);

      await tabContext.initTab();
      tabContext.trySwitchPage(this.page);
    } catch (exception: any) {
      this.notificationService.logException(exception, 'Object Viewer Error', 'Error in Object Viewer while processing action with database node');
    }
  }
}

export type ObjectPropertiesPageService = ObjectPropertiesPageServiceImpl;

export class ObjectPropertiesPageServiceDI extends Context.Service<ObjectPropertiesPageServiceDI, ObjectPropertiesPageServiceImpl>()(
  '@cloudbeaver/plugin-object-viewer/ObjectPropertiesPage/ObjectPropertiesPageService#ObjectPropertiesPageService',
) {
  static readonly implementation = ObjectPropertiesPageServiceImpl;

  static readonly dependencies = () => [NavNodeManagerService, NotificationService, ObjectViewerTabService, DBObjectPageService] as const;
  static readonly make: Effect.Effect<
    ObjectPropertiesPageServiceImpl,
    never,
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ObjectViewerTabService>
    | Context.Service.Identifier<typeof DBObjectPageService>
  > = Effect.gen(function* makeObjectPropertiesPageService() {
    const navNodeManagerService = yield* NavNodeManagerService;
    const notificationService = yield* NotificationService;
    const objectViewerTabService = yield* ObjectViewerTabService;
    const dbObjectPageService = yield* DBObjectPageService;

    return new ObjectPropertiesPageServiceImpl(navNodeManagerService, notificationService, objectViewerTabService, dbObjectPageService);
  });
  static readonly layer: Layer.Layer<
    ObjectPropertiesPageServiceDI,
    never,
    | Context.Service.Identifier<typeof NavNodeManagerService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof ObjectViewerTabService>
    | Context.Service.Identifier<typeof DBObjectPageService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ObjectPropertiesPageService = ObjectPropertiesPageServiceDI;
