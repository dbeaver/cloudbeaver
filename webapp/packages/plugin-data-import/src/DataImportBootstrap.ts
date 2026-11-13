/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConnectionInfoResource, createConnectionParam, EConnectionFeature } from '@cloudbeaver/core-connections';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ACTION_IMPORT, ActionService, menuExtractItems, MenuService } from '@cloudbeaver/core-view';
import {
  DATA_CONTEXT_DV_DDM,
  DATA_CONTEXT_DV_DDM_RESULT_INDEX,
  DATA_CONTEXT_DV_PRESENTATION,
  DATA_VIEWER_DATA_MODEL_ACTIONS_MENU,
  DatabaseDataFeature,
  DataViewerPresentationType,
  isResultSetDataModel,
  ResultSetDataSource,
  type IDatabaseDataModel,
} from '@cloudbeaver/plugin-data-viewer';

import { DataImportDialogLazy } from './DataImportDialog/DataImportDialogLazy.js';
import { DataImportService } from './DataImportService.js';

export class DataImportBootstrapImpl extends Bootstrap {
  constructor(
    private readonly menuService: MenuService,
    private readonly actionService: ActionService,
    private readonly commonDialogService: CommonDialogService,
    private readonly dataImportService: DataImportService,
    private readonly connectionInfoResource: ConnectionInfoResource,
  ) {
    super();
  }

  override register() {
    this.actionService.addHandler({
      id: 'data-import-base-handler',
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      actions: [ACTION_IMPORT],
      isActionApplicable: context => isResultSetDataModel(context.get(DATA_CONTEXT_DV_DDM)),
      isDisabled(context) {
        const model = context.get(DATA_CONTEXT_DV_DDM)!;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        return model.isLoading() || model.isDisabled(resultIndex) || !model.source.getResult(resultIndex);
      },
      getActionInfo(_, action) {
        if (action === ACTION_IMPORT) {
          return { ...action.info, icon: '/icons/data-import.svg' };
        }

        return action.info;
      },
      handler: async (context, action) => {
        const model = context.get(DATA_CONTEXT_DV_DDM)! as any;
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        if (!isResultSetDataModel(model)) {
          throw new Error('Execution context is not provided');
        }

        if (action === ACTION_IMPORT) {
          const result = model.source.getResult(resultIndex);

          if (!result?.id) {
            throw new Error('Result must be provided');
          }

          const executionContext = model.source.executionContext?.context;

          if (!executionContext) {
            throw new Error('Execution context must be provided');
          }

          const connectionKey = createConnectionParam(executionContext.projectId, executionContext.connectionId);
          const { status, result: dialogResult } = await this.commonDialogService.open(DataImportDialogLazy, {
            tableName: model.name ?? model.id,
            connectionKey,
          });

          if (status === DialogueStateResult.Resolved && dialogResult) {
            const success = await this.dataImportService.importData(
              connectionKey,
              executionContext.id,
              result.id,
              dialogResult.processorId,
              dialogResult.file,
              dialogResult.settings,
              dialogResult.processorProperties,
            );

            if (success) {
              await model.refresh();
            }
          }
        }
      },
    });

    this.menuService.addCreator({
      menus: [DATA_VIEWER_DATA_MODEL_ACTIONS_MENU],
      contexts: [DATA_CONTEXT_DV_DDM, DATA_CONTEXT_DV_DDM_RESULT_INDEX],
      isApplicable: context => {
        const model = context.get(DATA_CONTEXT_DV_DDM)! as unknown as IDatabaseDataModel<ResultSetDataSource>;
        const presentation = context.get(DATA_CONTEXT_DV_PRESENTATION);
        const resultIndex = context.get(DATA_CONTEXT_DV_DDM_RESULT_INDEX)!;

        const executionContext = model.source.executionContext?.context;

        if (executionContext) {
          const connectionKey = createConnectionParam(executionContext.projectId, executionContext.connectionId);
          const connection = this.connectionInfoResource.get(connectionKey);

          if (connection?.features.includes(EConnectionFeature.restrictDataImport)) {
            return false;
          }
        }

        const allowedFeatures = [DatabaseDataFeature.DataEditor];

        return (
          allowedFeatures.some(feature => model.source.hasFeature(feature)) &&
          !model.isReadonly(resultIndex) &&
          !this.dataImportService.disabled &&
          !presentation?.readonly &&
          (!presentation || presentation.type === DataViewerPresentationType.Data)
        );
      },
      getItems(_, items) {
        return [...items, ACTION_IMPORT];
      },
      orderItems(_, items) {
        const extracted = menuExtractItems(items, [ACTION_IMPORT]);
        return [...items, ...extracted];
      },
    });
  }
}

export type DataImportBootstrap = DataImportBootstrapImpl;

export class DataImportBootstrapDI extends Context.Service<DataImportBootstrapDI, DataImportBootstrapImpl>()(
  '@cloudbeaver/plugin-data-import/DataImportBootstrap#DataImportBootstrap',
) {
  static readonly implementation = DataImportBootstrapImpl;

  static readonly dependencies = () => [MenuService, ActionService, CommonDialogService, DataImportService, ConnectionInfoResource] as const;
  static readonly make: Effect.Effect<
    DataImportBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof DataImportService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Effect.gen(function* makeDataImportBootstrap() {
    const menuService = yield* MenuService;
    const actionService = yield* ActionService;
    const commonDialogService = yield* CommonDialogService;
    const dataImportService = yield* DataImportService;
    const connectionInfoResource = yield* ConnectionInfoResource;

    return new DataImportBootstrapImpl(menuService, actionService, commonDialogService, dataImportService, connectionInfoResource);
  });
  static readonly layer: Layer.Layer<
    DataImportBootstrapDI,
    never,
    | Context.Service.Identifier<typeof MenuService>
    | Context.Service.Identifier<typeof ActionService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof DataImportService>
    | Context.Service.Identifier<typeof ConnectionInfoResource>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const DataImportBootstrap = DataImportBootstrapDI;
