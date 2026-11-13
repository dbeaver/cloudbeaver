/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';

import { ResultSetSelectAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetSelectAction.js';
import { ResultSetViewAction } from '../../DatabaseDataModel/Actions/ResultSet/ResultSetViewAction.js';
import { isResultSetDataSource } from '../../ResultSet/ResultSetDataSource.js';
import { DataValuePanelService } from '../../TableViewer/ValuePanel/DataValuePanelService.js';
import { isBooleanValuePresentationAvailable } from './isBooleanValuePresentationAvailable.js';

const BooleanValuePresentation = importLazyComponent(() => import('./BooleanValuePresentation.js').then(module => module.BooleanValuePresentation));

export class BooleanValuePresentationBootstrapImpl extends Bootstrap {
  constructor(private readonly dataValuePanelService: DataValuePanelService) {
    super();
  }

  override register(): void {
    this.dataValuePanelService.add({
      key: 'boolean-presentation',
      options: {
        dataFormat: [ResultDataFormat.Resultset],
      },
      name: 'boolean',
      order: 1,
      panel: () => BooleanValuePresentation,
      isHidden: (_, context) => {
        const source = context?.model.source as any;

        if (!context || !isResultSetDataSource(source) || !source?.hasResult(context.resultIndex)) {
          return true;
        }

        const selection = source.getAction(context.resultIndex, ResultSetSelectAction);

        const activeElements = selection.getActiveElements();

        if (activeElements.length > 0) {
          const view = source.getAction(context.resultIndex, ResultSetViewAction);
          const firstSelectedCell = activeElements[0]!;
          const cellHolder = view.getCellHolder(firstSelectedCell);
          const column = view.getColumn(firstSelectedCell.column);

          return cellHolder.value === undefined || column === undefined || !isBooleanValuePresentationAvailable(cellHolder.value, column);
        }

        return true;
      },
    });
  }
}

export type BooleanValuePresentationBootstrap = BooleanValuePresentationBootstrapImpl;

export class BooleanValuePresentationBootstrapDI extends Context.Service<
  BooleanValuePresentationBootstrapDI,
  BooleanValuePresentationBootstrapImpl
>()('@cloudbeaver/plugin-data-viewer/ValuePanelPresentation/BooleanValue/BooleanValuePresentationBootstrap#BooleanValuePresentationBootstrap') {
  static readonly implementation = BooleanValuePresentationBootstrapImpl;

  static readonly dependencies = () => [DataValuePanelService] as const;
  static readonly make: Effect.Effect<BooleanValuePresentationBootstrapImpl, never, Context.Service.Identifier<typeof DataValuePanelService>> =
    Effect.gen(function* makeBooleanValuePresentationBootstrap() {
      const dataValuePanelService = yield* DataValuePanelService;

      return new BooleanValuePresentationBootstrapImpl(dataValuePanelService);
    });
  static readonly layer: Layer.Layer<BooleanValuePresentationBootstrapDI, never, Context.Service.Identifier<typeof DataValuePanelService>> =
    Layer.effect(
      this,
      Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
    );
}

export const BooleanValuePresentationBootstrap = BooleanValuePresentationBootstrapDI;
