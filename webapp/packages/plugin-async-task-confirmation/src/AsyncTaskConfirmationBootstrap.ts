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
import { AsyncTask, AsyncTaskInfoService, ClientEventId, ServerEventId, type IBaseAsyncTaskEvent } from '@cloudbeaver/core-root';
import { AsyncTaskInfoEventHandler } from '@cloudbeaver/core-root/AsyncTask/AsyncTaskInfoEventHandler.js';
import type { WsSessionTaskConfirmationEvent, WsSessionTaskConfirmationRequestEvent } from '@cloudbeaver/core-sdk';

export class AsyncTaskConfirmationBootstrapImpl extends Bootstrap {
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
      executorHandlerFilter(event => event.id === ServerEventId.CbSessionTaskConfirmationRequest, this.handleEvent),
    );
  }

  private async handleEvent(event: IBaseAsyncTaskEvent) {
    const confirmationEvent = event as WsSessionTaskConfirmationRequestEvent;
    const dialogPromise = this.commonDialogService.open(ConfirmationDialog, {
      title: confirmationEvent.title,
      message: confirmationEvent.message,
      icon: '/icons/preload/warning_icon_sm.svg',
      size: 'medium',
      showSkipConfirmations: true,
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

export type AsyncTaskConfirmationBootstrap = AsyncTaskConfirmationBootstrapImpl;

export class AsyncTaskConfirmationBootstrapDI extends Context.Service<AsyncTaskConfirmationBootstrapDI, AsyncTaskConfirmationBootstrapImpl>()(
  '@cloudbeaver/plugin-async-task-confirmation/AsyncTaskConfirmationBootstrap#AsyncTaskConfirmationBootstrap',
) {
  static readonly implementation = AsyncTaskConfirmationBootstrapImpl;

  static readonly dependencies = () => [AsyncTaskInfoService, CommonDialogService, AsyncTaskInfoEventHandler] as const;
  static readonly make: Effect.Effect<
    AsyncTaskConfirmationBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof AsyncTaskInfoService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof AsyncTaskInfoEventHandler>
  > = Effect.gen(function* makeAsyncTaskConfirmationBootstrap() {
    const asyncTaskInfoService = yield* AsyncTaskInfoService;
    const commonDialogService = yield* CommonDialogService;
    const asyncTaskInfoEventHandler = yield* AsyncTaskInfoEventHandler;

    return new AsyncTaskConfirmationBootstrapImpl(asyncTaskInfoService, commonDialogService, asyncTaskInfoEventHandler);
  });
  static readonly layer: Layer.Layer<
    AsyncTaskConfirmationBootstrapDI,
    never,
    | Context.Service.Identifier<typeof AsyncTaskInfoService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof AsyncTaskInfoEventHandler>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const AsyncTaskConfirmationBootstrap = AsyncTaskConfirmationBootstrapDI;
