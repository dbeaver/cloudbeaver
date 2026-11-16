/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ACTION_REDO, ACTION_SAVE, ACTION_UNDO, type IActiveView, View } from '@cloudbeaver/core-view';
import { type ITab, NavigationTabsService } from '@cloudbeaver/plugin-navigation-tabs';

export class DataViewerViewServiceImpl extends View<ITab> {
  constructor(private readonly navigationTabsService: NavigationTabsService) {
    super();
    this.registerAction(ACTION_UNDO, ACTION_REDO, ACTION_SAVE);
  }

  getView(): IActiveView<ITab> | null {
    return this.navigationTabsService.getView();
  }
}

export type DataViewerViewService = DataViewerViewServiceImpl;

export class DataViewerViewServiceDI extends Context.Service<DataViewerViewServiceDI, DataViewerViewServiceImpl>()(
  '@cloudbeaver/plugin-data-viewer/TableViewer/DataViewerViewService#DataViewerViewService',
) {
  static readonly implementation = DataViewerViewServiceImpl;

  static readonly dependencies = () => [NavigationTabsService] as const;
  static readonly make: Effect.Effect<DataViewerViewServiceImpl, never, Context.Service.Identifier<typeof NavigationTabsService>> = Effect.gen(
    function* makeDataViewerViewService() {
      const navigationTabsService = yield* NavigationTabsService;

      return new DataViewerViewServiceImpl(navigationTabsService);
    },
  );
  static readonly layer: Layer.Layer<DataViewerViewServiceDI, never, Context.Service.Identifier<typeof NavigationTabsService>> = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataViewerViewService = DataViewerViewServiceDI;
