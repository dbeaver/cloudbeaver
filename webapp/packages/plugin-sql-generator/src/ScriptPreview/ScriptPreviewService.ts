/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { createConnectionParam, type IConnectionInfoParams } from '@cloudbeaver/core-connections';
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, ResultDataFormat, type UpdateResultsDataBatchScriptMutationVariables } from '@cloudbeaver/core-sdk';
import { DocumentEditAction, type IDatabaseDataModel, ResultSetDataSource, ResultSetEditAction } from '@cloudbeaver/plugin-data-viewer';

const ScriptPreviewDialog = importLazyComponent(() => import('./ScriptPreviewDialog.js').then(m => m.ScriptPreviewDialog));

@injectable()
export class ScriptPreviewService {
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
