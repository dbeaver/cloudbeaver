/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2022 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */

import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { Bootstrap, injectable } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource, SessionExpireService, SessionResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

import { SessionExpireWarningDialog } from './SessionExpireWarningDialog';

const WARN_IN = 5 * 1000 * 60;
const POLL_INTERVAL = 1 * 1000 * 60;

@injectable()
export class SessionExpireWarningDialogService extends Bootstrap {
  private dialogInternalPromise: Promise<DialogueStateResult | null> | null;

  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly sessionExpireService: SessionExpireService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly sessionResource: SessionResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly graphQLService: GraphQLService
  ) {
    super();
    this.dialogInternalPromise = null;
  }

  register(): void {
    this.sessionExpireService.onSessionExpire.addHandler(this.close.bind(this));
  }

  load(): void {
    this.startSessionPolling();
  }

  private startSessionPolling() {
    const checkSessionStatus = async () => {
      if (
        !this.serverConfigResource.data?.anonymousAccessEnabled
        && !this.userInfoResource.data
        && !this.serverConfigResource.configurationMode
      ) {
        return;
      }

      const { sessionState } = await this.graphQLService.sdk.sessionState();

      if (!sessionState.valid) {
        this.sessionExpireService.sessionExpired();
        return;
      }

      const sessionDuration = this.serverConfigResource.data?.sessionExpireTime;

      if (this.sessionExpireService.expired || !sessionDuration || sessionDuration < WARN_IN) {
        this.close();
        return;
      }

      const remainingTime = sessionState.expireAfterSeconds * 1000;

      if (remainingTime < WARN_IN) {
        this.open();
      } else {
        this.close();
      }
    };

    const poll = async () => {
      await checkSessionStatus();
      setTimeout(poll, POLL_INTERVAL);
    };

    setTimeout(poll, POLL_INTERVAL);
  }

  private async open(): Promise<void> {
    if (!this.dialogInternalPromise) {
      this.dialogInternalPromise = this.commonDialogService.open(SessionExpireWarningDialog, null);
      await this.dialogInternalPromise;
      this.dialogInternalPromise = null;

      if (!this.sessionExpireService.expired) {
        const { sessionState } = await this.graphQLService.sdk.sessionState();

        if (sessionState.valid) {
          await this.sessionResource.refreshSilent();
        } else {
          this.sessionExpireService.sessionExpired();
        }
      }
    }
  }

  private close(): void {
    if (this.dialogInternalPromise) {
      this.commonDialogService.rejectDialog(this.dialogInternalPromise);
    }
  }
}
