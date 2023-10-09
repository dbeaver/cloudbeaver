/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2023 DBeaver Corp and others
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

@injectable()
export class SessionExpireWarningDialogBootstrap extends Bootstrap {
  private dialogInternalPromise: Promise<DialogueStateResult | null> | null;
  constructor(
    private readonly commonDialogService: CommonDialogService,
    private readonly sessionExpireService: SessionExpireService,
    private readonly serverConfigResource: ServerConfigResource,
    private readonly sessionResource: SessionResource,
    private readonly userInfoResource: UserInfoResource,
    private readonly graphQLService: GraphQLService,
  ) {
    super();
    this.dialogInternalPromise = null;
  }

  register(): void {
    this.sessionExpireService.onSessionExpire.addHandler(this.close.bind(this));
    this.sessionResource.onStatusUpdate.addHandler((data, contexts) => {
      this.handleStateChange(data.isValid, data.remainingTime);
    });
  }

  load(): void {}

  private handleStateChange(isValid?: boolean, remainingTime?: number) {
    if (!this.serverConfigResource.anonymousAccessEnabled && !this.userInfoResource.data && !this.serverConfigResource.configurationMode) {
      return;
    }

    if (!isValid) {
      this.close();
      this.sessionExpireService.sessionExpired();
      return;
    }

    const sessionDuration = this.serverConfigResource.data?.sessionExpireTime;

    if (this.sessionExpireService.expired || !sessionDuration || sessionDuration < WARN_IN) {
      this.close();
      return;
    }

    if (remainingTime !== undefined && remainingTime < WARN_IN) {
      this.open();
    } else {
      this.close();
    }
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
