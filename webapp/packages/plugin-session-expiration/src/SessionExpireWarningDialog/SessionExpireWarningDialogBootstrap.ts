/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { UserInfoResource } from '@cloudbeaver/core-authentication';
import { importLazyComponent } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, disposeService, Effect, Layer } from '@cloudbeaver/core-di';
import { CommonDialogService, type DialogResult } from '@cloudbeaver/core-dialogs';
import { ServerConfigResource, SESSION_EXPIRE_MIN_TIME, SessionExpireService, SessionResource } from '@cloudbeaver/core-root';
import { GraphQLService } from '@cloudbeaver/core-sdk';

const SessionExpireWarningDialog = importLazyComponent(() => import('./SessionExpireWarningDialog.js').then(m => m.SessionExpireWarningDialog));

export class SessionExpireWarningDialogBootstrapImpl extends Bootstrap {
  private dialogInternalPromise: Promise<DialogResult> | null;
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

  override register(): void {
    this.sessionExpireService.onSessionExpire.addHandler(this.close.bind(this));
    this.sessionResource.onDataUpdate.addHandler(() => {
      const { valid, remainingTime } = this.sessionResource.data || {};

      this.handleSessionResourceDataUpdate(valid, remainingTime);
    });
  }

  private handleSessionResourceDataUpdate(isValid?: boolean, remainingTime?: number) {
    if (!this.serverConfigResource.configurationMode && !this.userInfoResource.hasAccess()) {
      return;
    }

    if (!isValid) {
      this.close();
      this.sessionExpireService.sessionExpired();

      return;
    }

    const sessionDuration = this.serverConfigResource.data?.sessionExpireTime;

    if (this.sessionExpireService.expired || !sessionDuration || sessionDuration < SESSION_EXPIRE_MIN_TIME) {
      this.close();
      return;
    }

    if (remainingTime !== undefined && remainingTime <= SESSION_EXPIRE_MIN_TIME) {
      this.open();
    } else {
      this.close();
    }
  }

  private async open(): Promise<void> {
    if (!this.dialogInternalPromise) {
      this.dialogInternalPromise = this.commonDialogService.open(SessionExpireWarningDialog, undefined);
      await this.dialogInternalPromise;
      this.dialogInternalPromise = null;

      if (!this.sessionExpireService.expired) {
        const { sessionState } = await this.graphQLService.sdk.sessionState();

        if (sessionState.valid) {
          this.sessionResource.pingSession();
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

export type SessionExpireWarningDialogBootstrap = SessionExpireWarningDialogBootstrapImpl;

export class SessionExpireWarningDialogBootstrapDI extends Context.Service<
  SessionExpireWarningDialogBootstrapDI,
  SessionExpireWarningDialogBootstrapImpl
>()('@cloudbeaver/plugin-session-expiration/SessionExpireWarningDialog/SessionExpireWarningDialogBootstrap#SessionExpireWarningDialogBootstrap') {
  static readonly implementation = SessionExpireWarningDialogBootstrapImpl;

  static readonly dependencies = () =>
    [CommonDialogService, SessionExpireService, ServerConfigResource, SessionResource, UserInfoResource, GraphQLService] as const;
  static readonly make: Effect.Effect<
    SessionExpireWarningDialogBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof SessionExpireService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof SessionResource>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof GraphQLService>
  > = Effect.gen(function* makeSessionExpireWarningDialogBootstrap() {
    const commonDialogService = yield* CommonDialogService;
    const sessionExpireService = yield* SessionExpireService;
    const serverConfigResource = yield* ServerConfigResource;
    const sessionResource = yield* SessionResource;
    const userInfoResource = yield* UserInfoResource;
    const graphQLService = yield* GraphQLService;

    return new SessionExpireWarningDialogBootstrapImpl(
      commonDialogService,
      sessionExpireService,
      serverConfigResource,
      sessionResource,
      userInfoResource,
      graphQLService,
    );
  });
  static readonly layer: Layer.Layer<
    SessionExpireWarningDialogBootstrapDI,
    never,
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof SessionExpireService>
    | Context.Service.Identifier<typeof ServerConfigResource>
    | Context.Service.Identifier<typeof SessionResource>
    | Context.Service.Identifier<typeof UserInfoResource>
    | Context.Service.Identifier<typeof GraphQLService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionExpireWarningDialogBootstrap = SessionExpireWarningDialogBootstrapDI;
