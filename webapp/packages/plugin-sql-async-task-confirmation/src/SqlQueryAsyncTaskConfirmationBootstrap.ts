/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2025 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ConfirmationDialog } from '@cloudbeaver/core-blocks';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { executorHandlerFilter } from '@cloudbeaver/core-executor';
import { AsyncTaskInfoService, ClientEventId, ServerEventId, type IBaseAsyncTaskEvent, AsyncTaskInfoEventHandler } from '@cloudbeaver/core-root';
import type { CbSessionTaskConfirmationEvent, WsServerSessionTaskQueryConfirmationRequestEvent } from '@cloudbeaver/core-sdk';
import { renderQueryForConfirmation } from './renderQueryForConfirmation.js';

@injectable(() => [AsyncTaskInfoService, CommonDialogService, AsyncTaskInfoEventHandler])
export class SqlQueryAsyncTaskConfirmationBootstrap extends Bootstrap {
  constructor(
    private readonly asyncTaskInfoService: AsyncTaskInfoService,
    private readonly commonDialogService: CommonDialogService,
    private readonly asyncTaskInfoEventHandler: AsyncTaskInfoEventHandler,
  ) {
    super();
    this.handleEvent = this.handleEvent.bind(this);
    asyncTaskInfoService.onExecuteEvent.addHandler(
      executorHandlerFilter(event => event.id === ServerEventId.CbSessionTaskQueryConfirmationRequest, this.handleEvent),
    );
  }

  private async handleEvent(event: IBaseAsyncTaskEvent) {
    const confirmationEvent = event as WsServerSessionTaskQueryConfirmationRequestEvent;
    const { status, result } = await this.commonDialogService.open(ConfirmationDialog, {
      title: confirmationEvent.title,
      message: confirmationEvent.message,
      showSkipConfirmations: true,
      children: () => renderQueryForConfirmation(confirmationEvent.query),
    });

    this.asyncTaskInfoEventHandler.emit<CbSessionTaskConfirmationEvent>({
      id: ClientEventId.CbClientSessionTaskConfirmation,
      taskId: confirmationEvent.taskId,
      confirmed: status === DialogueStateResult.Resolved,
      skipConfirmations: result?.skipConfirmations || false,
    });
  }

  protected override dispose(): Promise<void> | void {
    this.asyncTaskInfoService.onExecuteEvent.removeHandler(this.handleEvent);
  }
}
