/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog, type ConfirmationDialogResult } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, type DialogResult } from '@cloudbeaver/core-dialogs';
import { executorHandlerFilter } from '@cloudbeaver/core-executor';
import {
  AsyncTask,
  AsyncTaskInfoEventHandler,
  AsyncTaskInfoService,
  ClientEventId,
  ServerEventId,
  type IBaseAsyncTaskEvent,
} from '@cloudbeaver/core-root';
import type { WsSessionTaskConfirmationEvent, WsSessionTaskQueryConfirmationRequestEvent } from '@cloudbeaver/core-sdk';
import { renderQueryForConfirmation } from './renderQueryForConfirmation.js';

export class SqlQueryAsyncTaskConfirmationBootstrapImpl extends Bootstrap {
  private pendingConfirmations: Map<string, Promise<DialogResult<ConfirmationDialogResult>>> = new Map();
  constructor(
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly commonDialogService: CommonDialogService,
    private readonly asyncTaskInfoEventHandler: AsyncTaskInfoEventHandler,
  ) {
    super();
    this.pendingConfirmations = new Map();
    this.handleEvent = this.handleEvent.bind(this);
    this.handleTaskUpdated = this.handleTaskUpdated.bind(this);
    this.asyncTaskInfoService.onTaskUpdated.addHandler(this.handleTaskUpdated);
    asyncTaskInfoService.onExecuteEvent.addHandler(
      executorHandlerFilter(event => event.id === ServerEventId.CbSessionTaskQueryConfirmationRequest, this.handleEvent),
    );
  }

  private async handleEvent(event: IBaseAsyncTaskEvent) {
    const confirmationEvent = event as WsSessionTaskQueryConfirmationRequestEvent;
    const dialogPromise = this.commonDialogService.open(ConfirmationDialog, {
      title: confirmationEvent.title,
      message: confirmationEvent.message,
      icon: '/icons/preload/warning_icon_sm.svg',
      showSkipConfirmations: true,
      size: 'large',
      children: () => renderQueryForConfirmation(confirmationEvent.query),
    });

    this.pendingConfirmations.set(confirmationEvent.taskId, dialogPromise);

    try {
      const { status, result } = await dialogPromise;

      this.asyncTaskInfoEventHandler.emit<WsSessionTaskConfirmationEvent>({
        id: ClientEventId.CbClientSessionTaskConfirmation,
        taskId: confirmationEvent.taskId,
        confirmed: status === DialogueStateResult.Resolved,
        skipConfirmations: result?.skipConfirmations || false,
      });
    } finally {
      this.pendingConfirmations.delete(confirmationEvent.taskId);
    }
  }

  private handleTaskUpdated(task: AsyncTask) {
    if (!task.info?.running && task.info?.id) {
      const confirmationPromise = this.pendingConfirmations.get(task.info.id);

      if (!confirmationPromise) {
        return;
      }

      this.commonDialogService.rejectDialog(confirmationPromise);
    }
  }

  protected override dispose(): Promise<void> | void {
    this.asyncTaskInfoService.onTaskUpdated.removeHandler(this.handleTaskUpdated);
    this.asyncTaskInfoService.onExecuteEvent.removeHandler(this.handleEvent);
  }
}

export type SqlQueryAsyncTaskConfirmationBootstrap = SqlQueryAsyncTaskConfirmationBootstrapImpl;

export class SqlQueryAsyncTaskConfirmationBootstrapDI extends Context.Service<
  SqlQueryAsyncTaskConfirmationBootstrapDI,
  SqlQueryAsyncTaskConfirmationBootstrapImpl
>()('@cloudbeaver/plugin-sql-async-task-confirmation/SqlQueryAsyncTaskConfirmationBootstrap#SqlQueryAsyncTaskConfirmationBootstrap') {
  static readonly implementation = SqlQueryAsyncTaskConfirmationBootstrapImpl;

  static readonly dependencies = () => [AsyncTaskInfoService, CommonDialogService, AsyncTaskInfoEventHandler] as const;
  static readonly make: Effect.Effect<
    SqlQueryAsyncTaskConfirmationBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof AsyncTaskInfoService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof AsyncTaskInfoEventHandler>
  > = Effect.gen(function* makeSqlQueryAsyncTaskConfirmationBootstrap() {
    const asyncTaskInfoService = yield* AsyncTaskInfoService;
    const commonDialogService = yield* CommonDialogService;
    const asyncTaskInfoEventHandler = yield* AsyncTaskInfoEventHandler;

    return new SqlQueryAsyncTaskConfirmationBootstrapImpl(asyncTaskInfoService, commonDialogService, asyncTaskInfoEventHandler);
  });
  static readonly layer: Layer.Layer<
    SqlQueryAsyncTaskConfirmationBootstrapDI,
    never,
    | Context.Service.Identifier<typeof AsyncTaskInfoService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof AsyncTaskInfoEventHandler>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SqlQueryAsyncTaskConfirmationBootstrap = SqlQueryAsyncTaskConfirmationBootstrapDI;
