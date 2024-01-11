/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2024 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { injectable } from '@cloudbeaver/core-di';
import { CommonDialogService } from '@cloudbeaver/core-dialogs';
import { NotificationService } from '@cloudbeaver/core-events';
import { GraphQLService, ResultDataFormat, UpdateResultsDataBatchScriptMutationVariables } from '@cloudbeaver/core-sdk';
import { importLazyComponent } from '@cloudbeaver/core-utils';
import { DocumentEditAction, type IDatabaseDataModel, ResultSetEditAction } from '@cloudbeaver/plugin-data-viewer';

const ScriptPreviewDialog = importLazyComponent(() => import('./ScriptPreviewDialog').then(m => m.ScriptPreviewDialog));

@injectable()
export class ScriptPreviewService {
  constructor(
    private readonly graphQLService: GraphQLService,
    private readonly commonDialogService: CommonDialogService,
    private readonly notificationService: NotificationService,
  ) {}

  async open(model: IDatabaseDataModel, resultIndex: number): Promise<void> {
    try {
      const script = await model.source.runTask(() => this.tryGetScript(model, resultIndex));

      this.commonDialogService.open(ScriptPreviewDialog, {
        script,
        model,
      });
    } catch (exception: any) {
      this.notificationService.logException(exception, 'data_viewer_script_preview_error_title');
    }
  }

  private async tryGetScript(model: IDatabaseDataModel, resultIndex: number): Promise<string> {
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
