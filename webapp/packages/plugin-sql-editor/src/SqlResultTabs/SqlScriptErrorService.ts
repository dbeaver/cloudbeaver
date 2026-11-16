/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Context, Disposable, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import type { IExecutionContextProvider } from '@cloudbeaver/core-executor';

import { SqlQueryService, SqlScriptErrorContext, type ISqlScriptQueryError } from './SqlQueryService.js';

const SqlScriptErrorDialog = importLazyComponent(() => import('./SqlScriptErrorDialog.js').then(module => module.SqlScriptErrorDialog));

export class SqlScriptErrorServiceImpl extends Disposable {
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

export type SqlScriptErrorService = SqlScriptErrorServiceImpl;

export class SqlScriptErrorServiceDI extends Context.Service<SqlScriptErrorServiceDI, SqlScriptErrorServiceImpl>()(
  '@cloudbeaver/plugin-sql-editor/SqlResultTabs/SqlScriptErrorService#SqlScriptErrorService',
) {
  static readonly implementation = SqlScriptErrorServiceImpl;

  static readonly dependencies = () => [SqlQueryService, CommonDialogService] as const;
  static readonly make: Effect.Effect<
    SqlScriptErrorServiceImpl,
    never,
    Context.Service.Identifier<typeof SqlQueryService> | Context.Service.Identifier<typeof CommonDialogService>
  > = Effect.gen(function* makeSqlScriptErrorService() {
    const sqlQueryService = yield* SqlQueryService;
    const commonDialogService = yield* CommonDialogService;

    return new SqlScriptErrorServiceImpl(sqlQueryService, commonDialogService);
  });
  static readonly layer: Layer.Layer<
    SqlScriptErrorServiceDI,
    never,
    Context.Service.Identifier<typeof SqlQueryService> | Context.Service.Identifier<typeof CommonDialogService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlScriptErrorService = SqlScriptErrorServiceDI;
