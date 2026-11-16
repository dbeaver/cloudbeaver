/*
 * CloudBeaver - Cloud Database Manager
 * Copyright (C) 2020-2026 DBeaver Corp and others
 *
 * Licensed under the Apache License, Version 2.0.
 * you may not use this file except in compliance with the License.
 */
import { ActionSnackbar } from '@cloudbeaver/core-blocks';
import { Bootstrap, Context, Effect, Layer, disposeService } from '@cloudbeaver/core-di';
import { CommonDialogService, DialogueStateResult } from '@cloudbeaver/core-dialogs';
import { ENotificationType, NotificationService } from '@cloudbeaver/core-events';
import { SessionExpireService } from '@cloudbeaver/core-root';
import { RouterService } from '@cloudbeaver/core-routing';

import { SessionExpiredDialog } from './SessionExpiredDialog.js';

export class SessionExpiredDialogBootstrapImpl extends Bootstrap {
  constructor(
    private readonly routerService: RouterService,
    private readonly notificationService: NotificationService,
    private readonly commonDialogService: CommonDialogService,
    private readonly sessionExpireService: SessionExpireService,
  ) {
    super();
  }

  override register(): void {
    this.sessionExpireService.onSessionExpire.addPostHandler(this.handleSessionExpired.bind(this));
  }

  private async handleSessionExpired(): Promise<void> {
    const { status } = await this.commonDialogService.open(SessionExpiredDialog, null);

    if (status === DialogueStateResult.Rejected) {
      this.notificationService.customNotification(
        () => ActionSnackbar,
        {
          actionText: 'ui_processing_reload',
          onAction: () => this.routerService.reload(),
        },
        { title: 'app_root_session_expired_title', persistent: true, type: ENotificationType.Error },
      );
    }
  }
}

export type SessionExpiredDialogBootstrap = SessionExpiredDialogBootstrapImpl;

export class SessionExpiredDialogBootstrapDI extends Context.Service<SessionExpiredDialogBootstrapDI, SessionExpiredDialogBootstrapImpl>()(
  '@cloudbeaver/plugin-session-expiration/SessionExpireDialog/SessionExpiredDialogBootstrap#SessionExpiredDialogBootstrap',
) {
  static readonly implementation = SessionExpiredDialogBootstrapImpl;

  static readonly dependencies = () => [RouterService, NotificationService, CommonDialogService, SessionExpireService] as const;
  static readonly make: Effect.Effect<
    SessionExpiredDialogBootstrapImpl,
    never,
    | Context.Service.Identifier<typeof RouterService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof SessionExpireService>
  > = Effect.gen(function* makeSessionExpiredDialogBootstrap() {
    const routerService = yield* RouterService;
    const notificationService = yield* NotificationService;
    const commonDialogService = yield* CommonDialogService;
    const sessionExpireService = yield* SessionExpireService;

    return new SessionExpiredDialogBootstrapImpl(routerService, notificationService, commonDialogService, sessionExpireService);
  });
  static readonly layer: Layer.Layer<
    SessionExpiredDialogBootstrapDI,
    never,
    | Context.Service.Identifier<typeof RouterService>
    | Context.Service.Identifier<typeof NotificationService>
    | Context.Service.Identifier<typeof CommonDialogService>
    | Context.Service.Identifier<typeof SessionExpireService>
  > = Layer.effect(
    this,
    Effect.acquireRelease(this.make, value => Effect.promise(() => disposeService(value))),
  );
}

export const SessionExpiredDialogBootstrap = SessionExpiredDialogBootstrapDI;
