/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Disposable, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { SqlQueryService, SqlScriptErrorContext, type ISqlScriptQueryError } from './SqlQueryService.js';

const SqlScriptErrorDialog = importLazyComponent(() => import('./SqlScriptErrorDialog.js').then(module => module.SqlScriptErrorDialog));

@injectable(() => [SqlQueryService, CommonDialogService])
export class SqlScriptErrorService extends Disposable {
  constructor(
    private readonly sqlQueryService: SqlQueryService,
    private readonly commonDialogService: CommonDialogService,
  ) {
    super();
    this.handleError = this.handleError.bind(this);
  }

  register(): void {
    this.sqlQueryService.onScriptQueryError.addHandler(this.handleError);
  }

  private async handleError({ model, query, error }: ISqlScriptQueryError, contexts: IExecutionContextProvider<ISqlScriptQueryError>): Promise<void> {
    const context = contexts.getContext(SqlScriptErrorContext);

    if (context.resolution !== undefined) {
      return;
    }

    let currentError = error;

    while (!model.source.cancelled) {
      const { status, result } = await this.commonDialogService.open(SqlScriptErrorDialog, { query, error: currentError });
      const action = status === DialogueStateResult.Resolved ? (result ?? 'stop') : 'stop';

      if (model.source.cancelled) {
        break;
      }

      if (action !== 'retry') {
        context.setResolution(action);
        return;
      }

      try {
        await model.retry();

        context.setResolution('recovered');

        return;
      } catch (exception: any) {
        currentError = exception;
      }
    }

    context.setResolution('stop');
  }

  protected override dispose(): void {
    this.sqlQueryService.onScriptQueryError.removeHandler(this.handleError);
  }
}
