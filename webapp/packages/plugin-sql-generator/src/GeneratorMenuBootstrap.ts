/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { ResultDataFormat } from '@cloudbeaver/core-sdk';
import { ActionService, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION,
  DATA_VIEWER_DATA_MODEL_ACTIONS_MENU,
  DatabaseDataFeature,
  DataViewerPresentationType,
  IDatabaseDataEditAction,
  type IDatabaseDataModel,
  isResultSetDataSource,
  ResultSetDataSource,
} from '@cloudbeaver/plugin-data-viewer';

import { ACTION_SQL_GENERATE } from './actions/ACTION_SQL_GENERATE.js';
import { ScriptPreviewService } from './ScriptPreview/ScriptPreviewService.js';

export class GeneratorMenuBootstrapImpl extends Bootstrap {
  constructor(
    private readonly scriptPreviewService: ScriptPreviewService,
    private readonly actionService: ActionService,
    private readonly menuService: MenuService,
  ) {
    super();
  }

  override register(): void {
    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;
        const presentation = context.get(DATA_CONTEXT_DV_PRESENTATION);
        const allowedFeatures = [DatabaseDataFeature.DataEditor, DatabaseDataFeature.QueryResult];

        return (
          allowedFeatures.some(feature => model.source.hasFeature(feature)) &&
          !model.isReadonly(resultIndex) &&
          model.source.getResult(resultIndex)?.dataFormat === ResultDataFormat.Resultset &&
          !presentation?.readonly &&
          (!presentation || presentation.type === DataViewerPresentationType.Data)
        );
      },
      getItems(context, items) {
        return [...items, ACTION_SQL_GENERATE];
      },
    });

    this.actionService.addHandler({
      id: 'data-sql-tools-handler',
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      actions: [ACTION_SQL_GENERATE],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isActionApplicable(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        return isResultSetDataSource(model.source);
      },
      isDisabled(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (model.isLoading() || model.isDisabled(resultIndex) || !model.source.hasResult(resultIndex)) {
          return true;
        }

        const editor = model.source.tryGetAction(resultIndex, IDatabaseDataEditAction);

        return !editor?.isEdited();
      },
      handler: context => {
        this.scriptPreviewService.open(
          context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>,
          context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!,
        );
      },
    });
  }
}

export type GeneratorMenuBootstrap = GeneratorMenuBootstrapImpl;

export class GeneratorMenuBootstrapDI extends Context.Service<GeneratorMenuBootstrapDI, GeneratorMenuBootstrapImpl>()(
  '@cloudbeaver/plugin-sql-generator/GeneratorMenuBootstrap#GeneratorMenuBootstrap',
) {
  static readonly implementation = GeneratorMenuBootstrapImpl;

  static readonly dependencies = () => [ScriptPreviewService, ActionService, MenuService] as const;
  static readonly make: Effect.Effect<
    GeneratorMenuBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof ScriptPreviewService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
  > = Effect.gen(function* makeGeneratorMenuBootstrap() {
    const scriptPreviewService = yield* ScriptPreviewService;
    const actionService = yield* ActionService;
    const menuService = yield* MenuService;

    return new GeneratorMenuBootstrapImpl(scriptPreviewService, actionService, menuService);
  });
  static readonly layer: Layer.Layer<
    GeneratorMenuBootstrapDI,
    never,
    | Context.Service.Identifier<typeof ScriptPreviewService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof MenuService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const GeneratorMenuBootstrap = GeneratorMenuBootstrapDI;
