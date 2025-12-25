/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog, type ConfirmationDialogResult } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult, type DialogResult } from '@cloudbeaver/core-dialogs';
import { executorHandlerFilter } from '@cloudbeaver/core-executor';
import {
  AsyncTaskInfoService,
  ClientEventId,
  ServerEventId,
  type IBaseAsyncTaskEvent,
  AsyncTaskInfoEventHandler,
  AsyncTask,
} from '@cloudbeaver/core-root';
import type { WsSessionTaskConfirmationEvent, WsSessionTaskQueryConfirmationRequestEvent } from '@cloudbeaver/core-sdk';
import { renderQueryForConfirmation } from './renderQueryForConfirmation.js';

@injectable(() => [AsyncTaskInfoService, CommonDialogService, AsyncTaskInfoEventHandler])
export class SqlQueryAsyncTaskConfirmationBootstrap extends Bootstrap {
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
