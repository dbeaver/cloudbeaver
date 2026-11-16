/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import React from 'react';

import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';

import { IDatabaseDataResultAction } from '../../DatabaseDataModel/Actions/IDatabaseDataResultAction.js';
import { DataPresentationService, DataPresentationType } from '../../DataPresentationService.js';
import { DataValuePanelService } from './DataValuePanelService.js';

export const ValuePanel = React.lazy(async () => {
  const { ValuePanel } = await import('./ValuePanel.js');
  return { default: ValuePanel };
});

export class DataValuePanelBootstrapImpl extends Bootstrap {
  constructor(
    private readonly dataPresentationService: DataPresentationService,
    private readonly dataValuePanelService: DataValuePanelService,
  ) {
    super();
  }

  override register(): void | Promise<void> {
    this.dataPresentationService.add({
      id: 'value-text-presentation',
      type: DataPresentationType.toolsPanel,
      title: 'data_viewer_presentation_value_title',
      icon: 'value-panel',
      hidden: (dataFormat, model, resultIndex) => {
        if (!model.source.hasResult(resultIndex)) {
          return true;
        }

        const data = model.source.tryGetAction(resultIndex, IDatabaseDataResultAction);

        return data?.empty || this.dataValuePanelService.getDisplayed({ model, resultIndex, dataFormat }).length === 0;
      },
      getPresentationComponent: () => ValuePanel,
    });
  }
}

export type DataValuePanelBootstrap = DataValuePanelBootstrapImpl;

export class DataValuePanelBootstrapDI extends Context.Service<DataValuePanelBootstrapDI, DataValuePanelBootstrapImpl>()(
  '@cloudbeaver/plugin-data-viewer/TableViewer/ValuePanel/DataValuePanelBootstrap#DataValuePanelBootstrap',
) {
  static readonly implementation = DataValuePanelBootstrapImpl;

  static readonly dependencies = () => [DataPresentationService, DataValuePanelService] as const;
  static readonly make: Effect.Effect<
    DataValuePanelBootstrapImpl,
    never,
    Context.Service.Identifier<typeof DataPresentationService> | Context.Service.Identifier<typeof DataValuePanelService>
  > = Effect.gen(function* makeDataValuePanelBootstrap() {
    const dataPresentationService = yield* DataPresentationService;
    const dataValuePanelService = yield* DataValuePanelService;

    return new DataValuePanelBootstrapImpl(dataPresentationService, dataValuePanelService);
  });
  static readonly layer: Layer.Layer<
    DataValuePanelBootstrapDI,
    never,
    Context.Service.Identifier<typeof DataPresentationService> | Context.Service.Identifier<typeof DataValuePanelService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataValuePanelBootstrap = DataValuePanelBootstrapDI;
