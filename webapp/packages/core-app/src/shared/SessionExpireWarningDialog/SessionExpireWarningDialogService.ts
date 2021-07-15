/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2021 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { SessionExpireService, SessionResource } from '@cloudbeaver/core-root';

import { SessionExpireWarningDialog } from '../SessionExpireWarningDialog/SessionExpireWarningDialog';

@injectable()
export class SessionExpireWarningDialogService extends Bootstrap {
  private dialogInternalPromise: Promise<DialogueStateResult | null> | null;

  constructor(
    private commonDialogService: CommonDialogService,
    private sessionExpireService: SessionExpireService,
    private sessionResource: SessionResource,
  ) {
    super();
    this.dialogInternalPromise = null;
  }

  register(): void {
    this.sessionExpireService.onSessionExpire.addHandler(this.handleSessionExpired.bind(this));
    this.sessionExpireService.onSessionExpireWarning.addHandler(this.open.bind(this));
  }

  load(): void | Promise<void> { }

  private async open(): Promise<void> {
    if (!this.dialogInternalPromise) {
      this.dialogInternalPromise = this.commonDialogService.open(SessionExpireWarningDialog, null);
      await this.dialogInternalPromise;

      if (this.dialogInternalPromise) {
        await this.sessionResource.refreshSilent();
        this.dialogInternalPromise = null;
      }
    }
  }

  private handleSessionExpired(): void {
    if (this.dialogInternalPromise) {
      this.commonDialogService.rejectDialog(this.dialogInternalPromise);
      this.dialogInternalPromise = null;
    }
  }
}
