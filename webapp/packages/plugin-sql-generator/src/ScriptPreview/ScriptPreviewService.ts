/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { createConnectionParam, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, ResultDataFormat, type UpdateResultsDataBatchScriptMutationVariables } from '@cloudbeaver/core-sdk';
import { DocumentEditAction, ResultSetDataSource, ResultSetEditAction, type IDatabaseDataModel } from '@cloudbeaver/plugin-data-viewer';

const ScriptPreviewDialog = importLazyComponent(() => import('./ScriptPreviewDialog.js').then(m => m.ScriptPreviewDialog));

export class ScriptPreviewServiceImpl {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {}

  async open(model: IDatabaseDataModel<ResultSetDataSource>, resultIndex: number): Promise<void> {
    try {
      const script = await model.source.runOperation(() => this.tryGetScript(model, resultIndex));

      if (script === null) {
        throw new Error('Script is not provided');
      }

      let connectionKey: IConnectionInfoParams | null = null;

      if (model.source.executionContext?.context) {
        connectionKey = createConnectionParam(model.source.executionContext.context.projectId, model.source.executionContext.context.connectionId);
      }

      await this.commonDialogService.open(ScriptPreviewDialog, {
        script,
        connectionKey,
        onApply: () => model.save(),
      });
    } catch (exception: any) {
      this.notificationService.logException(exception, 'data_viewer_script_preview_error_title');
    }
  }

  private async tryGetScript(model: IDatabaseDataModel<ResultSetDataSource>, resultIndex: number): Promise<string> {
    const executionContext = model.source.executionContext?.context;

    if (!executionContext) {
      throw new Error('Execution context is not provided');
    }

    const result = model.source.getResult(resultIndex);

    if (!result || !result.id) {
      throw new Error(`There is no result for provided result index: '${resultIndex}'`);
    }

    const updateVariables: UpdateResultsDataBatchScriptMutationVariables = {
      projectId: executionContext.projectId,
      connectionId: executionContext.connectionId,
      contextId: executionContext.id,
      resultsId: result.id,
    };

    let editor: ResultSetEditAction | DocumentEditAction | undefined;

    if (result.dataFormat === ResultDataFormat.Resultset) {
      editor = model.source.getAction(result, ResultSetEditAction);
      editor.fillBatch(updateVariables);
    } else if (result.dataFormat === ResultDataFormat.Document) {
      editor = model.source.getAction(result, DocumentEditAction);
      editor.fillBatch(updateVariables);
    }

    const response = await this.graphQLService.sdk.updateResultsDataBatchScript(updateVariables);

    return response.result;
  }
}

export type ScriptPreviewService = ScriptPreviewServiceImpl;

export class ScriptPreviewServiceDI extends Context.Service<ScriptPreviewServiceDI, ScriptPreviewServiceImpl>()(
  '@cloudbeaver/plugin-sql-generator/ScriptPreview/ScriptPreviewService#ScriptPreviewService',
) {
  static readonly implementation = ScriptPreviewServiceImpl;

  static readonly dependencies = () => [GraphQLService, CommonDialogService, NotificationService] as const;
  static readonly make: Effect.Effect<
    ScriptPreviewServiceImpl,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof NotificationService>
  > = Effect.gen(function* makeScriptPreviewService() {
    const graphQLService = yield* GraphQLService;
    const commonDialogService = yield* CommonDialogService;
    const notificationService = yield* NotificationService;

    return new ScriptPreviewServiceImpl(graphQLService, commonDialogService, notificationService);
  });
  static readonly layer: Layer.Layer<
    ScriptPreviewServiceDI,
    never,
    | Context.Service.Identifier<typeof GraphQLService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof NotificationService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const ScriptPreviewService = ScriptPreviewServiceDI;
